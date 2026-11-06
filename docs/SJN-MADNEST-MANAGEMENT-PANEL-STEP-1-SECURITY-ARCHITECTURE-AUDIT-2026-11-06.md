# SJN Madnest Management Panel — Step 1 Read-only Technical & Security Architecture Audit

**Date:** 2026-11-06 (Pakistan time)  
**Checkpoint:** **STEP 1 READ-ONLY AUDIT PERFORMED; RECOMMENDED ARCHITECTURE RECORDED; NO IMPLEMENTATION/DEPLOYMENT YET.**  
**Owner instruction:** “So, begin the step one.” This referred to **Step 1 — Technical foundation and security architecture** in the proposed Phase 1A sequence, **not** to Step 2 Vercel project creation or to live staff account provisioning. The Owner separately approved the seven product foundations as design direction.  
**Repository:** `sumairniz/SJN-MDCAT-LMS` • branch `sjn-phase1a-foundation` • staging Supabase project `aozknkrwafowsrehdwlr` • existing Vercel project `sjn-mdcat-lms`.  
**Safety:** All repository/application/DB/deployment review was **read-only**. This documentation update is the only intended GitHub change. No secret contents captured.

## A. Evidence: existing code and environments actually inspected

1. **Student application:** `package.json`: Express 4 app, `@supabase/supabase-js` 2.x, Node entry `server.js`; `vercel.json` routes traffic to its existing Node server (regional setting `bom1`). Existing `public/index.html` contains current student modules Dashboard/Create Test/My Courses/Past Papers/Resources/Analytics/Mistake Diary/History/AI Tutor. **Do not bundle Management Panel JS into it.**
2. **Existing student authentication** (`server.js`): `POST /api/auth/register` currently accepts open student signups via Supabase `signUp`; `POST /api/auth/login` authenticates with Supabase; `auth` middleware checks bearer access token via `getUser()` and the current 24-hour paired HttpOnly refresh/session cookies, matching user ID and expiry. Cookies are path-scoped to `/api`, SameSite=Lax and use current student-specific names. **Do not assume the cookies/session can or should be shared with a future separate management origin.** A staff-only session, anti-CSRF and redirect/host design need their own review.
3. **Old developer token ≠ staff authorization:** `server.js` has `admin(req,res,next)` requiring static `x-admin-token` for `/api/dev/sync`; this is a limited developer/sync mechanism, **not** owner/team RBAC and not suitable as staff login. No owner/team invite, permission-edit or staff audit API presently exists in this student server.
4. **Current source delivery:** `GET /api/content` returns question records including `correctIndex`, options and explanation; `readAllPublishedMcqs` is used by current public student content path. **Staging database metadata verified** `public.mcqs` has `SELECT` policy `true` for `anon` and `authenticated`, and both roles currently have `SELECT` privilege on `correct_index`. Therefore new premium course/SJN bank content **must not be deposited into this unrestricted access surface**. Preserve existing current student behavior; plan separately permissioned reads and content segregation before premium feature rollout. This is an architecture/release requirement, not approval to modify currently published MCQs or public content.
5. **Current courses:** `GET /api/course-tests` uses authenticated student context but lists the published `genome` course tests without per-student paid-entitlement enforcement. Staging `public.sjn_course_tests` has authenticated `SELECT` for `published=true`. This is the known pilot entitlement/release blocker **FF-008**; do not mistake a student UI lock for secure permission.
6. **Staging schema read-only inventory (2026-11-06):** 14 public tables were listed; all listed with RLS enabled, including `profiles`, `mcqs`, `mcq_revisions`, `attempts`, `attempt_items`, `practice_drafts`, `bookmarks`, `sjn_course_tests`, `academy_resource_files` and `sjn_mistake_annotations`. No dedicated management membership/permission/audit tables were present. Data row counts intentionally not copied into this security blueprint as they can change.
7. **Existing per-student separation:** `attempts` and `attempt_items` use authenticated owner-based SELECT RLS; Mistake Diary student annotations likewise use per-student RLS. `profiles` has user-owned SELECT/UPDATE policies, but a checked `has_column_privilege('authenticated','public.profiles','role','UPDATE')` returned **false**. Thus normal authenticated users cannot update this role column through ordinary PostgreSQL privileges. Nevertheless **do not make the public `profiles.role` display field the sole management authorization source**; use dedicated server-controlled staff membership+permissions.
8. **Security advisories (existing staging, read-only):** Supabase `get_advisors(type='security')` returned 2 WARN categories: (a) an **authenticated-callable SECURITY DEFINER** `public.sjn_submit_practice_attempt` (the existing intentional atomic-grading RPC; flagged for careful validation of internal identity/authorization, not for automatic definer removal), and (b) **leaked-password protection disabled** in Supabase Auth (review enablement, plan and deployment scope before any configuration change). Neither setting/function was modified; preserve the proven submit flow.
9. **Performance advisories (existing staging, read-only):** Supabase `get_advisors(type='performance')` returned 4 unindexed-foreign-key observations and 1 unused-index observation (INFO categories). These are baseline candidates for separate evaluation, not an instruction to change indexes preemptively.
10. **Current host inventory:** Connected Vercel account listed a single existing project `sjn-mdcat-lms`. No management Vercel project was created. Vercel supports multiple projects from different root directories in one repository, but each linked project needs its own configuration and deploy-safe change scoping.

### Source references (repository and public current docs)
- Student auth and content: `server.js`, `lib/paginated-content.js`, `package.json`, `vercel.json`; `public/index.html`.
- CI: `.github/workflows/foundation.yml` runs Node tests, CSS checks and release safety; add independently tested staff authorization/deny tests in a future approved phase, do not weaken existing student tests.
- Supabase Docs: https://supabase.com/docs/guides/auth/users (trusted server Auth admin invitations), https://supabase.com/docs/guides/database/postgres/row-level-security (RLS grants and explicit test coverage), https://supabase.com/docs/guides/auth/auth-mfa (MFA).
- Vercel Docs: https://vercel.com/docs/monorepos (separate projects/root directories).

