# SJN Madnest Management Panel — Foundation Product Blueprint & Cross-Chat Source of Truth

**Date:** 2026-11-06 (Pakistan time)  
**Status:** **FOUNDATION RECOMMENDATIONS OWNER-APPROVED (2026-11-06); PHASE 1 DESIGN AUTHORIZED; NO APP/DB/DEPLOYMENT IMPLEMENTATION APPROVED.**  
**Precise project name for this staff application:** **SJN Madnest Management Panel**. The owner explicitly corrected speech-to-text errors: **S-J-N**, **Madnest** (not Madness; not Exam Madness). The management-panel name does **not** silently authorize a global student LMS brand rename; academy-wide branding is a separate decision.

## OWNER APPROVAL CHECKPOINT — 2026-11-06

The Owner explicitly replied **“Yes, I approved.”** to the developer's question asking for approval of the **seven recommended foundational design approaches as the initial Management Panel blueprint, before Phase 1 design**. This authorizes **architecture and UI specification/design**, not production or staging code implementation, database changes, invitations, admin provisioning or deployment.

**Now accepted as initial product/design foundations** (subject to later owner refinement of individual screens and sensitive operations):

1. **Management permissions:** One protected Owner + equal Management Team Members with reusable presets and fine-grained individual capability flags; Owner alone invites/removes staff or grants staff permissions. Academic editing, reviews, publication, paid access and account-management actions have separately grantable permissions.
2. **Academic publication review:** Configurable Direct Publish / one independent reviewer / optional two reviewers, by applicable content and permission. Initial developer preference: new imported batches default to one reviewer, with authorized Owner override; official past-paper key correction merits review. This is a starting default, not an irreversible all-content mandate.
3. **Registration:** Existing Open registration remains active initially; future Approval Required and Invite Only modes configurable from Management Panel. Student-side **Login → Sign In** and only **Sign Up** hidden for Invite Only; retain backend controls and protect existing accounts during mode transitions.
4. **Bulk import:** Excel (.xlsx)/CSV first, per-row chapter/topic/source classification, optional batch defaults, validation and duplicate preview, drafts, permissioned review/publish, throttled resumable jobs for 500–3,000+ MCQs. PDF/Word extraction separately verified later.
5. **Access and enrollment:** One centralized server-enforced Free/Premium/Restricted feature system with student overrides, course-specific grants/expiry, auditable account suspension, preserving existing student results and independent of payment gateway.
6. **Performance:** A separate Management Panel deployment, segregated workloads, minimal student-path changes and realistic before/after p50/p95 tests, targeting **no measurable LMS/exam regression**. No guarantee of literal zero shared-infrastructure impact.
7. **Management interface:** Professional responsive desktop-first app with Question Content Studio, Courses/Papers, Resources, Students, Feature Access, Team Management, Academic Review, Audit/Reports/Analytics, keeping student exam UI intact.

**Still open, not implicit authorization to implement:** Detailed exact permission toggles, risk/approval policies and bypass controls, rule precedence for active exams and bulk suspensions, how invitations and auth cookies are handled between domains, admin API/schema threat model, SJN Question Bank construction, import processing limits, performance baseline/SLOs, first-phase screen designs and release QA. See the dedicated [Phase 1 Foundation Design](SJN-MADNEST-MANAGEMENT-PANEL-PHASE-1-DESIGN-2026-11-06.md).

## 0. Absolute priority and continuity contract

1. The Management Panel must **not slow the student LMS**. Owner's aspiration is **zero performance impact** on the main student system—especially Create Test, exam UI, timers, submission, Results, Test History, Review/Retake, courses, Analytics, Mistake Diary and Resources. Engineering must be transparent: literal zero impact cannot be guaranteed when data infrastructure is shared. Target **no measurable regression**, establish baseline and compare under realistic concurrent load, throttle background imports, isolate worker/queue resources, and refuse/revert changes that degrade student experiences.
2. Preserve the working examination architecture. Design management operations and data revisions without changing immutable recorded attempts, marks, original past-paper source material or student scoring semantics.
3. **Separate staff frontend Vercel project and staff-only development URL now; later use `manage.<academy-domain>`** when the owner buys a custom domain. The student LMS stays on its existing Vercel site until a separate domain migration plan is approved. A subdomain is not itself authorization.
4. **No coding, schema migration, role provisioning, actual invite, production/main work, Vercel project creation, paid-access policy activation or current student UI changes without explicit implementation approval.** This file records agreed vision and recommendations. `sjn-phase1a-foundation` is the documentation branch; production and `main` separate.
5. This document is the **persistent handover across ChatGPT chats**. Read it with the Master Development Plan and Deferred Register at the start of a new chat. Do not rely on model memory alone; documents contain precise scope, prior decisions, open questions, and safety boundaries.

