# SJN MDCAT LMS Pro — Future Features & Deferred Decisions Register

**Created:** 2026-11-01 (Pakistan time)  
**Working branch:** sjn-phase1a-foundation  
**Baseline reviewed:** development commit 37d1be9d2e2b4e9efb3adce4690a27d81fffdb94 (2026-11-01)  
**Purpose:** One concise, permanent index of product features and decisions that are **not yet implemented or finalized**, especially items the owner said to do **later**. Read this before answering “What features remain?” or planning a new phase.  
**Authorization:** Documentation-only organization of existing decisions. **No feature, code, migration, external integration, deployment, production merge or configuration change is authorized by this register.**

**Companion documents:** [Master Development Plan](SJN-LMS-MASTER-DEVELOPMENT-PLAN.md) · [Developer / AI Handover](SJN-DEVELOPER-HANDOVER-AND-ACCESS.md) · [Future Question Banks & Create Test](SJN-FUTURE-QUESTION-BANKS-AND-CREATE-TEST.md) · [Deferred Work historical log](SJN-DEFERRED-WORK-AND-OWNER-DECISIONS.md) · [Temporary Change Register](SJN-TEMPORARY-CHANGE-REGISTER.md) · [Release Safety Checklist](RELEASE-SAFETY-CHECKLIST.md).

## 1. How to interpret this register

- **OWNER-DEFERRED:** The owner explicitly said to revisit the item later. Do not begin it until the owner reactivates and approves its exact scope.
- **FUTURE DIRECTION:** A longer-term intent or preliminary idea, **not** a finished requirement or permission to implement.
- **DECISION PENDING:** A specific product/technical policy must be discussed and approved before coding.
- **PARTIAL / INTEGRATION OPEN:** Limited UI, staging work or foundation already exists; the remaining feature must not be described as fully implemented or production-ready.
- **OPTIONAL:** Discuss only when the owner chooses to revisit it.
- **CLOSED / CANCELLED:** Not an active item. Preserve historical rationale but do not offer it as unfinished work.

**Precedence:** The newest explicit owner decision and accepted GitHub checkpoint override older phase plans. Older future-looking text about filters, Mark for Review, Results/Retake or Save & Exit may describe work that has **since been completed on staging**. This register must never silently reopen it. Existing accepted staging functionality is separate from production release approval.

## 2. Active future features and owner decisions

### A. Content, Question Banks, examination and resources

| ID | Feature / decision | Status | Current boundary / what to decide later |
| --- | --- | --- | --- |
| FF-001 | **MCQ Selection & Distribution Engine policy** | **OWNER-DEFERRED / DECISION PENDING** | Existing practice selection randomly samples eligible MCQs without replacement; it does not enforce equal or fixed subject quotas. Owner expressly deferred allocation policy. Do not change the selection engine until a separate decision. |
| FF-002 | **MCQ count labels / badges** | **OWNER-DEFERRED** | Future global counts beside bank, subject, chapter, topic and per-student Unused/Incorrect/Skipped/Marked/Correct counts. Do not add count badges or arbitrary unlock thresholds now. Existing test-length input and available-count hint are separate, already existing UX. |
| FF-003 | **Per-chapter custom MCQ allocation** | **OPTIONAL / DECISION PENDING** | Potential ability to assign counts to selected chapters. An idea, not a requirement; decide UX and compatibility with the selection engine before implementation. |
| FF-004 | **220-question / current 200-question limit review** | **OWNER-DEFERRED / DECISION PENDING** | Current curated Past Paper launcher and submission path document a 1–200 limit; the 220-MCQ adjustment was expressly excluded from the October 29 scoped work. Revisit only after deciding target maximum and all timer, validation, performance, and history implications. |
| FF-005 | **Native diagrams and image-backed MCQs** | **FUTURE DIRECTION** | Actual question images/figures and secure Supabase Storage association are not integrated. BUMHS Q175 and NUMS Q91 presently use owner-approved text descriptions/fallbacks where needed. Preserve published MCQs and source figures; obtain separate source-review, content rights, storage, fallback and device-performance design. |
| FF-006 | **Academy Resources / original PDFs** | **FUTURE DIRECTION** | A separate resources/document area may eventually manage original PDFs and study material. **Past Papers** is a browser of playable curated tests, not a PDF viewer; no PDF/resource integration was authorized by Past Papers UI approval. |
| FF-007 | **Large question-bank publishing, taxonomy and duplicate-management policy** | **FUTURE DIRECTION / DECISION PENDING** | Plan for tens of thousands of MCQs, robust source/year metadata, duplicate review, efficient pagination/search and bulk validation. The same ordinary MCQ must not appear in both Past Papers Question Bank and SJN Question Bank. Do not change existing owner-approved records/keys or migrate data without a versioned, approved plan. |

