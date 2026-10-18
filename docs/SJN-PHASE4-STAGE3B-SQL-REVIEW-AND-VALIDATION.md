# Stage 3B-1 — Staging SQL Review, Validation, and Execution Gate

**Created:** 2026-10-18 (Pakistan time)  
**Status:** REVIEW / NOT EXECUTED. The owner approved the *architecture*, not application of SQL.  
**Proposed SQL:** [database/migrations/20261018_stage3b_question_history_foundation.sql](../database/migrations/20261018_stage3b_question_history_foundation.sql)  
**Architecture:** [Question-Level History Design](SJN-PHASE4-STAGE3B-QUESTION-HISTORY-DESIGN.md)

## Approved concept versus execution authorization

The owner approved a permanent architecture using **immutable MCQ revisions** and **student-specific ordered attempt items**. This approval authorizes designing and reviewing the SQL and tests, but the author must **not silently run a schema migration** or change `main` / production. Staging database ref is `aozknkrwafowsrehdwlr`; production `yapvnevvjfewvafbjcgc` is excluded.

The review-only SQL is a *foundation*, not the complete History feature. It backfills 74 revision-1 rows from the existing preserved Biology MCQs. It adds `mcqs.current_revision_id`, `attempts.details_version/submission_key/submission_fingerprint/elapsed_seconds`, and new `attempt_items` and `mcq_revisions` tables. **It does not yet implement atomic grading RPC, the authenticated submission endpoint, Review, Retake, or draft recovery.** Existing attempts continue to use their legacy saving route until a later controlled switchover.

## Why this is safer

- The migration checks **exactly 74** MCQs and their original bank/subject/chapter/identity before making changes; then validates that every immutable revision field matches its source at commit. Any failed assertion is designed to abort the transaction. The earlier source literal fingerprint `a2e57e72716394e8` remains protected by existing frontend preservation tests. A database-to-source 74/74 comparison should also be performed again immediately before execution.
- The **39 existing historical test summaries** remain `details_version=0`, with their score/date and owner unchanged. It is impossible to reconstruct per-MCQ answer history for those records, so old History must present them as *summary-only*. No cleanup/deletion is required.
- The **2 existing bookmarks/marks** remain in `public.bookmarks` and are not modified by this SQL.
- Each new answer references a matching student-owned attempt, stable MCQ ID, and immutable matching MCQ revision. The selected answer may be **NULL (Skipped)**, distinct from an incorrect answer.
- New history tables use RLS and SELECT-only authenticated grants. **The legacy `attempts` ALL policy remains unchanged in this foundation migration** so existing saved tests do not suddenly break.
- Future server-side authoritative scoring and tighter `attempts` grants must ship **together in a later separately approved stage**, not as unsafe standalone edits.
- Preview login/session, the 24-hour expiry, existing dashboard, MCQs, Create Test, Stage 3A Results, and production are outside this migration's code scope.

## Pre-execution checklist — staging only

1. Reconfirm current GitHub branch HEAD, last known CI, and a clean deployment before approving execution.
2. Verify connected Supabase **project reference** is `aozknkrwafowsrehdwlr`, not production.
3. Re-run read-only table, grant, RLS, index and existing migration listing. Expect original MCQ IDs 1–74; if any new questions or schema differences appear, **stop and revise SQL** rather than weakening the guard.
4. Validate **74/74** original MCQ content against source independently, including A–D option order, answer indices, explanations and mnemonics. Back up the existing table structures and student test data through a secure, access-controlled process, **not GitHub**.
5. Review SQL ordering, foreign keys, trigger, new table grants/policies and Supabase PostgREST visibility with a competent PostgreSQL/security reviewer. Confirm `CREATE FUNCTION` and privileges use the intended role and no privileged routine is accidentally granted to students.
6. Review the final SQL in GitHub and obtain a specific owner approval for **applying the Stage 3B-1 additive migration to staging**; do not infer approval from the earlier architecture decision.
7. Use `apply_migration` for schema DDL, store its exact migration name/version, and confirm the result. Do not run SQL against production or use forceful table resets.

## Read-only verification queries to run AFTER an approved migration

The following are intended **verification queries**, not migration steps. Use a read-only database role if possible.