## 1. Owner-confirmed product decisions (not yet implemented)

### Naming and student authentication language

- Visible management product name: **SJN Madnest Management Panel**. No mandatory 'Deputy' title.
- Student LMS authentication label **"Login" → "Sign In"**. In Invite Only mode, hide **"Sign Up"**, **not "Sign In"**. This is a future scoped UI edit; no code touched.
- **Initially public/free registration remains available**. Owner wants to later switch registration policy from the Management Panel, including public signup, signup with pending approval, or invite-only/admin-created accounts. Once a restriction mode is active, a new student may be able to sign in but must not access protected LMS content until approved. Hiding signup alone is insufficient: enforce signup eligibility/approval on the server.
- Owner wants the option to lock/unlock almost any student-facing feature for all students or selected individual students, and assign course-specific premium enrollment, independent of payment integration; student lock screen should offer **Contact Academy Management for Enrollment** with a later-approved contact workflow.
- No assumption that payment occurs in the LMS. WhatsApp, manual/offline payment or another route remains open and is a **separate future decision**.

### Team and granular privileges

- **Owner is in charge of the Management Panel and staff membership.** Staff team may have 4, 5 or more members, all designated **Management Team Member**, **equal by default if Owner chooses**. There is **no forced Deputy Admin hierarchy**. Owner can also assign individualized capabilities or reuse identical permission sets.
- The Owner exclusively controls admission/removal of members to/from management, admin invitations, assignment of management roles/permissions and privileged elevation. A team member who performs all ordinary operations must **not** thereby be able to invite staff, create admins, promote themselves or alter other staff's permissions. No implicit privilege inheritance or ability to edit Owner powers.
- With explicit grants, team members **can** publish academic corrections, modify answer keys/options/explanations/mnemonics, manage courses/papers/schedules/resources, inspect permitted student academic performance, grant/revoke individual premium course access, manage operational account functions, etc. Owner decides each person's access, including specific restrictions on student account creation, deletion, grants or data export.
- **Academic quality-control workflow is configurable.** Owner wants to permit: (a) writer/editor drafts questions, another authorized reviewer (or reviewers) checks spelling, options, answer key, structure, taxonomy then publishes; OR (b) authorized editor publishes without second-person review when review is not required. This may vary by content type/operation/team; exact review-policy matrix is not yet chosen. Never silently force all content through review or permit unapproved publication contrary to a configured review requirement.

### Scope, SJN Question Bank and student access

- Panel handles **entire existing operational LMS**: question creation/import/edit (statement, A–D, correct key, explanation, mnemonic, images, source), subject/chapter/topic taxonomy including rename/archive, SJN Question Bank when built, existing Past Papers Question Bank and full-length past papers (year, province, paper code/section, source key), My Courses test/session schedules/details and paid enrollment, Academy Resources PDF/folder files, and reports/analytics/activity/accounts/settings. Student exam scoring and architecture remain protected.
- **SJN Question Bank DOES NOT YET EXIST as a published functional bank.** It is a planned separate academy-curated bank and must be explicitly built/managed later; do not imply it is present today. Original Past Papers Question Bank and full-length paper products are distinct. The same ordinary MCQ must not be duplicated into both ordinary banks. Premium course MCQs are segregated until explicitly released by authorized staff.
- Bulk uploading **500, 1000, 2000, 3000+** MCQs must be available as a fast management operation. Each record must retain subject/chapter/topic, options, answer key, explanation/mnemonic and source; a bulk upload must not require opening thousands of per-question forms. Images/diagrams should be supported when their feature is implemented.
- Authorized management users may view permitted student performance, verified number of submitted tests, subject/course results, registered account status and approximate online/active student counts. **Online** requires an opt-in technical presence/heartbeat design, is not currently implemented, and must never be represented as exact real-time studying.
- Owner can select globally **Free/Premium/Restricted** for supported student features, per-student allow/deny overrides and per-course paid/unpaid entitlements. Entire LMS access can be invite/approval restricted without deleting user histories. Don't disrupt active examination sessions when changing policy; define precise emergency suspension behavior before implementation.
- Team/staff accounts should be invited or provisioned **from Team Management inside the panel**, not by manually editing Supabase. Secure server-side Supabase Auth invitation/API and two-factor authentication are potential technical foundations (final workflow still needs owner review).

