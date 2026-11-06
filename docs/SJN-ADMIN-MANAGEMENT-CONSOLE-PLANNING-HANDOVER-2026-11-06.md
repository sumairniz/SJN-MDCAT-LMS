> **2026-11-06 — CANONICAL NAME AND OWNER BRANDING CORRECTION:** Correct official product name **SJN MedNest Management Panel** (allowed uppercase **SJN MEDNEST**). Previous “Madnest” is a speech-to-text/design error and **must not be reused in interface or new project names**. The new isolated Vercel project is now **`sjn-mednest-management`**, with protected **READY** preview `https://sjn-mednest-management-k3x8cakor-sjn1.vercel.app` at commit `b1145993fa482c4aec81034f1776e37c1234bcb7`; GitHub checks passed. The current **landing-page `SJN` mark** is used instead of the single-letter S until the Academy logo is officially finalized. Future custom subdomain **`admin.<academy-domain>`** (supersedes manage.). Every staff member has a real verified security identity **independent from an optional Owner-selected display name/nickname/pseudonym and optional organizational title** (e.g. CEO, Academic Director); titles never grant permissions. Team directory metrics must be verified, not fabricated. Sidebar SVG consistency, type readability, headline proportion and conceptual team preview refined only inside `apps/management/`; student LMS remains unchanged. Full official spelling/branding/profiles checkpoint: [MedNest Branding and Team Profile Checkpoint](SJN-MEDNEST-MANAGEMENT-PANEL-BRANDING-AND-TEAM-PROFILE-CHECKPOINT-2026-11-06.md). Older handover **filenames** with `MADNEST` are preserved historical links, NOT approved product branding. No Supabase changes, staff login or real admin capabilities deployed.

> **2026-11-06 — FOLLOW-UP APPROVAL:** The Owner explicitly approved the seven recommended foundations for **SJN Madnest Management Panel**, including granular Owner-managed staff roles, configurable academic review, registration modes, XLSX/CSV bulk imports, secure Free/Premium course and feature entitlements, performance isolation and professional responsive UI. **This is approval of design direction, NOT application, Supabase, account, Vercel or production implementation.** The up-to-date record is [Foundation Blueprint](SJN-MADNEST-MANAGEMENT-PANEL-FOUNDATION-BLUEPRINT-2026-11-06.md); the proposed minimal implementation slice and unresolved security decisions are in [Phase 1 Foundation Design](SJN-MADNEST-MANAGEMENT-PANEL-PHASE-1-DESIGN-2026-11-06.md). Continue from those documents, not older discussion-state headings.

> **2026-11-06 — LATEST OWNER CLARIFICATIONS AND NEW SOURCE OF TRUTH:** The exact name is **SJN Madnest Management Panel** (S-J-N, Madnest; not Madness or Exam Madness). Owner wants future **Login → Sign In** label on student LMS, and in Invite Only mode hide **Sign Up only**, retaining Sign In. Free/Open registration remains default until changed by an authorized operator. Team members are peers with optional identical or individually assigned granular permissions—**no obligatory Deputy title**—and Owner retains sole staff access grants. Academic publishing review is **configurable**: direct publication by permitted team members OR designated second-person reviewer(s) who check accuracy/spelling/options before publishing. SJN Question Bank **does not currently exist**, but its future authoring belongs in this console. Panel must not slow main LMS: target no measurable performance regression under realistic student-exam + admin load; no literal zero-impact guarantee. See **[SJN Madnest Management Panel Foundation Blueprint](SJN-MADNEST-MANAGEMENT-PANEL-FOUNDATION-BLUEPRINT-2026-11-06.md)** for detailed owner decisions, developer recommendations awaiting approval, deferred inventory, and cross-chat continuation. This is documentation only, NOT implementation authorization.

# SJN MedNest Academy — Management Console Planning & Next-Session Handover

**Date:** 2026-11-06 (Pakistan time)  
**Status:** **OWNER REQUIREMENTS CAPTURED / DISCUSSION ACTIVE / IMPLEMENTATION NOT APPROVED**  
**Owner instruction:** Stop for the night; next session resumes from this document. No application code, Supabase, admin accounts, access rules, Vercel config, deployment or live data should be changed from this discussion alone.

## 1. Academy Management Console objective

