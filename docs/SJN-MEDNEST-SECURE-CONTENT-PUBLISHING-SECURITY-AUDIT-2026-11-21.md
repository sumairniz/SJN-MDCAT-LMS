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


## 8. CI and preview verification update — 2026-11-21

- GitHub Foundation Checks on PR #3 latest verified head `760432b176e2e75b69e1ec6b40c8293a48480e0b`: **SUCCESS**.
- 326 test suite baseline was expanded by five secure publishing checks; final test job passed. Backend syntax, local Tailwind build, critical CSS check, byte-for-byte CSS reproducibility and release hygiene all passed.
- Management Panel Vercel preview deployment: `dpl_HYJYna9mNehwZE8em3hbGcoPjX7K`, READY, commit `760432b`.
- Preview URL: https://sjn-mednest-management-ja4jcouij-sjn1.vercel.app
- The preview is SSO-protected. Automated browser UAT has not yet been performed; owner must sign in and inspect the Release Centre and correction queue.
- Supabase Edge Functions are live: Management Auth authorization v5 (JWT verification enabled) and Student Staging publisher v4 (Management Auth JWT delegated to the Management Auth authorization service).
- Student Staging publisher RPC is callable only by `service_role`; receipt ledger is not readable by `anon` or `authenticated`.
- No real batch or correction has been published; receipt count remains zero. Atomic rollback test passed.
- PR #3 remains Draft and unmerged. No production deployment or merge.


## Management sign-in connectivity incident — 2026-11-21

Owner supplied screenshot showing the Management sign-in page reporting "Unable to connect to the Management Panel security service" before an authentication result. Investigation found that the active HTML imports `auth-client-isolated.js`, which correctly targets the independent Management Auth project `tdqbjhrmfluiinntmjfh`; the similarly named legacy `auth-client.js` is not loaded by this page and was not the active cause.

**Root cause:** the deployed Management Auth Edge Function CORS allowlists (`mednest-isolated-auth`, `mednest-isolated-stepup`, `mednest-isolated-team`, `mednest-isolated-team-actions`) permitted the earlier Phase 1A preview origin but excluded the current `sjn-secure-content-publishing` Vercel branch preview origin. The browser's preflight/request was therefore rejected before Management Auth could respond, and the frontend displayed its generic connectivity error.

**Correction deployed:** updated all four Edge Function origin allowlists to accept the exact current preview branch origin (and Vercel-generated deployment aliases) while retaining HTTPS, exact project host suffix, route scope and JWT verification. Active versions now: isolated auth v7, isolated step-up v6, isolated team v7, isolated team-actions v7. No student project or Student LMS auth was changed.

**Preview:** Vercel deployment `dpl_7nSGcaigCag1RaiSenrtCT4XhDZi` READY, alias `sjn-mednest-management-git-sjn-secure-content-publishing-sjn1.vercel.app`, built from `f0b730f2543ba4c9560ed3a1831b5b5a47899ecc`. Browser sign-in retry and live session verification still require owner confirmation. Do not reset the password or recreate the Chief account based on this screenshot.

**CI follow-up:** tests were updated to recognize the explicitly allowed secure publishing preview origin; rerun pending at commit `833de269f114a48f0d653efdde48584f1a8588cf` (test job in progress at documentation time).


### Final CORS allowlist verification

The deployed allowlist uses explicit alternatives for both legacy Phase 1A and current secure publishing branch origins (rather than a nested regex group), matching the existing regression test contract. Deployed active versions after this correction: isolated auth v8, isolated step-up v7, isolated team v8, isolated team-actions v8. GitHub push workflow at commit `33988de0143a887fd5c7d46df083fa6baeb81699` passed. Pull-request workflow is still running. The owner-facing preview remains the READY Vercel branch alias recorded above. Browser sign-in is not yet confirmed.
