-- SJN MDCAT LMS Pro Phase 4 Stage 3B — permanent score-history lockdown
-- STAGING ONLY: Supabase aozknkrwafowsrehdwlr.
-- DO NOT execute on production yapvnevvjfewvafbjcgc.
-- Versioned, forward-only migration AFTER 410 legacy route is deployed.
-- Existing 39 summary-only tests and all detailed attempts remain intact.
-- New authoritative practice submissions continue via SECURITY DEFINER RPC.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Safe preflight: ensure the verified submission path and existing RLS exist.
DO $preflight$
BEGIN
  IF to_regclass('public.attempts') IS NULL OR
     to_regclass('public.attempt_items') IS NULL OR
     to_regclass('public.mcq_revisions') IS NULL OR
     to_regprocedure('public.sjn_submit_practice_attempt(uuid,jsonb,text,text,text,jsonb,integer)') IS NULL THEN
    RAISE EXCEPTION 'Stage 3B legacy writer lockdown halted: foundation or grader missing';
  END IF;
  IF NOT has_function_privilege(
     'authenticated',
     'public.sjn_submit_practice_attempt(uuid,jsonb,text,text,text,jsonb,integer)',
     'EXECUTE') OR
     has_function_privilege(
     'anon',
     'public.sjn_submit_practice_attempt(uuid,jsonb,text,text,text,jsonb,integer)',
     'EXECUTE') THEN
    RAISE EXCEPTION 'Stage 3B lockdown halted: scoring RPC grants unexpected';
  END IF;
  IF (SELECT count(*) FROM public.mcqs) <> 74 OR
     (SELECT count(*) FROM public.mcq_revisions) <> 74 THEN
    RAISE EXCEPTION 'Stage 3B lockdown halted: original 74-question source changed';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='attempts'
      AND policyname='Users can manage own attempts' AND cmd='ALL'
  ) THEN
    RAISE EXCEPTION 'Stage 3B lockdown halted: audited legacy policy changed';
  END IF;
END;
$preflight$;

-- The old policy permitted authenticated users to INSERT/UPDATE/DELETE their
-- own total/correct/accuracy values. Replace with read-only per-user history.
DROP POLICY "Users can manage own attempts" ON public.attempts;
CREATE POLICY sjn_attempts_read_own_history
  ON public.attempts
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Make the student role incapable of spoofing or deleting scores directly
-- even if future RLS policies change. Do not change bookmarks privileges.
REVOKE ALL PRIVILEGES ON TABLE public.attempts
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.attempts TO authenticated;

-- The vetted SECURITY DEFINER RPC remains owned by its privileged role and
-- independently verifies auth.uid, revision, order, score, and idempotency.
-- Do not grant direct INSERT on attempt_items or mcq_revisions.

DO $verify$
BEGIN
  IF has_table_privilege('authenticated','public.attempts','INSERT') OR
     has_table_privilege('authenticated','public.attempts','UPDATE') OR
     has_table_privilege('authenticated','public.attempts','DELETE') OR
     has_table_privilege('authenticated','public.attempts','TRUNCATE') OR
     NOT has_table_privilege('authenticated','public.attempts','SELECT') OR
     has_table_privilege('anon','public.attempts','SELECT') THEN
    RAISE EXCEPTION 'Stage 3B lockdown failed: student history permissions unexpected';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='attempts'
      AND policyname='sjn_attempts_read_own_history'
      AND cmd='SELECT' AND roles @> ARRAY['authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'Stage 3B lockdown failed: own-student SELECT policy missing';
  END IF;
  IF NOT has_function_privilege(
     'authenticated',
     'public.sjn_submit_practice_attempt(uuid,jsonb,text,text,text,jsonb,integer)',
     'EXECUTE') THEN
    RAISE EXCEPTION 'Stage 3B lockdown failed: secure test submission unavailable';
  END IF;
END;
$verify$;

COMMIT;

-- Follow-up read-only RLS and rollback-only transactional RPC tests are
-- required before declaring the release gate closed. Do not delete history.