## B. Recommended Step 1 architecture, to be reviewed in Phase 1A implementation plan

**Application boundaries**

```text
                     +------------------------------------+
STUDENTS ----------> | Existing student LMS Vercel app    |
                     | Existing exam, result, history     |
                     +---------------+--------------------+
                                     | narrowly scoped authenticated student API
                                     v
                     +------------------------------------+
                     | Shared Supabase (staging first)    |
                     | protected tables + revisions      |
                     +------------------------------------+
                                     ^
                                     | separately authenticated staff API (privileged only as needed)
                     +---------------+--------------------+
STAFF -------------> | New SJN Madnest Management Panel  |
                     | separate Vercel app + API, no      |
                     | student exam bundles              |
                     +------------------------------------+
```

- Recommend a **dedicated `apps/management/` application directory in the same GitHub repository** with its own `package.json`, application entry and Vercel project Root Directory. Revisit if detailed deployment analysis favors a separate repo; neither option has been implemented. Student root `server.js` and `public/` should be left untouched in Phase 1A wherever practical.
- Separate staff authentication session on the management origin, with strong cookies, token verification, CSRF/origin checks on mutations, strict CORS policy, MFA for staff and explicit sign-out/revocation design. Use same Supabase Auth identity provider where appropriate **without sharing student cookies**.
- Create server-owned, fail-closed membership and fine-grained permissions lookup. Owner solely controls management invitations, active staff roster and permission grants; ordinary Management Team Members can receive equal or individualized operational rights, **not** change staff membership or self-elevate. Prefer authoritative data lookup per sensitive staff operation to avoid stale JWT role grants. Audit staff actions with privacy-sensitive redaction.
- Trusted server only may use privileged Supabase Auth admin APIs (invite staff) and restricted database writes. Never expose secret/service-role keys in browser, version control or client logs. Separately scope privileged code and review RLS/GRANT behavior for new tables, including appropriate staff operation tests.
- Protect last/only Owner against lockout and require explicit identity bootstrap/recovery procedure; no guessing email from account names or silently promoting an existing student.

**Premium and student policies (later phase but security dependency now)**

- Reserve separate `account_status`, `registration_mode`, `feature_policy`, `student_override`, and `course_entitlement` concepts; neither today's `profiles.role` display value nor mere presence of a client UI lock is authoritative enough.
- Open Sign Up initially, later Owner-configurable Approval Required/Invite Only with backend registration enforcement, while Sign In continues. Student UI `Login` → `Sign In` needs its own UI approval/implementation scope.
- **Don't permit premium questions to enter the current anonymous MCQ SELECT scope**. Separate authorized premium query/storage surfaces and preserve revision-linked grading and completed test history.
- Do not hide the student module only while still returning sensitive MCQs in `/api/content`. Plan test cases for forged direct requests as well as normal browser navigation.
- Payment gateway remains separate business decision; course entitlement grants do not imply processed payments.

**Performance-first safeguards**

- No staff JS or management RPC in the student exam path; no global admin permission checks added to every exam-answer navigation.
- Vercel management project and backend isolate code and deploys; **shared staging Supabase still requires workload control**: bounded/import workers (500–3,000+ MCQs), separate rate limits/concurrency, efficient indexed metadata queries, off-peak low-priority jobs and backpressure when exam APIs slow.
- Before any real implementation, capture reproducible staging **before** baselines for student auth, Create Test, test launch/question rendering, submission, Result, History, Course catalog and Analytics/Resources. Test the corresponding **after**, including concurrent import/report loads, p50/p95/timeout/error rate and mobile devices. Owner's hard acceptance principle: **no measurable degradation**, not mathematical promise of absolute zero cross-load effect.
- Staging data, security and deployment changes must be reversible, approved separately and never automatically propagated to `main`/production.

## C. Remaining Step 1 decisions before coding

1. **Owner bootstrap and recovery:** verify the actual owner account identifier privately through a secure authorized setup, choose whether staff require mandatory MFA from the first release, and define Owner account recovery without an insecure email override.
2. **Precise initial authorization catalog:** owner-only staff invites/role management and role presets, allowed staff login, restricted staff audit access, how permissions refresh/revoke during a valid session, and per-action allow/deny tests.
3. **Application placement:** validate nested `apps/management/` + separate Vercel Root Directory, exact preview environment project and redirect/CORS/session boundary; do not create now until approval.
4. **Permission-storage schema:** produce a migration design + policy test plan, SQL execution only after specific approval.
5. **Performance measurements and scope guard:** decide how to run safe baseline test on staging without stressing students and what test volume/measurement threshold constitutes no significant regression.

## D. What to do next

**Step 1 read-only technical inspection is complete and documented.** Review this architecture and narrow Phase 1A implementation scope (Owner login, Team Management, per-action permissions, Audit Logs), with a separate explicit owner approval before code/DB/Vercel changes.

**Step 2** then creates the **separate development Management Panel application and Vercel URL**, following the audited security design; its visible login screen is not automatically a functional authorization system until subsequent steps.

No source code, DB records/schemas/policies, Auth settings, accounts or Vercel projects/deployments changed in this audit. Refer to the approved [Management Foundation Blueprint](SJN-MADNEST-MANAGEMENT-PANEL-FOUNDATION-BLUEPRINT-2026-11-06.md) and [Phase 1 Design](SJN-MADNEST-MANAGEMENT-PANEL-PHASE-1-DESIGN-2026-11-06.md).