## 2. Owner-approved design direction — implementation specifics require approval

**The Owner approved the seven recommended approaches as a foundation.** Detailed technical decisions in each section remain design suggestions until separately reviewed; this approval is not authorization to create/change deployed software, roles, content, permissions or data.

### A. Management permissions — role templates + per-action toggles

- **One immutable Owner**, then ordinary **Management Team Members** whose permission bundles are freely selectable (identical to all or different individually). Templates such as **Full Operations**, **Academic Content**, **Courses & Enrollment**, **Student Support**, **Read Only** can prefill toggles; titles do not inherently confer power.
- Fine-grained server-enforced capabilities, ideally within a scoped resource: `questions.view/create/edit/draft/submit_for_review/review/publish/archive/import`; `taxonomy.manage`; `pastpapers.manage/publish`; `courses.manage/schedule/publish`; `resources.upload/publish`; `students.view_academic_summary/view_details/create/suspend`; `enrollment.grant/revoke`; `access_policy.view/change`; `reports.view/resolve`; `finance.view/verify`; `analytics.view/export`; `admin_audit.view`.
- **Staff membership/invitation/role assignment/Owner recovery are Owner-only guarded actions**, not delegable by ordinary "full operations" presets. Owner account must not be demoted, accidentally deleted, suspended or locked out by management-team roles. Require current Owner authentication + stronger verification for especially sensitive operations.
- Privileged use must be audited and immediately revocable. A profile's self-editable metadata is not authorization. RLS plus trusted API checks; avoid per-question roundtrips and costly access queries on every exam navigation.
- Consider **separate permissions for viewing student identifiable information versus aggregated anonymous metrics**; ordinary instructors need not see private student contact/payment information.
- Whether content importers can auto-publish, whether enrollment grants need reason/expiry and whether Owner alone can export personally identifying records remain pending.

### B. Registration and student access modes

Recommend a global mode setting with three possibilities:
1. **Open** (initial): public Sign Up + Sign In, free content accessible according to global feature policy.
2. **Approval Required**: Sign Up remains visible; student can sign in and see **Pending Approval** while waiting for authorized staff approval. Require email verification before request enters actionable queue. Include Approve/Reject, optional reason, notification and audit; rejections should not delete accounts.
3. **Invite Only**: hide Sign Up; keep Sign In for existing authorized accounts; refuse public signup at backend and only permit management-approved account invitations.

**Important transition safety:** when switching from Open to restricted registration, **do not automatically suspend all currently authorized users**; offer a separate, explicitly confirmed bulk-access action. The login page should retain Sign In and password recovery. Separate `can_register`, `account_status` and `feature_entitlements`; switching the registration policy does not by itself guarantee all students lose access.

Recommend **server-verified policy precedence**: suspended account > explicit per-user block > explicit authorized per-user grant > course enrollment/global Free/Premium default. Confirm edge cases with Owner. Never leak protected premium questions in public content APIs or in the client just because a lock is drawn over a card. Revoke access to starting *new* exams promptly; for active exams preserve answer/submit integrity wherever policy allows and explicitly decide emergency suspension behavior.

### C. Review/approval flow

Recommend configurable **per content class and action** policy:
- `Direct Publish`: specifically permitted academic team editors may draft/preview/publish themselves.
- `One Reviewer Required`: writer submits Draft → In Review → Approved → Published; different user reviews/publishes and cannot self-approve.
- `Two Reviewers Required`: possible for high-risk original official key changes or sensitive major content, selectable by Owner; not mandatory as a global rule.
- Permissions for **draft/edit**, **review/approve**, **publish** should be independently configurable. Reviewer sees exact diff, spelling/options/taxonomy/image/source checks and can Request Changes or Reject.
- Published MCQs are versioned; immutable historical test attempts remain tied to their original revisions. For original past-paper source keys, retain the original authoritative source and flag/correct through a documented approved change; never silently overwrite original.

### D. Bulk MCQ import and taxonomy

Recommend **Excel (.xlsx) and CSV first** with a downloadable template including bank, subject, chapter, topic, question, options A–D, key, explanation, mnemonic, source/year/paper/code, optional figure asset reference. Imports can contain mixed chapters/topics **per row**; upload wizard can also set **batch defaults** or map source columns/worksheets. Use controlled taxonomy selectors/mapping and normalization to avoid silent typos that create new topics.