The owner is building the academy website for the first time and wants to manage **ordinary academy operations without coding or manually using GitHub/Supabase**. Authorized staff should manage MCQs, original past papers, courses/tests, source taxonomy, images/resources, answers/explanations/mnemonics, student enrollment and access, staff assignments, reports (when implemented), and content publishing entirely through an understandable professional interface. New infrastructure features/complex engineering can still need development.

The previously proposed architecture to **evaluate**, not yet approved: a staff-only management application possibly at `manage.<academy-domain>` (or a secured same-domain path), on a separate deployment from the student LMS while sharing carefully secured APIs and authoritative data. **Domain, subdomain, app name, deployment shape, layout and authentication approach are NOT decided**; review options and security before any implementation. The owner does not require the visible label to be 'Admin Panel'; Management Console / Control Center and other names remain candidates.

## 2. Owner-specific permissions model — confirmed requirements

**Central principle: the Owner controls who may access the staff/management application and which exact actions each person may perform.** Staff access is granted intentionally to named authorized users; student accounts must never receive staff powers just by discovering a URL or by altering the frontend.

**Permissions must be granular; fixed titles alone are not enough.** The owner may grant/edit/revoke narrowly scoped capabilities such as:

- Enter Management Console / view permitted modules.
- Create/edit/draft/publish/archive MCQs; change statement, A–D options, correct key, explanation, mnemonic, chapter/topic/source; manage imports and images.
- **Publish academic corrections:** explicitly **delegable by Owner** to trusted editorial staff, not owner-only.
- Manage courses, schedules, tests and past papers; manage digital library and reports when built.
- Search/view student accounts; create student accounts (if enabled), edit permitted account details; disable/remove where explicitly permitted.
- Grant/revoke **paid course access** to specific students, separately from other student-management capabilities; **delegable by Owner** to trusted operators. There is no requirement that only the Owner can enroll students.
- View or verify manual payment references, if a payment workflow is later approved; do not conflate this with permission to grant staff roles.
- **Manage staff/management console access**: invite a person, grant/revoke roles, modify permissions and assign staff access. This is a **distinct, highly sensitive capability**; the Owner must be able to withhold it even from a deputy who performs nearly every other management task.

**Important real-world role examples requested:**

1. **Owner / Super Admin:** ultimate control over management membership and all available permissions.
2. **Deputy / Operations Admin:** potentially allowed to do **almost every academy operational action**, including permitted MCQ edits/corrections, courses, student enrollment and content publishing, **but must be unable to invite new management staff, create other admins, grant administrative roles, modify staff permissions or elevate own privileges**.
3. **Restricted management teammate:** may edit/manage selected academy areas but **cannot create student accounts, grant paid or staff access, or delete accounts/content**, depending on the precise owner-selected permission set.
4. Other tailored combinations should be possible; owner should not be forced into a handful of rigid job titles. Propose **role presets plus fine-grained permission toggles** with least privilege, specific ownership and an admin-access decision that cannot be delegated implicitly. The detailed permission matrix and ultimate staff-delegation rules remain to be finalized next session.

**Security and audit direction (engineering recommendation, not owner-approved design yet):** Enforce privileges on backend and at the DB/storage layer, not via hidden buttons or user-editable metadata; prevent self-promotion and cross-student data access; record who did sensitive work; consider mandatory MFA for staff, change confirmation, draft/review/publish and reversible archive/revision history. Do not replace the existing student authentication/exam flow casually.

## 3. Paid content and payments — separate decisions

- Students may access free Create Practice Test/question-bank features while **selected premium courses are locked**.
- Owner-authorized staff with the precise enrollment capability may unlock/revoke a **specific course for a specific student** (with future expiry/status rules); the server must enforce access so students cannot bypass locks by using direct URLs/APIs.
- **Do not assume payments happen within the LMS or Admin Panel.** Payment may happen through WhatsApp, manual transfer or an external/offline mechanism. Payment-provider integrations, receipts, verification and automation will be discussed **later**. Course access management must work independently of immediate payment-gateway integration.
- Keep genuine paid course entitlements and staff management access separate; neither grants the other automatically.

## 4. Large-scale MCQ upload — confirmed need; detailed UX pending

Owner needs **fast bulk import of approximately 500, 1,000, 2,000 or 3,000+ MCQs**, in addition to convenient one-by-one editing. Bulk upload is essential; **manual entry of every chapter/topic per individual question must not become a requirement**.

