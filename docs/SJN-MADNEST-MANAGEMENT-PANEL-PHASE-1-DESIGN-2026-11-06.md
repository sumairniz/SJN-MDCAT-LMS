> **2026-11-06 — PREMIUM POLICY SCOPE CORRECTION / STAGING PROMOTION DIRECTIVE:** User ruled out making individual MCQs, chapters or topics Premium; only **whole bank, whole feature or whole course/session** access is Free/Premium/Restricted, with per-student grant/deny at those same scopes. Entire scheduled course session unlocks its constituent tests subject to ordinary schedule rules, rather than per-question sales. Separate course-assessment question content from publicly readable question banks purely for access/security, not per-question pricing. Owner further designated our **feature-rich staging LMS as the source of truth and eventual production release candidate**; the old skeletal production app is not the target to continue building. Any production release still requires deliberate promotion of code, migrations, source content, Auth/permissions, private storage and measured QA into production: **no merging, environment rebinding, or data migration today**. **Next phase:** Step 2 Management Panel app with an independent development Vercel URL; design/implementation requires a separate scoped go-ahead after Step 1 audit.

> **2026-11-06 — STEP 1 READ-ONLY ARCHITECTURE AUDIT COMPLETED:** Owner authorized beginning the first Phase 1A technical foundation step. Actual existing code, staging Supabase RLS/security/performance advisors, and Vercel project inventory were reviewed without implementation changes. **Important gates:** existing student developer-token is not staff RBAC; `mcqs` has anonymous SELECT including correct keys, so premium question segregation is mandatory; course pilot lacks paid entitlements; isolated `apps/management` project and separate authenticated staff API with Owner-guarded permissions are proposed; Supabase security advisors have two existing warnings. Full findings and next approvals: [Step 1 Security Architecture Audit](SJN-MADNEST-MANAGEMENT-PANEL-STEP-1-SECURITY-ARCHITECTURE-AUDIT-2026-11-06.md). Nothing deployed or provisioned.

# SJN Madnest Management Panel — Phase 1 Foundation Design (pre-implementation)

**As of:** 2026-11-06 (Pakistan time)  
**Owner approval scope:** Seven initial **foundation approaches were approved** on 2026-11-06. **This document is a preliminary technical and workflow design**, not authorization to build, deploy or alter database/security/account settings.  
**Name:** **SJN Madnest Management Panel** (never "Madness" or "Exam Madness").  
**Development:** documentation only on `sumairniz/SJN-MDCAT-LMS` branch `sjn-phase1a-foundation`. Neither production nor `main` approved.

## 1. Phase 1 goal and non-goals

**Goal:** Establish a dedicated staff-only Management Panel foundation, secure Owner account, Owner-controlled team membership/invitations, reusable role/permission templates plus per-person fine-grained permissions, verifiable access enforcement, immutable staff action/audit records and a professional navigable shell. Keep the student-facing LMS fast and unchanged until a separately approved integration.

**Out of Phase 1 initial implementation:** MCQ publishing/import, new SJN Question Bank, image exam rendering, 220-MCQ test limit, new automatic chapter allocator, Report Issue submissions, entire student Free/Premium access conversion, student self-signup mode switching, live student activity tracking, paid payment processing, course authorship. Their designs must inform the foundation but not be smuggled into Phase 1.

## 2. Proposed application and API boundaries

- **Separate Vercel project and preview** for `SJN Madnest Management Panel`; design for future staff subdomain `manage.<academy-domain>`. Student LMS remains on its current project/domain. No domain needs purchasing yet.
- Consider a separate staff application's backend endpoints (e.g. `/api/management/*`) that authenticate every call, recheck current owner/staff permission, and access Supabase with scoped privileged operations; don't reuse the existing `x-admin-token` developer-content check as staff authentication.
- The established student app shares underlying record IDs and revision history, **not UI bundles**, so management scripts don't load in exams.
- Supabase privileged keys stay server-only. Prefer least-privilege database roles, RLS and protected functions. Short-lived access claims can be stale after permission revocations; privileged APIs should consult an authoritative permission source and handle revocation promptly.
- Require secure, verified staff login; MFA strongly recommended/required for privileged functions, account recovery designed separately, rate-limit and audit sensitive functions. Invite via trusted backend and verified email, with time-limited acceptance.
- Protect `main`, current student Vercel and production Supabase; staging proof and rollback before any future release.

## 3. Proposed initial account and permission data design (names subject to implementation audit)

