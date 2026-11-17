# SJN MedNest Academy — Management Auth Restoration & Security Verification
Date: 2026-11-17 (Pakistan Standard Time)
Branch: `sjn-phase1a-foundation`
Owner authorization: Explicit approval to complete verification and begin the next development steps. Scope remained limited to isolated Management Auth and its development branch. No production, Student LMS, DNS, domain, paid-plan, or PR merge action was authorized.

## 1. Recovery and project health
- Dedicated Management Auth project `tdqbjhrmfluiinntmjfh` is `ACTIVE_HEALTHY`, region `ap-south-1`, PostgreSQL 17.11.
- Database tools, migrations, table inspection, Edge Function listing and project URL retrieval all succeeded.
- Ten pre-existing Management migrations were present before this session; the security-hardening migration below is the eleventh.
- Eight Edge Functions are active and JWT verification is enabled for all eight:
  `mednest-isolated-auth`, `mednest-isolated-stepup`, `mednest-isolated-team`, `mednest-isolated-team-actions`, `mednest-mcq-library`, `mednest-academic-review`, `mednest-syllabus`, `mednest-content-studio`.
- Chief Admin record remains present; verified Auth user and Chief account were not recreated, reset or modified.

## 2. Database access review
- All 12 `public.mednest_*` management tables have RLS enabled.
- None has a direct RLS policy. This is intentional for the current architecture only because direct table grants to `anon` and `authenticated` are absent and the application uses JWT-validated Edge Functions with the trusted `service_role`. `service_role` has direct table privileges.
- Do not add broad RLS policies or remove RLS without reviewing the Edge Function access model first.
- All inspected Management SECURITY DEFINER RPCs are restricted to `service_role`, except the batch audit trigger function that was fixed in this session.
- Chief claim, session-live, email-step-up reserve/verify and sensitive-action authorization routines were inspected. The single-use Chief bootstrap remains tied to the privately seeded email hash and a confirmed Auth identity. The session-bound step-up code is HMAC-hashed, ten-minute expiry, five-attempt limit, 90-second resend throttle, five-per-day quota and 30-minute authorization window.
- No direct browser/database client access to Management tables is intended.

## 3. Security correction completed
Finding: Supabase Security Advisor reported `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable` for `public.mednest_content_batch_audit_status()`. It is an audit trigger function, not an application RPC, but had inherited PUBLIC execute rights.

Correction:
- Added `database/management/isolated-content-batch-audit-execute-hardening-20261117.sql` to this development branch.
- Applied Management Auth migration `restrict_content_batch_audit_trigger_rpc_20261117` (version `20261117120028`).
- Revoked execution from `PUBLIC`, `anon`, and `authenticated`; retained `service_role` execution.
- Verified afterward: anon=false, authenticated=false, service_role=true.
- Verified the existing audit trigger still fires by inserting a test batch inside a transaction, confirming its audit row, then rolling the transaction back. No test record was retained.
- GitHub commit: `8adfd602b5360b4d567f7648cb70a5325e589ce8`.
- Foundation CI workflow run `44078860597`: completed SUCCESS (job: test). This is automated CI evidence, not browser UAT.
- Vercel returned no deployment for this docs/database-only commit. Existing latest preview remains the earlier deployment described below.

## 4. Current Security Advisor findings (after correction)
- The public/authenticated SECURITY DEFINER warnings for the audit trigger function are gone.
- Informational `rls_enabled_no_policy` finding remains for all 12 Management tables. Keep it documented; this is not permission to expose tables.
- Warning `auth_leaked_password_protection`: Supabase Auth leaked-password protection is disabled. Enablement requires Auth configuration change and should be reviewed separately; not changed here.
- Performance Advisor reports missing covering indexes for several foreign keys and unused indexes. These are performance observations, not urgent grounds for unreviewed schema changes. Evaluate query plans/workload first.
- Health Advisor returned no lints.
- Supabase Performance Advisor also reports unused indexes; do not drop indexes based on an empty/low-usage staging workload alone.

## 5. Edge Function and feature boundaries reviewed
- All eight Edge Functions are ACTIVE and `verify_jwt=true`.
- Functions validate the Management Auth issuer, confirmed email, live session, active staff membership and Chief role/permissions as appropriate.
- Content Studio exposes unpublished draft lifecycle actions only. No student publish action exists; `approved_for_release` is not published.
- Academic Review responses explicitly return `publishing_enabled:false`.
- Team directory API currently permits only read actions; invitations/team mutation are not active for use until sender configuration and owner UAT are complete.
- Syllabus authoring writes only to Management Auth.
- MCQ library can read permitted Student MCQ content via a public/publishable key and stores edit proposals only in Management Auth; course-only MCQs are excluded. It has no publish/delete/Student MCQ update operation.
- The step-up function code references Resend sender/API key and a long HMAC pepper. Secret values were not requested or exposed. Supabase connector did not provide a secret-presence inventory, so configuration cannot be certified solely from source code.
- Vercel Management project environment-variable listing returned no visible variables and zero hidden production variables. This is a static app deployment and may use source-configured public values; it does not establish whether Supabase Edge secrets are configured.