### B. Courses, restricted assessments and Academy operations

| ID | Feature / decision | Status | Current boundary / what to decide later |
| --- | --- | --- | --- |
| FF-008 | **Real course enrollment, paid access and server-enforced entitlements** | **PARTIAL / INTEGRATION OPEN — RELEASE BLOCKER** | Genome's 79 MCQs / three published curated tests function on **staging**, but any authenticated staging student can access them for the pilot. There is no real enrollment/payment/role-based course authorization system. Enforce permissions on the server before any production course release; do not treat sample “enrolled/locked” UI as security. |
| FF-009 | **Academy-managed course/test authoring and scheduling** | **FUTURE DIRECTION / NOT APPROVED** | Real academy authoring, published catalogs, assignments, session schedules, availability rules, allowed Tutor/Timed modes, admin editing and permission policy still need an owner-approved system. Existing Early Mock / Final Sprint are illustrative, not real enrollments/tests. Legacy courses table is not the approved new backend. |
| FF-010 | **Full Admin Panel** | **FUTURE DIRECTION / NOT APPROVED** | Future authorized workspace for MCQ imports, validation, immutable corrections, publish/archive, question banks, course tests, enrollment, resources, and student reports. Owner will specify roles and detailed workflows later; never expose admin privileges based on frontend hiding. |
| FF-011 | **Premium MCQ segregation and manual release to a regular bank** | **FUTURE DIRECTION / DECISION PENDING** | Protected course questions should remain separate from ordinary daily practice banks. After a course ends, only owner/authorized admins may *manually* select questions for one ordinary bank. No automatic expiry-based transfer and no student publishing. Review answer-key visibility and authorization before release. |
| FF-012 | **Strict mocks and exam-specific rules** | **FUTURE DIRECTION / NOT FINAL** | Real high-stakes/course mocks require separately approved timer, Save & Exit/pause/resume, grading, content-visibility and retake policies. Do not automatically inherit ordinary practice-test rules. Share the existing exam interface where appropriate; no parallel duplicated engine. |
| FF-013 | **Real course access/availability status, scheduling and progress beyond the Genome pilot** | **PARTIAL / INTEGRATION OPEN** | Genome uses genuine saved attempts/drafts for its progress and Last Attempt; other session cards/statuses are examples. Replace fixtures with authoritative enrollment, availability and test assignments; never fabricate completions, percentages or results. |
| FF-014 | **Course contact / WhatsApp enrollment workflow** | **FUTURE DIRECTION / NOT APPROVED** | Mentioned as deferred during Courses UI revisions. Neither actual contact action nor WhatsApp-based enrollment flow is implemented; no external messaging integration or sensitive-data collection is authorized. |
| FF-015 | **Global academy/course branding policy** | **OWNER-DEFERRED / DECISION PENDING** | The My Courses view uses the owner-approved display name “SJN MedNest Academy” as course branding; a global product/site rename is **not** approved and remains deferred until Courses design is finalized. |

### C. Student insights and reporting

| ID | Feature / decision | Status | Current boundary / what to decide later |
| --- | --- | --- | --- |
| FF-016 | **Overall student Analytics dashboard** | **FUTURE DIRECTION / NOT IMPLEMENTED** | Separate from a single-test Results/Performance Insights or Test History. Define time window, eligible attempts, denominators, retake handling, privacy and efficient aggregation before design. |
| FF-017 | **Question Bank Analytics** | **FUTURE DIRECTION / NOT IMPLEMENTED** | Intended attempted/correct/incorrect/skipped metrics and Subject → Chapter → Topic breakdown for bank practice. Must use authenticated, accurate student-question history; do not use invented totals. |
| FF-018 | **Course/Test Analytics** | **FUTURE DIRECTION / NOT IMPLEMENTED** | Separate subject-wise course performance and possible test-by-test score trends. Exact charts, course comparisons, eligibility and detailed taxonomy policy are undecided. Do not mix regular-bank and premium-course metrics without approved definitions. |
| FF-019 | **Mistake Diary** | **FUTURE DIRECTION / NOT IMPLEMENTED** | A student may eventually classify their own errors manually. Candidate categories: Information-based, Concept-based, Silly Mistake, Retention-based. Final labels, edits, per-question vs per-attempt ownership and premium-question visibility require approval. Never auto-classify or alter saved scores. |
| FF-020 | **Real Report Issue submission and admin review** | **PARTIAL / INTEGRATION OPEN — RELEASE DECISION REQUIRED** | The UI has 11 reason checkboxes, optional details and honest preview wording, but it currently **does not submit, persist or send reports**. Future system needs authenticated storage, validation, rate limits, student privacy, admin workflow and verified confirmation; tracked as TEMP-P4-002. |

### D. Optional appearance and polish

