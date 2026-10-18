# SJN Stage 3B-2 — Server-graded atomic submission implementation and safety gates

**Status:** RPC and corrective migration installed in staging. Rollback-only database transaction test and 2 GitHub workflows PASSED; real browser / Student A–B isolation acceptance and legacy writer lockdown remain OPEN.  
**Environment:** Only `sjn-phase1a-foundation` / Supabase staging `aozknkrwafowsrehdwlr`; production is out of scope.  
**Migration registry:** `20261018133942_stage3b_atomic_practice_submission` (applied).  
**Versioned SQL:** [Atomic Submission Migration](../database/migrations/20261018_stage3b_atomic_practice_submission.sql).

## Permanent design
The normal practice API reads current question revision IDs from `mcqs`, then sends a stable submission UUID, ordered `mcqId/revisionId/selectedIndex`, title, selected mode, subject, selection and elapsed time. The authenticated server validates the signed 24-hour cookie, bearer token and expected student identity. PostgreSQL verifies ownership, grades from immutable current revision keys and atomically inserts one summary + ordered items; unique submission keys and fingerprints prevent duplicate saves or changed-answer retries. All old and approved Phase 4 quiz routes use the same saver; no extra browser cache or temporary dual writer.

The database routine enforces student identity under PostgREST JWT but can also be called directly by an authenticated Supabase token: **the 24-hour application cookie guard applies to `/api/practice/submit`, not necessarily direct RPC calls**. Review before a premium-exam threat model.

## Verify
- **Source preservation:** original inline 74 MCQs remain byte-identical; the existing Phase 4 preservation test guards them.
- **Unit tests:** reject missing UUID, selected-index out of range, duplicate MCQs, forged `correct`, missing/extra fields, wrong user, and conflicting retry. Confirm server scores from mocked DB response and forwards authenticated JWT.
- **Live database:** verify RPC EXECUTE granted to authenticated, not anon; verify migration registry and existing 74 MCQs, 74 revisions, 39 historic summaries, 2 bookmarks and unchanged old history before making student test attempts.
- **Actual student A/B E2E:** create a small quiz with Correct/Incorrect/Skipped, submit once; inspect returned score, `details_version=1`, ordered `attempt_items`, and per-user History, then retry same key and ensure one attempt. Verify a separate student cannot read or modify it. Use only dedicated test accounts with owner approval.
- **Browser regression:** fresh-login and returning sessions both open Phase 4 on dedicated staging host; timed and tutor still work; last item Finish and Submit still reach approved result; incorrect-mismatch hides unverified insights; no scores added twice; session expiry and account switch fail closed.
- **Release gate:** **DO NOT MERGE** yet. Existing `/api/attempts` still lets clients submit scores and old authenticated DML grants remain in Supabase. These must be replaced/revoked after successful new-path E2E; preserve legitimate old summaries and student data. No Review/Retake UI activated.

## Failure and rollback
If saving fails, the UI must never say it was saved; it tells the student to check History. If the backend receives an invalid question revision, the RPC rejects the full transaction. Avoid removing historical rows after data is written; use forward-compatible SQL to fix defects. The migration's SQL file and staged commits remain the permanent handover, not untracked SQL.

## Verified staging results — 2026-10-18

- Corrected alias ambiguity in forward migration `20261018135309_stage3b_submission_attempt_id_qualification`; see Master Development Plan for the initial `42702` failure and correction.
- New PostgreSQL RPC was tested with three questions (1 correct, 1 incorrect, 1 skipped), 3 committed-within-test items, 1 parent, and same UUID retry returning same parent with `already_saved=true`; a nested exception rolled back all test inserts.
- Immediately afterward live counts: `attempts=39`, `attempt_items=0`, `mcqs=74`, `mcq_revisions=74`, `details_version=1 count=0`. Current bookmarks count=3, which may reflect legitimate tester activity; this feature did not write bookmarks.
- Routine EXECUTE: authenticated **allowed**, anon **denied**. Vercel staging branch commit `638b1e5` reports READY; two GitHub Actions runs PASSED.
- **Pending owner E2E check** with a normal test under their staging account before we rely on this in production. Check authoritative new History data and whether saved results and subject/chapter/topic insights display correctly.
- **Blocking security debt:** legacy score-only endpoint and direct DML on old `attempts`; do not merge or release as full secure grading until these are removed or safely restricted after the new route passes acceptance.
