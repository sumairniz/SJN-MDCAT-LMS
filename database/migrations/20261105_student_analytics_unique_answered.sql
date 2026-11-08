-- Owner approved: Total Answered (including retakes) vs Unique Answered
-- (distinct MCQs with selected answer, skipped excluded), both period-scoped.
-- Read-only invoker/RLS function replacement; no stored attempt changes.
-- 2026-11-05 — owner approved date-scoped unique bank coverage and per-test
-- course subject/chapter expansion. RLS/SECURITY INVOKER retained from V1.
-- Read-only function replacement; no attempt or MCQ records changed.
-- Read-only authenticated student Analytics v1. No changes to attempt data.
-- Staging project only. Historical ungraded/summary-only attempts are excluded
-- from question analytics because their answers were never saved.
CREATE OR REPLACE FUNCTION public.sjn_student_analytics(
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_previous_from timestamptz DEFAULT NULL,
  p_previous_to timestamptz DEFAULT NULL,
  p_utc_offset_minutes integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path = ''
AS $body$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_result jsonb;
BEGIN
  IF v_uid IS NULL OR (SELECT auth.role()) IS DISTINCT FROM 'authenticated' THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000';
  END IF;
  IF (p_from IS NULL) <> (p_to IS NULL)
     OR (p_from IS NOT NULL AND p_from >= p_to)
     OR (p_previous_from IS NULL) <> (p_previous_to IS NULL)
     OR (p_previous_from IS NOT NULL AND p_previous_from >= p_previous_to)
     OR p_utc_offset_minutes NOT BETWEEN -720 AND 840 THEN
    RAISE EXCEPTION 'Invalid Analytics period' USING ERRCODE='22023';
  END IF;

  WITH
  chosen AS MATERIALIZED (
    SELECT a.id, a.title, a.created_at, a.selection_json, a.elapsed_seconds
    FROM public.attempts a
    WHERE a.user_id = v_uid AND a.details_version = 1
      AND (p_from IS NULL OR a.created_at >= p_from)
      AND (p_to IS NULL OR a.created_at < p_to)
  ),
  facts AS MATERIALIZED (
    SELECT
      a.id AS attempt_id, a.title, a.created_at, a.elapsed_seconds,
      i.mcq_id, i.selected_index, i.is_correct,
      r.bank, r.subject,
      COALESCE(NULLIF(BTRIM(r.chapter),''),'') AS chapter,
      CASE WHEN r.bank = 'SJN MedNest Course Tests' OR a.selection_json ? 'courseTestId' THEN ''
           ELSE COALESCE(NULLIF(BTRIM(r.topic),''),'') END AS topic,
      CASE
        WHEN r.bank = 'SJN MedNest Course Tests' OR a.selection_json ? 'courseTestId' THEN 'courses'
        WHEN r.bank = 'SJN Question Bank' THEN 'sjn'
        WHEN r.bank = 'Past Papers Question Bank' THEN 'pastbank'
        WHEN r.bank LIKE '%MDCAT Past Papers' THEN 'papers'
        ELSE 'other'
      END AS source_type,
      CASE WHEN r.bank = 'SJN MedNest Course Tests' OR a.selection_json ? 'courseTestId'
           THEN COALESCE(a.selection_json->>'courseTestId','')
           WHEN r.bank LIKE '%MDCAT Past Papers' THEN a.title
           ELSE '' END AS group_key
    FROM chosen a
    JOIN public.attempt_items i ON i.attempt_id=a.id AND i.user_id=v_uid
    JOIN public.mcq_revisions r ON r.id=i.mcq_revision_id AND r.mcq_id=i.mcq_id
  ),
  per_test AS MATERIALIZED (
    SELECT attempt_id, MAX(title) AS title, MAX(created_at) AS created_at,
      MAX(elapsed_seconds) AS elapsed_seconds, MAX(source_type) AS source_type,
      MAX(bank) AS bank, MAX(group_key) AS group_key,
      COUNT(*)::integer AS questions,
      COUNT(*) FILTER (WHERE selected_index IS NOT NULL)::integer AS answered,
      COUNT(*) FILTER (WHERE is_correct)::integer AS correct,
      COUNT(*) FILTER (WHERE selected_index IS NOT NULL AND NOT is_correct)::integer AS incorrect,
      COUNT(*) FILTER (WHERE selected_index IS NULL)::integer AS skipped
    FROM facts GROUP BY attempt_id
  ),
  totals AS (
    SELECT COUNT(*)::integer AS tests, COALESCE(SUM(questions),0)::integer AS questions,
      COALESCE(SUM(answered),0)::integer AS answered,
      COALESCE(SUM(correct),0)::integer AS correct,
      COALESCE(SUM(incorrect),0)::integer AS incorrect,
      COALESCE(SUM(skipped),0)::integer AS skipped,
      -- Unlike total answered instances, distinct IDs count once across retakes
      -- and across sources. Skipped-only MCQs never count as uniquely answered.
      (SELECT COUNT(DISTINCT mcq_id) FILTER (WHERE selected_index IS NOT NULL)::integer FROM facts) AS unique_answered,
      COALESCE(SUM(elapsed_seconds),0)::bigint AS elapsed_seconds
    FROM per_test
  ),
  daily AS (
    SELECT TO_CHAR(
        (created_at AT TIME ZONE 'UTC' +
           pg_catalog.make_interval(mins => p_utc_offset_minutes))::date,
        'YYYY-MM-DD') AS day,
      COUNT(*)::integer AS questions,
      COUNT(*) FILTER (WHERE selected_index IS NOT NULL)::integer AS answered,
      COUNT(*) FILTER (WHERE is_correct)::integer AS correct
    FROM facts GROUP BY 1
  ),
  grouped AS (
    SELECT source_type, bank, subject, chapter, topic, group_key,
      COUNT(*)::integer AS questions,
      COUNT(*) FILTER (WHERE selected_index IS NOT NULL)::integer AS answered,
      COUNT(*) FILTER (WHERE is_correct)::integer AS correct,
      COUNT(*) FILTER (WHERE selected_index IS NOT NULL AND NOT is_correct)::integer AS incorrect,
      COUNT(*) FILTER (WHERE selected_index IS NULL)::integer AS skipped,
      COUNT(DISTINCT mcq_id)::integer AS unique_questions
    FROM facts GROUP BY source_type,bank,subject,chapter,topic,group_key
  ),
  catalog AS (
    SELECT m.bank, m.subject,
      COALESCE(NULLIF(BTRIM(m.chapter),''),'') AS chapter,
      COALESCE(NULLIF(BTRIM(m.topic),''),'') AS topic,
      COUNT(*)::integer AS available
    FROM public.mcqs m
    WHERE m.bank IN ('SJN Question Bank','Past Papers Question Bank')
    GROUP BY m.bank,m.subject,
      COALESCE(NULLIF(BTRIM(m.chapter),''),''),
      COALESCE(NULLIF(BTRIM(m.topic),''),'')
  ),
  lifetime AS (
    SELECT m.bank, m.subject,
      COALESCE(NULLIF(BTRIM(m.chapter),''),'') AS chapter,
      COALESCE(NULLIF(BTRIM(m.topic),''),'') AS topic,
      COUNT(DISTINCT i.mcq_id)::integer AS covered
    FROM public.attempt_items i
    JOIN public.mcqs m ON m.id=i.mcq_id
    WHERE i.user_id=v_uid AND m.bank IN ('SJN Question Bank','Past Papers Question Bank')
    GROUP BY m.bank,m.subject,
      COALESCE(NULLIF(BTRIM(m.chapter),''),''),
      COALESCE(NULLIF(BTRIM(m.topic),''),'')
  ),
  period_coverage AS (
    -- Distinct bank MCQs that appeared in submitted attempts *in this period*.
    -- Inclusion of skipped items intentionally follows the practice-bank
    -- definition of covered, not the separate 'answered' measurement.
    SELECT m.bank, m.subject,
      COALESCE(NULLIF(BTRIM(m.chapter),''),'') AS chapter,
      COALESCE(NULLIF(BTRIM(m.topic),''),'') AS topic,
      COUNT(DISTINCT i.mcq_id)::integer AS covered,
      COUNT(DISTINCT i.mcq_id) FILTER (WHERE i.selected_index IS NOT NULL)::integer AS answered_unique
    FROM chosen a
    JOIN public.attempt_items i ON i.attempt_id=a.id AND i.user_id=v_uid
    JOIN public.mcqs m ON m.id=i.mcq_id
    WHERE m.bank IN ('SJN Question Bank','Past Papers Question Bank')
    GROUP BY m.bank,m.subject,
      COALESCE(NULLIF(BTRIM(m.chapter),''),''),
      COALESCE(NULLIF(BTRIM(m.topic),''),'')
  ),
  course_attempt_breakdown AS (
    -- A subject/chapter breakdown for each *individual* submitted course
    -- attempt. Do not aggregate separate retakes into one test result.
    SELECT attempt_id, group_key, subject, chapter,
      COUNT(*)::integer AS questions,
      COUNT(*) FILTER (WHERE selected_index IS NOT NULL)::integer AS answered,
      COUNT(*) FILTER (WHERE is_correct)::integer AS correct,
      COUNT(*) FILTER (WHERE selected_index IS NOT NULL AND NOT is_correct)::integer AS incorrect,
      COUNT(*) FILTER (WHERE selected_index IS NULL)::integer AS skipped
    FROM facts
    WHERE source_type='courses'
    GROUP BY attempt_id,group_key,subject,chapter
  ),
  earlier AS (
    SELECT
      COUNT(*)::integer AS questions,
      COUNT(*) FILTER (WHERE i.selected_index IS NOT NULL)::integer AS answered,
      COUNT(*) FILTER (WHERE i.is_correct)::integer AS correct
    FROM public.attempts a
    JOIN public.attempt_items i ON i.attempt_id=a.id AND i.user_id=v_uid
    WHERE a.user_id=v_uid AND a.details_version=1
      AND p_previous_from IS NOT NULL
      AND a.created_at >= p_previous_from AND a.created_at < p_previous_to
  )
  SELECT pg_catalog.jsonb_build_object(
    'totals', (SELECT pg_catalog.to_jsonb(t) FROM totals t),
    'previous', CASE WHEN p_previous_from IS NULL THEN NULL
                     ELSE (SELECT pg_catalog.to_jsonb(p) FROM earlier p) END,
    'daily', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) ORDER BY d.day)
                       FROM daily d),'[]'::jsonb),
    'nodes', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(g))
                       FROM grouped g),'[]'::jsonb),
    'bankCatalog', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(c))
                             FROM catalog c),'[]'::jsonb),
    'lifetimeCoverage', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(l))
                                 FROM lifetime l),'[]'::jsonb),
    'periodCoverage', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(pc))
                               FROM period_coverage pc),'[]'::jsonb),
    'courseAttemptBreakdown', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(cab))
                                       FROM course_attempt_breakdown cab),'[]'::jsonb),
    'tests', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) ORDER BY t.created_at DESC,t.attempt_id DESC)
                       FROM per_test t WHERE t.source_type IN ('courses','papers')),'[]'::jsonb),
    'courseCatalog', COALESCE((SELECT pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',c.id,'session',c.session_code,'title',c.title,
        'subject',c.subject,'chapter',c.chapter,'testNumber',c.test_number)
      ORDER BY c.session_code,c.test_number)
      FROM public.sjn_course_tests c WHERE c.published=true),'[]'::jsonb),
    'paperCatalog', COALESCE((SELECT pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',p.id,'title',p.title,'region',p.region,
        'year',p.year,'size',pg_catalog.jsonb_array_length(p.mcq_ids_json))
      ORDER BY p.region,p.year DESC)
      FROM public.past_papers p WHERE pg_catalog.jsonb_typeof(p.mcq_ids_json)='array'
        AND pg_catalog.jsonb_array_length(p.mcq_ids_json)>0),'[]'::jsonb),
    'legacyAttempts', (SELECT COUNT(*)::integer FROM public.attempts a
      WHERE a.user_id=v_uid AND a.details_version<>1)
  ) INTO v_result;
  RETURN v_result;
END;
$body$;
REVOKE ALL ON FUNCTION public.sjn_student_analytics(timestamptz,timestamptz,timestamptz,timestamptz,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sjn_student_analytics(timestamptz,timestamptz,timestamptz,timestamptz,integer) TO authenticated;