| ID | Feature / decision | Status | Current boundary / what to decide later |
| --- | --- | --- | --- |
| FF-021 | **Dark / Light Appearance setting** | **OPTIONAL / NOT IMPLEMENTED** | Later preference using systematic theme tokens, accessible contrast and unchanged answer/status meanings; never a naïve whole-site inversion. |
| FF-022 | **Promotional course banners** | **OPTIONAL / DISCUSSION ONLY** | Owner approved a banner-free My Courses starting point. Banners are only an option after final design review; do not insert promotions by assumption. |

## 3. Integration, browser UAT and release gates (NOT new features)

The following are real incomplete obligations but **must not** be confused with missing entire features:

1. **Latest owner testing:** November 1 Courses “Your Last Attempt” + mobile refinements and real Genome Tutor/Timed → Submit → Result → Review/Retake → History, selected-mode Retake and manual Save & Exit/Resume. Automated CI passed at the baseline commit, but owner desktop/mobile acceptance is **pending**.
2. **Genome pilot:** Three curated tests / 79 versioned MCQs are in **staging only**; preserve source manifests and provisional academic scope. Do not claim paid enrollment, authorization, broad production readiness or manufacturing of student attempts.
3. **Temporary-code and access cleanup:** Reconcile [Temporary Change Register](SJN-TEMPORARY-CHANGE-REGISTER.md) with the actual source and environments: preview routing/status, historical compatibility bridges, Report Issue mock submit, Courses fixtures and entitlement gaps, auth configuration, and Vercel tester access. Older entries saying drafts/Review are “not implemented” are historical and superseded.
4. **Production release:** Draft PR #1 remains unmerged; main, production Vercel and production Supabase stay separate. All code, database import, auth/RLS, environment, owner device QA and rollback gates require independent approvals. Git merge **does not** copy staging Supabase rows to production.
5. **Academic quality:** The existing provisional Past Paper explanations, tags and doubtful source keys need later academic review before public release. Preserve original supplied keys and immutable revisions unless the owner explicitly approves a correction.

## 4. Not active / do not wrongly re-add

- **Autosave — CANCELLED BY OWNER (2026-10-21).** Not deferred. Do not add per-answer, navigation, background or silent saving. Preserve manual Save & Exit / Resume and the approved refresh Option A.
- **Results Screen action-delay reduction — STAGING FIX OWNER ACCEPTED (2026-10-27).** The earlier Deferred Work file retains its original deferred text for history; it is not an open feature. Wider reliability/release QA remains separate.
- **Create Practice Test Stage 4 and its five filters — OWNER ACCEPTED as development milestone (2026-10-23).** Do not use old 2026-10-17/22 prose to imply filters are still unbuilt. Current five categories are Unused, Incorrect, Skipped, Marked, Correct.
- **Mark for Review / purple state, shared Results/Review/Retake, Test History, manual draft Resume, and selected past-paper examination integration — already implemented in staging.** Preserve them; any unresolved testing or release work belongs in the proper verification documents.
- **Genome course-test integration and real Last Attempt mechanics — STAGING IMPLEMENTED, OWNER UAT PENDING.** Do not list as wholly missing, but retain FF-008, FF-009, FF-013 and appropriate release gates for the unfinished production system.

## 5. Rules for using and maintaining this document

1. **Start of every new chat/developer handover:** Read the newest dated Master Development Plan checkpoint and this register, then verify branch/PR/CI/temporary register as necessary. When asked “What remains?” report **active open IDs** and distinguish owner-deferred from preliminary ideas, current UAT and release blockers.
2. **No implementation by implication:** An entry here is a reminder, **not approval**. First discuss exact scope, dependencies, design (with illustrative UI mockups when relevant), preservation and security impacts; wait for explicit owner permission. Scope each implementation to development/staging unless separately authorized.
3. **When the owner changes a decision:** Update the specific ID/status and date with a brief rationale, approval, implementation/test references and cross-links in the same appropriate documentation checkpoint. Never silently rewrite the historical record or claim manual UAT from CI.
4. **When completed:** Move the item to a small closed/accepted record or mark it CLOSED with exact evidence; remove it from active views. If merely implemented in staging, record **IMPLEMENTED — UAT PENDING**, not fully accepted.
5. **Protect the architecture:** Prioritize speed, maintainability, a single shared exam engine, immutable revisions, authenticated student isolation, mobile function and non-destructive data changes. New temporary runtime behavior also requires a same-commit entry in the Temporary Change Register.
6. **Keep the register lean:** Do not add every bugfix, ephemeral proposal or test-only note as a feature. Preserve the distinction between product backlog, temporary release cleanup, academic content QA and production go-live.

**Creation checkpoint (2026-11-01):** Consolidated from existing owner-approved documents on development HEAD 37d1be9d2. No application code, test, database record, schema, Vercel configuration, production environment or release authorization was changed by creating this file.
