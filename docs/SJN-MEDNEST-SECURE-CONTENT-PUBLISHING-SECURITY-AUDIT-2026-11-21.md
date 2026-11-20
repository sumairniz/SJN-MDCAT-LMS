# SJN MedNest Secure Content Publishing — Security & Architecture Audit

**Date:** 2026-11-21  
**Branch:** `sjn-secure-content-publishing`  
**Scope:** Management Auth `tdqbjhrmfluiinntmjfh` → Student LMS Staging `aozknkrwafowsrehdwlr` only.  
**Owner authorization:** Explicitly granted in Chat 12 for implementation and security audit. This does not authorize production changes, main merge, inactive-project changes, or deployment to production.

## 1. Verified live baseline

Both Supabase projects report `ACTIVE_HEALTHY` on Postgres 17.11.

| Component | Live state |
|---|---|
| Management Auth `mednest-mcq-library` | ACTIVE v4; reads allowed general-bank MCQs from Student Staging and stores individual edit drafts in Management Auth |
| Management Auth `mednest-content-studio` | ACTIVE v6; stores unpublished batches, rows and review state in Management Auth |
| Student Staging MCQ table | 1,275 records |
| Student Staging revision table | 1,996 records |
| Student attempt items | 2,140 records |
| Current-revision integrity | 0 missing and 0 invalid current-revision references |
| Attempt references | 0 orphaned attempt MCQ references |
| Management drafts | 3 batches, 6 rows, 1 individual edit draft, 0 academic-review submissions |
| Active Management staff members | 1 |

## 2. Existing security and data model

- Management Auth and Student LMS Staging are separate projects; no third database is required.
- Management Auth staff authorization checks verified email, Management Auth JWT, live session via `mednest_staff_session_live`, active staff membership and Chief Admin role in existing Edge Functions.
- `mednest-mcq-library` uses a Student Staging publishable key for read-only access. It explicitly excludes course-only content and has no student write operation.
- `mednest-content-studio` is Management Auth only. It creates and validates unpublished batches and can set `approved_for_release`; its response explicitly says `published:false`.
- Student `mcq_revisions` has an immutable UPDATE/DELETE trigger. Its constraints enforce four options, correct index 0–3, unique revision number per MCQ and a composite identity relationship.
- Student `mcqs.current_revision_id` references `mcq_revisions(mcq_id,id)`. The MCQ and revision IDs use `mcqs_id_seq` and `mcq_revisions_id_seq`; the table ID columns do not have defaults.
- Student `attempt_items` stores both `mcq_id` and `mcq_revision_id`. Existing attempt history must remain untouched.

## 3. Security findings / release gates

### Critical existing FF-008 issue
The live Student Staging policy `Public read access for content` grants SELECT to `anon` and `authenticated` with `qual=true` on all rows in `public.mcqs`. The table currently includes 79 course-only MCQs. The current library Edge Function filters course-only rows in its own query, but that does not protect direct Data API reads.

**Do not blindly remove or narrow this policy in this implementation batch.** Existing exam bootstrap and content clients have to be audited and safely migrated to server-enforced feature/course entitlements first. Course-only MCQs must remain excluded from the new publishing operation until FF-008 is resolved. This is a Student Staging release blocker for any course-content release.

### Existing advisor findings (baseline, not introduced by this work)
- Management Auth advisor: 12 informational RLS-enabled/no-policy notices for private staff/draft tables; existing server-side service-role access is intentional and must be preserved.
- Student Staging advisor: 6 informational RLS-enabled/no-policy notices for private management tables; one warning for the existing `sjn_submit_practice_attempt` SECURITY DEFINER RPC callable by authenticated users; one warning that leaked-password protection is disabled.
- Do not change these unrelated items as part of the publishing bridge without a separate audit and approved remediation.

## 4. Safe implementation architecture

Use the existing projects only:

1. Management Panel sends the signed-in Management Auth JWT and a scoped publish request to a Student Staging publishing Edge Function.
2. Student Staging publishing Edge Function verifies the Management Auth session/actor by calling a narrowly scoped Management Auth authorization Edge Function over HTTPS. The authorization endpoint validates the JWT using Management Auth `auth.getUser`, confirms email, checks the live session and verifies active Chief Admin status (or an explicitly granted publishing permission in a future staff policy).
3. The Student Staging Edge Function uses only its own project's server-side `SUPABASE_SERVICE_ROLE_KEY` to call a private, atomic Student Staging database routine. No Student service-role/secret credential is copied into Management Auth or exposed to the browser.
4. The private database routine inserts an immutable revision and updates/creates the MCQ in one transaction, enforces four-option schema compatibility, verifies expected revision for edits, and records an idempotency receipt. Existing attempts continue to reference their original immutable revision.
5. A successful publish response includes the Student MCQ ID, revision ID, revision number, request ID and destination. The Student Staging endpoint provides an authenticated publication receipt/history operation for recovery after network interruption.
6. Only approved General Question Bank and supported Past Paper Question Bank destinations are in scope. Course-only and unsupported destinations are rejected server-side.

## 5. Required correctness properties

- Authenticate and authorize every request server-side; Origin/CORS is not authorization.
- Verify exact Management Auth project issuer, audience, user ID, confirmed email, live session, active staff membership and publish permission.
- Restrict the Student endpoint to the approved Management Panel origins and POST/OPTIONS.
- Never accept caller-supplied actor identity as authority; derive actor from the verified Management Auth response.
- Never expose service-role/secret keys in browser code, Git, logs or response payloads.
- Enforce strict field allowlists, text bounds, supported bank names, four options, valid correct answer, and destination restrictions on the server.
- Use idempotency keys and payload hashes to prevent duplicate MCQ creation on retries.
- For edits, compare-and-swap against the expected current revision; reject stale drafts.
- Insert a new immutable revision; never UPDATE/DELETE historical revisions.
- Update the MCQ's current mirror fields and current revision pointer atomically.
- Do not mutate `attempt_items`, old revision rows, student results, analytics or history.
- Do not publish a batch unless its state is `approved_for_release`; optional academic review remains distinct from publication.
- Preserve the original Management Auth draft records and record publication outcomes without logging question text or student-identifying information.
- Course-only content stays excluded until FF-008 is remediated.

## 6. Implementation sequence

1. Add narrowly scoped Management Auth publish-authorization Edge Function.
2. Add private Student Staging atomic publish routine and idempotency ledger.
3. Add Student Staging publishing Edge Function using only native Student project secrets.
4. Add authenticated frontend calls for individual correction and approved new-question batches.
5. Add automated tests for authentication failures, authorization, stale revision, duplicate request, invalid content, course-only rejection, atomic rollback and revision/attempt preservation.
6. Deploy only to the two named staging projects and verify using clearly identified synthetic test content, then remove only the synthetic test records through the approved test cleanup path (never remove real content).
7. Run Supabase advisors and update the Master Development Plan, permanent handovers and temporary-change register.

## 7. Current execution state

- Owner authorization: received.
- Read-only live audit: completed.
- Dedicated GitHub implementation branch: created from `sjn-content-studio-v4-implementation`.
- No schema, records, Edge Functions, secrets, deployments or production settings have been changed yet.
- The existing production/legacy project and `main` remain out of scope.