## 6. Owner browser verification still required
Latest preview deployment:
`https://sjn-mednest-management-eehnduq5q-sjn1.vercel.app`
Deployment ID `dpl_6J8v8xzk65EsMMpjjsHRxHr55jvN`, READY, commit `ff7d3ea2a6848b02a9a5fc33b69ae4eae5c7e63c`. It is a protected development preview, not production.

A protected fetch returned HTTP 200 and confirmed the page contains the SJN MedNest Management sign-in shell, invitation-only messaging, staff workspace and step-up UI. This is a source/HTTP inspection, not a real authenticated browser test.

Still pending:
1. Owner signs in with existing Chief account in their browser; do not share password or OTP in chat.
2. Verify profile retrieval and profile update.
3. Verify team directory and audit log reads.
4. Verify step-up email delivery, correct/incorrect/expired code behavior and 30-minute session window.
5. Exercise Question Workspace: create three MCQs, Save & Next, reopen/edit a middle MCQ, save draft, check draft list, verify no publication.
6. Check signed-out access denial, sign-out and mobile layout.
7. Verify sender configuration before enabling team invites. No invitations have been sent or accepted in this session.

## 7. Current data counts (read-only)
- Staff members: 1 (Chief only)
- Invitations: 0
- Content draft batches: 2
- Content draft rows: 4
- MCQ edit drafts: 0
- Academic review submissions: 0
- Staff audit events: 17
Counts are snapshots and must not be treated as test fixtures. No records were deleted or modified.

## 8. Remaining release blockers and next development sequence
1. Complete owner browser UAT above.
2. Verify Resend/step-up secret configuration through Supabase Dashboard without exposing values; test actual delivery.
3. Resolve the leaked-password protection Auth warning after reviewing impact and available project settings.
4. Staff onboarding and independent reviewer workflow only after sender and Chief UAT succeed.
5. Critical Student LMS blocker FF-008 remains unchanged: public `mcqs` SELECT exposure includes restricted course-only MCQs. Do not revoke access abruptly. Audit Student query paths and implement server-enforced course/feature entitlement with full student regressions.
6. Implement revision-aware Student publication bridge only after FF-008, student compatibility and release tests.
7. Continue Course/Session/Test and Full-Length Past Paper managers.
8. Stable `admin.sjnmednest.com` alias/DNS remains a separate approved task.
9. PR #1 remains DRAFT/unmerged. No main merge or production deployment.

## 9. Explicit non-changes
No Student LMS DB/schema/RLS/MCQ/attempt/history/analytics/Mistake Diary changes; no old production restoration; no Chief account reset; no staff invitations; no student publishing; no DNS/domain/alias changes; no Vercel quota/protection changes; no paid service/plan; no PR merge.


## 10. Root deployment correction completed after the first audit
A follow-up inspection of the deployed root page found that it was still loading legacy `apps/management/auth-client.js`, which points to Student LMS Auth and old function endpoints. The isolated implementation was present as `integrated-auth-preview.html` + `auth-client-isolated.js`, but was not the default root entry.

Correction:
- Replaced `apps/management/index.html` with the integrated isolated-auth workspace, preserving the original design and existing module content.
- Removed misleading copy suggesting the Student-linked shell remained an available rollback.
- Kept invitation controls disabled until sender configuration and Chief UAT are complete.
- Kept the agreed team counters inclusive of the Chief Administrator.
- Added explicit text that no Student LMS registration is required.
- Updated `tests/management-integrated-isolated-auth.test.js` to assert that the root entry loads isolated auth and never loads the legacy Student Auth client.
- GitHub commits: root switch `bd94faba527bd2f748e152304bb484a1fcc58b9e`; final copy/test commits `98064a63f32767424155eb55a6084e37e1a60147`, `a6ca1d98ce17bf856078d79c468657ed2fcc8cb8`, `065f39820c6dadbc2e67a12b9896174dc6086cfc`.
- An initial CI run correctly failed because two tests still encoded the old entrypoint. Updated tests/copy; final Foundation CI run `44079546124` completed SUCCESS: 317 tests, 317 passing, no failures; CSS build, CSS verification/reproducibility and release hygiene also passed.
- Created a new protected Vercel preview from exact commit `065f39820c6dadbc2e67a12b9896174dc6086cfc`: deployment `dpl_681fp6QLjUkotvaa4v4LkEAHuKhj`, state READY, URL `https://sjn-mednest-management-hubnpth3l-sjn1.vercel.app`.
- Fetched deployed root and required JS assets: all returned HTTP 200. Verified root references `auth-client-isolated.js`, not legacy `auth-client.js`; isolated client points to Management Auth `tdqbjhrmfluiinntmjfh`, not Student LMS Auth; Chief-inclusive count labels are present; CSP headers and noindex headers are present.
- This is still a protected development preview, not a public or production deployment. No login/OTP was attempted by the assistant. Owner browser UAT remains pending.

**Do not use the old preview URL for login.** The old deployment `sjn-mednest-management-eehnduq5q-sjn1.vercel.app` serves the legacy Student-linked shell. Use the new URL above for owner testing.