Staging workflow: Upload → Parse and validate → map taxonomy → duplicate detection → fix errors in preview grid → save as Draft batch → optional team review → **Publish batch**. Show exact record counts/errors; 500–3,000 records in **chunked throttled background jobs** with idempotent retries and no unfinished partial publication. For PDF/Word source, separate extraction/review stage, **never claim error-free automatic chapter/topic classification**.

### E. Premium/free settings and student account management

Recommend a centralized **Access & Enrollment** module with global Free/Premium/Restricted feature policies, student-specific allow/deny, selected-course entitlements (start/expiry/automatic expiry), and account approval/suspension; **record reason and staff actor** for grants/revocations. Payment verification/WhatsApp integration remains a **separate deferred business decision**.

Recommend **Archive/Suspend rather than hard delete** for students/questions/chapters/sessions that possess exams/results, with dependency checks, explicit confirmations and an audited recovery path. Never mutate immutable stored scores to comply with a new feature-lock policy.

### F. Student LMS performance isolation and verification

**Owner acceptance target: no measurable student LMS slowdown**. Shared DB means literal zero guaranteed under every workload is impossible. Recommend:
- Distinct Vercel management deployment and dedicated authenticated admin backend routes. No admin UI code loaded into student exam.
- Asynchronous worker/batch processing for 3,000-MCQ imports/figures/PDFs, throttled by workload and backpressure; separate worker concurrency limits and low-priority scheduling.
- Targeted indexes, pagination, selective database read/write, predictable metadata queries and caching with sensible invalidation. Avoid entire student population scans or full-course/report aggregation in request-critical paths.
- Baseline and post-integration measurement of **p50/p95** for Create Test, question retrieval, submit, Result/History, dashboard, resource open, plus real mobile device; concurrent student exams with active bulk uploads.
- Define exact performance acceptance threshold with Owner/engineer after measuring baseline. No false claim of literal guaranteed 0%; revert/pause risky admin jobs if student performance degrades. Keep grading/History out of Admin content edits.

### G. Management UI and operational governance

Recommend a professional **responsive desktop-first (also works on mobile)** management workspace:
- Dashboard/Academy Overview: verified totals, recent enrollments, content pending review, import jobs, approximate online now, student activity.
- Question Content Studio: **SJN Question Bank (future)**, Past Papers Question Bank, subject/chapter/topic, MCQ/editor, images, import jobs, revision history.
- Full-Length Papers; My Courses/Tests/Sessions/Schedules; Academy Resources; Students/Enrollment; Free/Premium Feature Access; Team Management & Permissions; Reports/Academic Quality; Analytics; Activity/Audit; Settings.
- Quick search by stable MCQ/question ID and student identity, nontechnical forms, safe undo/archive, Save Draft/Preview/Publish, activity log and clear status labels.
- Only show operational controls staff are authorized to use; still enforce access on backend.
- Stay in same design family as academy but distinct management style; **no need to restyle accepted student LMS**, and no new student module/navigation item is needed for staff.

## 3. Deferred work inventory — retained; DO NOT conflate with current completed features

The owner explicitly asked developers to remember these while designing Admin Panel:
- **FF-001:** Automatic balanced but meaningfully chapter-bank-weighted MCQ distribution. Product policy agreed and documented, **engine not implemented**. No custom chapter quota; target 9/eligible 7 -> use 7, reassign 2 within filter when feasible.
- **SJN Question Bank:** **not yet built**; anticipated independent ordinary bank, with bulk academy-curated publishing and duplicate prevention (FF-007 and Future QB plan).
- **Five-level achievement/performance criteria:** dashboard concept exists but exact level thresholds/rules pending, not part of Admin phase 1.
- **FF-004:** 200 → 220 examination-question limit; affects validation, exam, history and performance; separate owner-approved regression-tested implementation.
- **FF-005:** Image-backed/diagram MCQs in editor and student exam, preserving source rights and mobile speed; Admin authoring design dependency.
- **FF-020:** Real Report Issue submission and management inbox; existing Report Issue UI is **not real persisted reporting**.
- **FF-024/025:** Classify incorrect MCQs from saved **Result Review** and **Test History Review**, shared Mistake Diary category, category-only safe updates preserving notes/status; explicitly deferred until after Admin foundation. **Do not** fold all Marked questions into Mistake Diary.
- **FF-002:** optional later Question Bank/subject/chapter/topic count badges and per-student filter counts.
- **FF-008/009/013:** real paid course entitlements; academy-authored course/test/session availability/scheduling; replace static/dummy fixtures where appropriate. Entitlements **release blocker** before premium production.
- **FF-011/012:** premium questions segregation/manual academy release, strict mock exam rules (not interchangeable with ordinary practice Save & Exit).
- **FF-014:** contact/WhatsApp enrollment action optional deferred.
- **FF-023:** genuine PDF first-page loading performance improvement deferred; preserve stable current R2 streaming/Academy Resources and do not reintroduce rejected preview hacks.
- **FF-021/022:** optional dark/light appearance and promotional course banners. **FF-003** custom distribution closed/rejected.
- AI Tutor has a separately suspended Google Cloud service; do not promise live admin controls for it until service resumes and implementation is approved.
- **Do not reopen completed** five Create Test filters, saved Test History, marking, Results delay, accepted Dashboard/Analytics/Mistake Diary just because older handovers contain historical unfinished language.

