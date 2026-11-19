-- SJN staging-only fix, 2026-10-29: grade questions linked to
-- curated published Past Paper tests; preserve existing daily bank grading.
-- Project: aozknkrwafowsrehdwlr. NOT for production.
-- No table data changes, MCQ changes, History/Draft deletions or grants expansion.
-- Future SIBA/UHS/DOW year-wise tests are records in past_papers; the old
-- internal mcqs.bank metadata is NOT a new user-facing Question Bank.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE OR REPLACE FUNCTION public.sjn_submit_practice_attempt(p_submission_key uuid, p_items jsonb, p_title text DEFAULT 'Practice Test'::text, p_mode text DEFAULT 'tutor'::text, p_subject text DEFAULT 'Mixed'::text, p_selection jsonb DEFAULT '{}'::jsonb, p_elapsed_seconds integer DEFAULT NULL::integer)
 RETURNS TABLE(attempt_id bigint, total_questions integer, correct_answers integer, incorrect_answers integer, skipped_answers integer, accuracy_percent real, already_saved boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user uuid;
  v_fingerprint text;
  v_existing public.attempts%ROWTYPE;
  v_item jsonb;
  v_graded jsonb := '[]'::jsonb;
  v_row jsonb;
  v_item_id bigint;
  v_revision_id bigint;
  v_answer integer;
  v_key integer;
  v_seen bigint[] := '{}';
  v_total integer := 0;
  v_correct integer := 0;
  v_skipped integer := 0;
  v_incorrect integer;
  v_accuracy real;
  v_attempt_id bigint;
  v_title text;
  v_subject text;
  v_mode text;
BEGIN
  v_user := (SELECT auth.uid());
  IF v_user IS NULL OR (SELECT auth.role()) IS DISTINCT FROM 'authenticated' THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'Authentication required';
  END IF;
  IF p_submission_key IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Submission key is required';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR
     jsonb_array_length(p_items) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid practice question count';
  END IF;
  v_title := btrim(coalesce(p_title, ''));
  v_subject := btrim(coalesce(p_subject, ''));
  v_mode := btrim(coalesce(p_mode, ''));
  IF length(v_title) NOT BETWEEN 1 AND 120 OR
     length(v_subject) NOT BETWEEN 1 AND 100 OR
     v_mode NOT IN ('tutor','timed') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid practice test metadata';
  END IF;
  IF p_selection IS NULL OR jsonb_typeof(p_selection) IS DISTINCT FROM 'object' OR
     octet_length(p_selection::text) > 8192 OR
     p_elapsed_seconds IS NULL OR p_elapsed_seconds NOT BETWEEN 0 AND 86400 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid practice selection or duration';
  END IF;

  -- Account-level transaction lock: concurrent retries and submissions
  -- from the same student serialize. No table-wide or global lock.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sjn-practice-submit:' || v_user::text, 20261018)
  );
  -- Derive the idempotency fingerprint inside the database, not from an
  -- attacker-controlled summary/score.
  v_fingerprint := pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(pg_catalog.jsonb_build_object(
        'items', p_items, 'title', v_title, 'subject', v_subject,
        'mode', v_mode, 'selection', p_selection,
        'elapsedSeconds', p_elapsed_seconds
      )::text, 'UTF8'),
      'sha256'
    ), 'hex'
  );

  SELECT a.* INTO v_existing FROM public.attempts AS a
  WHERE a.user_id = v_user AND a.submission_key = p_submission_key
  LIMIT 1;
  IF FOUND THEN
    IF v_existing.submission_fingerprint IS DISTINCT FROM v_fingerprint
       OR v_existing.details_version <> 1 THEN
      RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'Submission key already used for different answers';
    END IF;
    RETURN QUERY SELECT
      v_existing.id, v_existing.total, v_existing.correct,
      (v_existing.total - v_existing.correct -
        (SELECT count(*)::integer FROM public.attempt_items i
         WHERE i.attempt_id = v_existing.id AND i.selected_index IS NULL)),
      (SELECT count(*)::integer FROM public.attempt_items i
       WHERE i.attempt_id = v_existing.id AND i.selected_index IS NULL),
      v_existing.accuracy, TRUE;
    RETURN;
  END IF;

  -- A modest rate limit limits abuse even when users call the RPC directly.
  -- Retries of the exact same key are checked above and do not consume quota.
  IF (SELECT count(*) FROM public.attempts a
      WHERE a.user_id = v_user AND a.created_at > now() - interval '60 seconds') >= 12 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Too many practice submissions; try later';
  END IF;

  FOR v_item IN SELECT value FROM pg_catalog.jsonb_array_elements(p_items) LOOP
    IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' OR
       NOT (v_item ?& ARRAY['mcqId','revisionId','selectedIndex']) OR
       (v_item - 'mcqId' - 'revisionId' - 'selectedIndex') <> '{}'::jsonb OR
       jsonb_typeof(v_item->'mcqId') IS DISTINCT FROM 'number' OR
       jsonb_typeof(v_item->'revisionId') IS DISTINCT FROM 'number' OR
       (v_item->>'mcqId') !~ '^[1-9][0-9]{0,17}$' OR
       (v_item->>'revisionId') !~ '^[1-9][0-9]{0,17}$' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid practice question identity';
    END IF;
    v_item_id := (v_item->>'mcqId')::bigint;
    v_revision_id := (v_item->>'revisionId')::bigint;
    IF v_item_id = ANY(v_seen) THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Duplicate question in attempt';
    END IF;
    v_seen := pg_catalog.array_append(v_seen, v_item_id);

    IF jsonb_typeof(v_item->'selectedIndex') = 'null' THEN
      v_answer := NULL;
    ELSIF jsonb_typeof(v_item->'selectedIndex') = 'number' AND
          (v_item->>'selectedIndex') ~ '^[0-3]$' THEN
      v_answer := (v_item->>'selectedIndex')::integer;
    ELSE
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Selected option must be A-D or skipped';
    END IF;

    -- Never trust browser-supplied keys, scores, text, or revision ownership.
    -- Accept ordinary Question Bank items OR any question assigned to a
    -- published curated Past Paper. The paper is a TEST in past_papers,
    -- not a user-facing bank per conducting body/year. No annual whitelist.
    SELECT r.correct_index INTO v_key
    FROM public.mcqs m
    JOIN public.mcq_revisions r
      ON r.id = m.current_revision_id AND r.mcq_id = m.id
    WHERE m.id = v_item_id
      AND m.current_revision_id = v_revision_id
      AND (
        m.bank IN ('Past Papers Question Bank','SJN Question Bank')
        OR EXISTS (
          SELECT 1
          FROM public.past_papers AS pp
          WHERE pg_catalog.jsonb_typeof(pp.mcq_ids_json) = 'array'
            AND pp.mcq_ids_json @> pg_catalog.jsonb_build_array(m.id)
        )
      )
      AND r.bank = m.bank;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'A question has changed or is unavailable; restart this practice test';
    END IF;
    v_total := v_total + 1;
    IF v_answer IS NULL THEN v_skipped := v_skipped + 1;
    ELSIF v_answer = v_key THEN v_correct := v_correct + 1;
    END IF;
    v_graded := v_graded || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'mcqId', v_item_id, 'revisionId', v_revision_id,
        'selectedIndex', v_answer, 'isCorrect', coalesce(v_answer = v_key, false)
      )
    );
  END LOOP;
  v_incorrect := v_total - v_correct - v_skipped;
  v_accuracy := (100.0 * v_correct / v_total)::real;

  INSERT INTO public.attempts (
    user_id, title, total, correct, accuracy, mode, subject, selection_json,
    details_version, submission_key, submission_fingerprint, elapsed_seconds
  ) VALUES (
    v_user, v_title, v_total, v_correct, v_accuracy, v_mode, v_subject,
    p_selection, 1, p_submission_key, v_fingerprint, p_elapsed_seconds
  ) RETURNING id INTO v_attempt_id;

  FOR v_row IN SELECT value FROM pg_catalog.jsonb_array_elements(v_graded) LOOP
    INSERT INTO public.attempt_items(
      attempt_id, user_id, position, mcq_id, mcq_revision_id,
      selected_index, is_correct
    ) VALUES (
      v_attempt_id, v_user,
      (SELECT count(*)::integer + 1 FROM public.attempt_items AS i
       WHERE i.attempt_id = v_attempt_id),
      (v_row->>'mcqId')::bigint, (v_row->>'revisionId')::bigint,
      (v_row->>'selectedIndex')::integer,
      (v_row->>'isCorrect')::boolean
    );
  END LOOP;
  RETURN QUERY SELECT v_attempt_id, v_total, v_correct, v_incorrect,
                      v_skipped, v_accuracy, FALSE;
END;
$function$;

-- Preserve the already-constrained, authenticated-only function execution.
REVOKE ALL ON FUNCTION public.sjn_submit_practice_attempt(uuid,jsonb,text,text,text,jsonb,integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sjn_submit_practice_attempt(uuid,jsonb,text,text,text,jsonb,integer)
  TO authenticated;

COMMIT;