Potential tables/records (illustrative only):
- `management_memberships` — user ID, staff status (invited/active/suspended), created/invited by, timestamps; staff membership independent of student profile roles.
- `management_permission_definitions` — stable permission code, category, description and sensitivity.
- `management_permission_presets` — owner-defined reusable templates, such as Full Operations, Question Editor, Academic Reviewer, Enrollment Manager, Read Only; equal Team Member designation regardless of template.
- `management_member_permissions` — effective per-member granted permissions/overrides with actor, reason and timestamp. Must not permit self-promotion; only Owner can add/remove staff or grant/revoke staff permissions.
- `management_audit_events` — append-only action, actor, target/resource and safe before/after difference metadata, UTC timestamp, request correlation, success/failure; retain privacy controls and avoid storing passwords/tokens or unrelated student sensitive details.

**Preliminary operation permissions** to refine with Owner: content view/create/edit/import/publish/archive; review assign/approve; taxonomy manage; past paper manage/publish; courses manage/schedule/publish; student academic overview/view personal details/create/suspend; enrollment grant/revoke; feature access view/change; academy resource manage; reports review/resolve; audit view/export; finance/payment verify (separately from premium access); announcements manage; dangerous settings. **Reserved Owner-only:** staff invitation/removal, team privileges/presets and immutable Owner access/recovery.

**Permission model:** a member can have **Full Operations** or specific permission combination, with no "Deputy" rank. Owner can give five team members exactly the same abilities or different permissions individually. Changing a preset and its effect on already assigned staff must be a separately explicit, audited policy.

## 4. Phase 1 proposed screens and validation

1. **Management sign-in screen:** isolated staff-only experience; nonstaff should receive Access Denied (no data leaks or privilege elevation), password reset and MFA options (scope pending).
2. **Academy Overview:** verified counts only, safe empty states, no expensive scan of student history on page load. Phase 1 can initially show capability-linked module links and security status; student analytics comes later.
3. **Team Management (Owner only):** invitations with email and preset, pending/accepted/revoked status, full staff list, edit individual permission toggles, suspend or revoke, cannot remove last Owner.
4. **My Access (staff):** view granted permissions and security status, cannot increase own access.
5. **Audit Log (Owner / explicitly permitted viewer):** paginated list of staff access and policy changes, filtered by actor/action/date, no destructive editing.

**Proposed acceptance tests:**
- Student account cannot enter staff panel or reach management APIs.
- Authorized staff can see/act only on permitted modules. A Full Operations member cannot invite staff or edit staff grants.
- Revoked/suspended staff account promptly loses management access; stale existing browser session cannot preserve privilege.
- Owner cannot be demoted or removed through staff endpoints; invite and permission-change actions have audit entries.
- No privileged server key in frontend, logs or network response; RLS/storage checks prohibit cross-student data leakage.
- Independent panel deployment, no change to exam JS bundle; student LMS metrics baseline and follow-up recorded.
- Under test of concurrent admin activity, student Create Test, exam submit, Result, History and analytics exhibit **no measurable degradation** against baseline within tested measurement variability. Pause admin jobs if this target fails.

## 5. Decisions remaining before specific implementation authorization

1. Confirm exact Phase 1 scope and which staff screen(s) should be built first; proposed minimal slice: **Owner Sign In → Team List/Invite → Permission Editor → Audit**.
2. Owner account verification and bootstrap procedure (no arbitrary email auto-promotion); recovery, multiple owners (recommended single protected Owner), MFA requirement.
3. Exact permission catalog and any sensitive action safeguards; effect of changing shared permission presets; effective revocation window.
4. Technical assessment of current auth/session architecture and whether management backend needs its own origin/cookie handling, CSRF defense, transport, environment and app configuration.
5. Performance baseline methodology and any budget/isolation needs; realistic student load before sign-off.
6. Final visual UI approval for desktop/mobile initial screens and any associated content copy.
7. Separate owner implementation go-ahead before code, infrastructure, database, Vercel or Auth changes.

## 6. Next cross-chat handover

Seven approaches are **OWNER APPROVED as a foundation**. No implementation has started. At next step, present the **proposed Phase 1 small functional slice** and permission details for approval, then implement only after explicit authorization, with staging-only work and verifiable regressions. Refer to [Foundation Blueprint](SJN-MADNEST-MANAGEMENT-PANEL-FOUNDATION-BLUEPRINT-2026-11-06.md), [Full Management Handover](SJN-ADMIN-MANAGEMENT-CONSOLE-PLANNING-HANDOVER-2026-11-06.md), and [Master Plan](SJN-LMS-MASTER-DEVELOPMENT-PLAN.md).