## 4. Proposed implementation stages (not authorized yet)

1. **Phase A: Secure foundation** — separate management preview project, authenticated Owner, owner-only staff invites, per-action access controls, audit log. Preserve normal student sign-in. Consider basic read-only student listing only if permissions are proven.
2. **Phase B: Registration and entitlement policy** — global registration modes, student approval queue, feature gates and per-course server-enforced premium access. This is a **production release security dependency**; regression test all existing exams/results and never ship a cosmetic-only lock.
3. **Phase C: Question Content Studio** — taxonomy editor, individual editor, source/version protection, Excel/CSV bulk imports, image-backed MCQ design and SJN Question Bank authoring after approved implementation.
4. **Phase D: Courses/Past Papers/Resources operations** — author session/tests/schedules/papers with code/year/region, enrollments, Academy Resources uploads and permissioned review.
5. **Phase E: Quality/Insights/Reports** — academic approval inbox, Report Issue, student performance/approximate online presence, operations analytics. Some quality flow must ship earlier with publishing if Owner chooses mandatory review.
6. **Independent student-exam enhancements** (220 max, chapter distribution engine, Mistake Diary review shortcuts) require their own separate test and approval windows, **not hidden inside the Admin foundation**.

## 5. Foundation approved — details still to finalize

| Item | Proposed default | Decision state |
| --- | --- | --- |
| Staff identity | Owner + equal Team Members; individually toggle capabilities; Owner alone invites staff | **Core agreed; exact toggles pending** |
| Student registration | Open now; Approval Required/Invite Only selectable later; existing authorized users not auto-blocked | **Choice of modes agreed; transition rules recommended** |
| Student UI wording | Login → **Sign In**; hide Sign Up (not Sign In) in Invite Only | **Agreed, not implemented** |
| Academic reviews | Configurable Direct Publish vs 1 reviewer (optional 2 for exceptional cases) by content/operation | **Flexibility agreed; policy defaults pending** |
| Bulk file types | XLSX/CSV first; PDF/Word pipeline later with verification | **Recommendation pending** |
| Student access precedence | Suspended > explicit block > explicit grant > global tier and course entitlements | **Recommendation pending** |
| Student account deletion | Suspend/archive with reversible audit, avoid destructive deletion of history | **Recommendation pending** |
| Performance acceptance | No measurable regression under before/after representative concurrent exam+admin tests | **Owner principle agreed; quantitative pass criteria pending** |
| Admin UI structure | Desktop-first responsive studio with modules detailed above | **Recommendation pending** |
| Payment mechanism | Deferred; enrollment operational independently | **Deferred by Owner** |
| SJN QB | Not built; owner requires admin management when built | **Status and direction confirmed; build phase pending** |

## 6. Developer handover instructions

At next chat start, read **this blueprint**, `docs/SJN-ADMIN-MANAGEMENT-CONSOLE-PLANNING-HANDOVER-2026-11-06.md`, `docs/SJN-FUTURE-FEATURES-AND-DEFERRED-DECISIONS-REGISTER.md`, `docs/SJN-LMS-MASTER-DEVELOPMENT-PLAN.md` and relevant feature handovers. Continue discussion by asking Owner to accept or adjust the **recommended policy defaults**, not re-asking already settled basics.

**Current work is documentation/planning only. DO NOT create management app, admin user, Vercel project, SQL migration, Auth config, change Login label, turn on feature locks, release bank questions, alter LMS exam or deploy.** Wait for explicit implementation approval and first-phase scoped checklist.