Potential workflow to design and discuss next session, **not chosen or implemented yet**:

1. Provide a **downloadable Excel/CSV template** with per-row MCQ statement, four options, correct answer, explanation/mnemonic, bank, subject, chapter, topic and source metadata. A single spreadsheet can contain different chapters/topics, and importing 1,000+ records remains one bulk operation.
2. Allow **batch default values** for a whole upload when many questions share a chapter, topic, subject or source, with per-row override for mixed imports.
3. Consider a **folder/sheet grouping or import mapping UI** to assign common metadata to subsets of a file. PDF/Word extraction is a separate, lower-confidence pipeline requiring human review, not guaranteed perfect auto-tagging.
4. Stage an **import preview/validation** showing missing keys, invalid choices, duplicates, unknown chapter/topic labels, inconsistent answer explanations and original-source discrepancies. Let staff fix erroneous rows in a batch grid before publishing.
5. Process large imports in **bounded, resumable chunks/background jobs** with progress, error reports, safe retries and idempotency; do not publish a partially imported set as if it were complete.
6. Store versioned, source-preserving question revisions. Do not overwrite the original answer/key of previously submitted historical attempts. Editing/deleting published MCQs should be safe and auditable.

The Owner asked specifically **how per-MCQ chapter/topic tagging is possible in bulk**. **Answer to resume with tomorrow:** use spreadsheet columns for per-question chapter/topic, optionally group defaults or mapping; the uploader validates mappings and can flag unclassified records. Bulk upload does not eliminate per-question metadata but eliminates manually opening 2,000 separate question forms.

## 5. Previously discussed content-management scope

- Single-question creation, editing, corrections and image-backed MCQs with revision preservation; source bank separation (SJN Question Bank vs Past Papers Question Bank), full-length papers, course-test content.
- Course creation, schedules, premium access, manually chosen enrollment/lock and safe publication.
- Academy Resources private files (PDF and later supported media), upload/folder management, existing R2 storage constraints.
- A future real Report Issue submission and staff inbox, deliberately deferred until the management workflow exists.
- Ongoing server-side permissions, student history/results integrity and simple nontechnical UI are first-class requirements.
- Previous developer **recommendation**: a separate staff-only application/subdomain; owner is still evaluating, not yet approved.

## 6. Open planning questions for the next discussion

1. Final management application placement (same domain path versus staff subdomain), deployment isolation and visible name.
2. Role presets, **per-action permission matrix**, owner-only staff invitation/role-assignment safeguard, staff-account recovery policy, and boundaries for student deletion and payment verification.
3. Exact bulk-import file types (Excel/CSV/Word/PDF), source taxonomy schema, batch defaults and corrections workflow; test against 500–3,000 real candidate MCQs.
4. Admin features in phases: secure foundation and entitlement enforcement, content studio/bulk import, courses/papers/student enrollments, resources/reports/finance.
5. Paid-course access lifecycle/expiry, proof of external payment (if recorded), cancel/refund rules—**payment method intentionally deferred**.
6. Academic approval requirements for publishing changes to official keys, and who can publish vs merely draft.

## 7. Non-negotiable project boundaries

- **No implementation authorization has been given** for the Management Console. Today's instruction authorizes **documentation only** and requests discussion next session.
- **Never modify** the current approved student exam/Results/History/Analytics/Mistake Diary architecture for an administrative convenience. All planned changes require scoped review, owner approval and staging QA.
- Staging development branch: `sjn-phase1a-foundation` in `sumairniz/SJN-MDCAT-LMS`; `main`, production Vercel and production Supabase are **not approved** for changes.
- Cross-reference: `docs/SJN-LMS-MASTER-DEVELOPMENT-PLAN.md`, `docs/SJN-FUTURE-FEATURES-AND-DEFERRED-DECISIONS-REGISTER.md` FF-007/008/009/010/020, `docs/SJN-CREATE-TEST-AUTOMATIC-CHAPTER-DISTRIBUTION-POLICY-2026-11-06.md`, and the future review-classification FF-024/025 requirements.

**Resume prompt for tomorrow:** “Continue the Admin Management Console discussion from the 2026-11-06 handover. Start with role presets and granular permissions (including a deputy without staff-invite power), then explain bulk imports with chapter/topic metadata. Do not implement without approval.”