```sql
SELECT 'mcqs' AS source, count(*) AS records FROM public.mcqs
UNION ALL SELECT 'mcq_revisions', count(*) FROM public.mcq_revisions
UNION ALL SELECT 'attempts', count(*) FROM public.attempts
UNION ALL SELECT 'attempt_items', count(*) FROM public.attempt_items
UNION ALL SELECT 'bookmarks', count(*) FROM public.bookmarks;
-- Expected at initial backfill: 74, 74, 39 (or a higher count if testing continued),
-- 0, 2 (or a higher count if testing continued). DO NOT assume fixed live totals.

SELECT count(*) AS source_revision_mismatches
FROM public.mcqs m
LEFT JOIN public.mcq_revisions r
  ON m.id = r.mcq_id AND m.current_revision_id = r.id
WHERE r.id IS NULL OR r.revision_no <> 1
  OR m.bank IS DISTINCT FROM r.bank
  OR m.subject IS DISTINCT FROM r.subject
  OR m.chapter IS DISTINCT FROM r.chapter
  OR m.topic IS DISTINCT FROM r.topic
  OR m.source IS DISTINCT FROM r.source
  OR m.question IS DISTINCT FROM r.question
  OR m.options_json IS DISTINCT FROM r.options_json
  OR m.correct_index IS DISTINCT FROM r.correct_index
  OR m.explanation IS DISTINCT FROM r.explanation
  OR m.mnemonic IS DISTINCT FROM r.mnemonic;
-- Must return 0 at initial backfill.

SELECT details_version,count(*)
FROM public.attempts GROUP BY details_version ORDER BY details_version;
-- All old history rows remain details_version=0 before the cutover.

SELECT schemaname,tablename,policyname,cmd,roles
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('mcq_revisions','attempt_items')
ORDER BY tablename,policyname;

SELECT tablename,indexname,indexdef
FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('mcq_revisions','attempt_items','attempts')
ORDER BY tablename,indexname;
```

## Security tests required before a scoring API can go live

- Student A can SELECT only their own completed attempt items; Student B and anonymous users cannot.
- `authenticated` cannot directly INSERT/UPDATE/DELETE `attempt_items` or `mcq_revisions`; an authorized database routine for server-scored insertion is **not included in this initial SQL**.
- A question revision for an old test must remain unchanged after a question correction, and a new revision must be inserted for any future change.
- A forged `attempt_id` + another student's `user_id` is rejected by composite FK, regardless of API bugs.
- Reusing another MCQ's revision ID with a valid MCQ ID is rejected by composite FK.
- Duplicate attempt positions or duplicate MCQ IDs are rejected.
- Selected-index bounds reject negative and out-of-range indexes. `NULL` is allowed only as a skipped answer (with `is_correct=false`).
- Legacy `POST /api/attempts`, signed-cookie authentication, multi-tab identity, 24-hour deadline and old score-only History continue working immediately after the schema addition.
- **Before secure submission launches:** Write integration tests for trusted grading, retries using same submission key, same-key/different-payload conflicts, atomic rollback, malformed question list, idempotent server response, exact saved order, expired session, account switches and unavailable/stale source revisions.
- **Do not expose premium/mocks through ordinary `mcqs` or `mcq_revisions`** because the existing ordinary bank/API exposes answer keys.

## Known limitation and review warning

**Schema-only migration does not solve score spoofing.** The old `POST /api/attempts` still trusts browser-submitted totals; its authenticated write grants are deliberately not revoked until a replacement works for *both* legacy and Phase 4 flows. Don't mark Stage 3B as implemented after SQL alone.

**Revision creation is only a foundation.** Future editor/import code must guarantee that newly published MCQs receive a current revision and that edits create a new version, never changing previously submitted question content. The initial migration must preserve all original 74 texts, options, answer keys and tags exactly.

**Rollback:** If the uncommitted transaction fails, PostgreSQL should roll it back. After committed use, dropping history tables would risk losing new records; prefer an owner-reviewed forward fix or a scoped staging restore. Do not apply an unconditional DROP-table rollback.

**Current outcome:** One SQL file and one static safety test prepared. **Not yet applied**, no Supabase data/schema changes. CI/actual SQL compilation and live RLS behavior require verification in the intended staging environment after separate approval.
