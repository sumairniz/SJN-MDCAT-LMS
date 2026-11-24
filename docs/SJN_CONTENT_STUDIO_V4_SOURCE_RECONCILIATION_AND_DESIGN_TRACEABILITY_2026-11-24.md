# Content Studio V4 — Source Reconciliation & Design Completeness Register

**Date:** 24 November 2026 (Asia/Karachi)  
**Status:** SOURCE RECONCILIATION COMPLETED FOR AVAILABLE RECORDS; CORRECTED VISUAL DESIGN PROPOSED — OWNER REVIEW REQUIRED; NO IMPLEMENTATION AUTHORIZATION IN THIS RECORD.  
**Branch:** `sjn-secure-content-publishing`  
**Scope:** Management Panel / Question Content Studio design only. Student LMS is excluded from implementation.

## 1. Purpose and evidence reviewed

This register was prepared because an earlier assistant proposal was incomplete and could have led to approval of a deficient design. The purpose is to reconcile the canonical requirements against the original source discussion before presenting another design.

Sources directly inspected in this session:

1. `docs/SJN_MEDNEST_MASTER_PRODUCT_ARCHITECTURE_DECISION_RECORD.md` on the active branch, blob SHA `a76e09ff78988ab9ba04a09665ca34fc5fa4c41d`. Relevant sections include 1–2 (authority/status), 4–10 (architecture and screen requirements), 12–13 (continuity/documentation), 15 (two-mode proposal), 16 (reference ZIP limitation), 17–19 (technical audit and implementation history), and 20 (24 November handover).
2. Original project source `Chat(1).txt`, recovered from the Project conversation files. It contains the initial V4 proposal, all nine Claude review concerns, the assistant's technical assessment and the detailed responses to those concerns.
3. `docs/SJN_MedNest_Active_Conversation_and_Decision_Log_2026-11-20.docx`, read in full. Its Section 10 preserves the 20 November visual discussion; Section 11 records the 21 November revised V4 design and approval boundary.
4. `docs/SJN-MEDNEST-MCQ-WORKFLOW-OWNER-DECISIONS-2026-11-09.md`, `docs/SJN-DEVELOPER-HANDOVER-AND-ACCESS.md`, and `docs/SJN-MEDNEST-MANAGEMENT-FOCUSED-WORKSPACE-HANDOVER-2026-11-09.md) were located and their available content inspected. The latter handover confirms the existing focused workspace, editor, protected draft save, optional review, import and current limitations.
5. The 24 November current project checkpoint in Master Record Section 20, including the Management-only scope, Student LMS exclusion and deployment incident checkpoint.
6. Current conversation instruction: the Content/Workflow switch must be placed in the existing Question Content Studio header row beside Auto / Dark / Light, and must appear only inside Question Content Studio. Preserve the existing Management Panel header identity and sidebar. The supplied current-header screenshot is the intended placement reference; do not substitute a generic dashboard header.

**Source limitations:** The three reference ZIP archives are recorded in Master Section 16, but their raw contents were not opened during this reconciliation. Do not claim their screens were freshly inspected. The screenshot referenced in the current conversation is described in the conversation context, but its pixel-level contents are not reproduced in this text register. If exact pixel geometry or styling must be checked, reopen the original screenshot from the current conversation before implementation. This does not prevent documenting the owner's explicit placement requirement.

## 2. Authority and status reconciliation

The sources contain different dates and approval statements. Apply the Master Record's evidence hierarchy and the owner's latest instruction.

| Item | Reconciled status | Explanation |
|---|---|---|
| One central Question Content Studio and shared MCQ editor/import engine | FINALIZED / OWNER-DECIDED | Repeated in 20 Nov log, 21 Nov Master Sections 4–6 and original Chat(1).txt. |
| Three content destination families | FINALIZED / OWNER-DECIDED | Question Banks; Courses & Sessions → course/session → test; Full-Length Past Papers → configured region/category → paper identity → year. |
| Original flat eight-item Studio navigation | FINALIZED historically, then refined | The two-mode Content/Workflow proposal in Master Section 15 reorganizes the presentation without discarding the capabilities. |
| Content / Workflow two-mode structure | PROPOSED in Master Section 15; current header placement explicitly instructed | The latest instruction settles where the switch belongs: only in the Question Content Studio header row beside Auto / Dark / Light. The complete two-mode information architecture still requires owner review of the corrected full design; do not silently mark every proposed detail owner-finalized. |
| SJN red dominant visual direction; light/dark themes; balanced density | FINALIZED / OWNER-DECIDED direction | Master Section 5 and Active Log Section 11. Exact token tuning remains subject to visual review. |
| Nine external review concerns | OWNER-ACCEPTED AS REQUIREMENTS TO ADDRESS, WITH TECHNICAL REFINEMENTS | This does not mean accepting every literal proposed mechanism without architecture checks. See Section 4 below. |
| Complete revised visual design | PENDING OWNER REVIEW | The 21 Nov log explicitly says detailed design awaits owner final design approval. Latest owner instruction further requires full corrected visual plan before any design/code changes. |
| Implementation | NOT AUTHORIZED BY THIS DESIGN REVIEW | Earlier Master Section 2.3 records a 21 Nov implementation authorization for a defined redesign scope. The current owner instruction now establishes a fresh mandatory pre-implementation gate: show the complete corrected design and obtain owner review/approval first. No code changes are made by this document. Production merge/release remains separately gated. |
| Student LMS modifications | OUT OF SCOPE | Master Section 20.2 and current explicit project boundary prohibit Student LMS changes. |

## 3. Reconciled information architecture

### 3.1 Outer Management Panel — unchanged

Preserve the existing Management Panel shell, branding, account/profile controls and main sidebar. Existing top-level modules remain as recorded in Master Section 4. The Studio redesign must not move Studio-only pages into the global sidebar.

### 3.2 Studio-only mode switch — latest owner placement instruction

- The Content / Workflow switch is visible only while the user is inside Question Content Studio.
- It sits in the existing Studio page header row, beside the existing Auto / Dark / Light theme controls, using the same header structure and alignment shown in the owner's current Management Panel screenshot.
- Do not put the switch in the global Management Panel header on Syllabus & Taxonomy, Reports, Settings, Courses & Sessions, Full-Length Past Papers or other modules.
- Preserve the existing SJN identity, breadcrumb/title region, theme controls and profile area. The switch is an addition to the Studio header, not a replacement header.
- The selected mode controls the Studio's internal navigation and workspace. It does not change the global sidebar or route the user outside the Studio.

### 3.3 Content mode — destination-first authoring

Persistent destination tree:

- **Question Banks**
  - SJN Question Bank
  - Past Paper Question Bank
- **Courses & Sessions**
  - Course/session
  - Test
- **Full-Length Past Papers**
  - Configured region/category
  - Examination/paper identity
  - Year

After selecting a destination, the contextual content workspace provides:

- **Browse & Edit** — the existing Live Library function; do not create a second library.
- **Create** — the existing Create Questions function, using the common MCQ editor.
- **Bulk Upload** — the existing shared CSV/XLSX import engine.
- **My Drafts** — cross-destination draft workspace, filterable by destination. Opening a draft restores its true destination; merely selecting another destination must never move or reassign it.

Persistent context/breadcrumb example:  
`Question Content Studio › Courses & Sessions › Genome › Test 01`

Create and Bulk Upload must visibly display **“This will go into: [destination]”**. Opened from a destination, it is preselected and remains visible. Opened directly, require explicit destination selection before content/file processing. Changing destination is deliberate and confirmed. Enforce authorization server-side.

### 3.4 Workflow mode — cross-destination work stages

- **My Work Board:** overview of actual supported statuses across destinations. It links to the owning workspace; it is not a second draft manager or new task/workflow engine.
- **Academic Review:** optional review requests and reviewer actions. It is not compulsory for every question. Keep author/reviewer separation and existing permission/audit rules. Approval is not publication.
- **Release Centre:** distinct final release-preparation, validation, permission and confirmation workspace. It must not be merged into Academic Review.

The Work Board may show status summaries, but My Drafts remains the detailed draft home. Academic Review and Release Centre each have exactly one Studio home and are not duplicated in the global sidebar.

### 3.5 Studio landing state

The earlier Studio Home proposal contains destination cards plus a compact Work Board summary and expressly excludes duplicate Quick Actions. Master Section 15 left open whether the Studio Overview should remain a landing screen or Content mode should open directly. Keep a lightweight destination landing state in the visual proposal, but mark its exact default/entry behavior as PENDING OWNER REVIEW rather than pretending this was settled.

## 4. Nine external review concerns — reconciled outcomes

### 4.1 Shared questions and safe reuse

**Accepted requirement:** Show “Used in: …” and all affected banks/papers/courses/tests before editing a shared question.

Offer:
- **Fix everywhere:** edit the shared source only after listing every affected destination and obtaining explicit confirmation. Published-version and release rules still apply.
- **Make a separate copy:** create an independent identity for the selected destination while preserving the original.

**Technical gate:** Do not implement copy/reference semantics until database relationships, question identity, provenance, history and version behavior are inspected. Do not assume either operation is currently supported.

### 4.2 Editing an already-published question

**Accepted requirement:** Editing must not change the version students currently see. The editor must distinguish:
- Published version — currently student-visible.
- Your edited copy — unpublished working changes.
- What changed? — comparison covering statement, options, answer, explanation, mnemonic, images/formulas and relevant metadata.

Saving an edit is not publishing. Student-facing replacement occurs only through the separate authorized release process. Technical versioning support remains subject to audit; do not invent a new version engine before inspection.

### 4.3 Release Centre

**Accepted requirement:** A dedicated Release Centre inside Workflow mode.

It must show destination, content scope/count, version, review/approval eligibility, warnings, permission state and student-facing preview. Validate destination, question content, answer keys, formatting, media/formulas, unresolved warnings and release permission. Require explicit confirmation and server-side authorization.

Keep states distinct: Draft; In Progress; Changes Requested; Approved (not published); Release Prepared; Released. Approval never auto-publishes.

### 4.4 Bulk Upload

**Accepted requirements:** destination visible before file selection and throughout; row-level validation/errors/warnings/retry outcomes; correct invalid rows in place and revalidate without full reupload where compatible.

Preserve existing XLSX/CSV templates, validation, batch cap, chunking, idempotency and version checks. Existing technical audit found a draft-only CSV/XLSX validator/import path and existing editor-based row correction; do not rebuild those foundations.

**Batch reversal refinement:** “Revert Import Batch” is a safeguarded concept, not permission to blind-delete. Identify exact batch and affected records, preview impact, check subsequent edits/reuse/release, block unsafe reversal, require permission/confirmation and audit. Verify backend capabilities before designing the destructive operation.

### 4.5 Non-happy-path states

The design must include explicit examples and consistent behavior for:
- Empty library / empty destination.
- No search results.
- Failed upload with error detail and safe retry/correction path; never silently replace existing records.
- Unsaved-change warning only when changes are genuinely not acknowledged as saved. Management Content Studio autosave is expected; do not show false warnings after successful persistence.
- Missing permission: explain the required permission and disable the unavailable action, while server-side authorization remains authoritative.
- Loading, validation warnings, network/save failure, partial success and retry states.

### 4.6 Images, diagrams, formulas and chemical notation

**Accepted as an end-to-end product requirement, not an existing verified feature.** The Student LMS does not currently have complete image-based MCQ capability.

The design must show authoring controls for image/diagram attach, preview, replace, remove, alt text, formula/equation entry, subscript/superscript, bullets/numbering and relevant statement/arrow formatting. It must plan for secure storage/access, file validation/limits, performance, accessibility, import compatibility and rendering in student question, review and history contexts.

Required academic examples: Biology labelled diagrams/structures; Chemistry structures/reaction diagrams; Physics circuits/graphs. Student LMS implementation is outside current Management-only execution scope; this record preserves the end-to-end requirement but does not authorize Student LMS changes.

### 4.7 Overlapping navigation and single-home rules

The original eight Studio destinations and the two-mode proposal are reconciled as follows:
- My Drafts: detailed cross-destination draft home.
- Live Library / Browse & Edit: one existing-library home.
- Work Board: overview only.
- Academic Review: one optional review home in Workflow.
- Release Centre: one release home in Workflow.
- Create and Bulk Upload: destination-contextual actions in Content mode, not free-floating destinations detached from ownership.
- Studio Overview: lightweight landing/destination selector with compact Work Board summary; no duplicate Quick Actions. Default entry remains pending owner review.

### 4.8 Destination-aware Create and Bulk Upload

Covered in Sections 3.3 and 4.4. Destination must be inherited when launched from a destination, explicit when launched directly, visible throughout and enforced server-side. Destination switching requires deliberate confirmation. Drafts retain their original ownership.

### 4.9 Complete editor, formatting, comparison and student preview

The complete editor visual design must account for:
- Destination/breadcrumb context and question ownership.
- Bank/course/test/paper classification, subject, chapter and topic.
- Formatting toolbar (emphasis, bullets/numbering, statement/arrow formatting, subscript/superscript, image, formula/equation).
- Question statement.
- Options A–D; fifth option only under current draft compatibility restrictions.
- Correct answer.
- Explanation and mnemonic.
- Source/past-paper metadata.
- Published Version / Your Edited Copy / What Changed comparison.
- Student-facing preview that identifies which version is displayed and aims to match actual student rendering.
- Undo, Redo, autosave acknowledgement, Save Draft, Save Question and Save & Next, preserving existing semantics and validation.

### 4.10 Save behavior clarification

Master Section 16 records the conceptual distinction and warns that current implementation behavior must be verified. The current technical audit and code should be checked before finalizing button microcopy:
- Save Draft: persist work as an unpublished draft.
- Save Question: persist the current question in the selected destination using the existing supported lifecycle; label alone must not imply student publication.
- Save & Next: save/acknowledge current item, then navigate to the next existing item or next sequence according to existing behavior.
- Autosave in Management Content Studio is expected with Undo/Redo and clear acknowledgement. The no-autosave requirement belongs to Student LMS test-taking, not the Management editor. Do not remove Management autosave.
These are product/UX meanings; exact current backend effects must be confirmed from source before any code change.

## 5. Existing implementation evidence — reuse, do not rebuild

The 24 November Master Record Sections 17–19 and relevant handover notes establish:
- Existing Management Content Studio files and protected Management Auth draft transport are present.
- CSV/XLSX templates, parsing/validation, row-level feedback and draft import foundations exist.
- Existing editor and question correction pathways exist; imported rows can be opened in the editor for correction.
- Management editor has autosave, Undo/Redo and save acknowledgement work recorded in the current branch history; preserve it and test it.
- Academic Review is a separate existing workflow with an existing One Reviewer correction default that conflicts with the owner's optional-review requirement; do not silently alter the policy. It needs a technical/product reconciliation before changing behavior.
- Release/publication path is not proven to be a complete end-to-end student publication engine. Approval, release preparation and actual student publication must remain separate.
- Image/formula authoring and student rendering are not a complete verified capability.
- MCQ Library Chapter/Topic facets and cross-field search were implemented on 24 Nov; owner verified filters. Preserve this work and do not regress it.
- The current 24 Nov deployment incident and correct Management preview checkpoint are documented in Master Section 20. Resolve that before any preview-based visual QA. Do not touch the Student LMS project.

No code, database, Edge Function, Vercel, deployment, merge or production change was made as part of this reconciliation.

## 6. Corrected visual plan — what the next owner-facing design must show

The next design presentation must not be a generic dashboard or a text-only list of features. It must be a complete, inspectable SJN-specific interface specification with realistic layouts and controls. It must include:

1. Existing Management Panel shell with the Content/Workflow switch only in the Question Content Studio header beside Auto / Dark / Light, preserving the screenshot's header placement and global sidebar.
2. Content mode with destination tree, contextual breadcrumb, selected destination and tabs for Browse & Edit, Create, Bulk Upload and My Drafts.
3. Workflow mode with My Work Board, Academic Review and Release Centre.
4. Studio landing state and the compact Work Board summary, with no duplicate Quick Actions.
5. Question Banks selection; course → test hierarchy; region/category → paper → year hierarchy.
6. My Drafts and Live Library screens, including empty and no-results states.
7. Full MCQ editor showing every field/control and all comparison/preview regions.
8. Shared-question “Used in” warning and explicit Fix everywhere / Make a separate copy choice.
9. Published version vs edited copy and a What changed comparison.
10. Bulk Upload before file selection, validation table, in-place row correction, failed-upload state and safe batch-reversal concept.
11. Work Board statuses based only on actual records; Academic Review optional; Release Centre with permission-disabled and explicit confirmation states.
12. Light and dark themes using SJN red as dominant accent, balanced density, accessible states and restrained motion.
13. Desktop, tablet and mobile adaptations.
14. Clear illustrative labels for any sample data/counts.

For each screen, specify purpose, navigation, layout regions, visible labels/data, controls and actions, all important states, responsive behavior, data/permission behavior, integrations, non-regression constraints, technical unknowns and status. The owner must be able to inspect the design without reading a long chat or acting as technical auditor.

## 7. Design traceability gate

No final design approval request should be issued until each row below is either visibly represented or explicitly marked as a known technical dependency/pending choice.

| Requirement | Source | Must appear in corrected design | Status |
|---|---|---|---|
| Central Studio, shared editor/import | Master 4.1; Chat(1); 20 Nov log | One Studio, no duplicate engines | Reconciled |
| Three destinations and hierarchies | Master 4.1; Chat(1) §§3–5 | Destination tree and breadcrumb | Reconciled |
| Studio internal navigation ownership | Master 4.2; 15; Active Log 11 | Content/Workflow grouping, single homes | Reconciled; detailed presentation pending |
| Header switch placement | Latest owner instruction/current screenshot | Studio header beside Auto/Dark/Light only | Explicit placement instruction; visual QA pending |
| SJN red brand, light/dark, balanced density | Master 5; Active Log 11.1 | Full theme samples | Reconciled |
| Studio landing/no Quick Actions | Chat(1) §2; Master 6.1; 15 | Destination cards + compact board | Reconciled; default entry pending |
| Drafts/Library/Work Board single homes | Master 4.2, 6.5–6.6, 6.11; Claude concern 7 | Separate detailed draft/library/status views | Reconciled |
| Shared questions | Chat(1), Claude concern 1; Master 6.8 | Usage impact + two explicit choices | Reconciled; data model pending |
| Published/edited copy | Chat(1), concern 2; Master 6.9 | Version comparison and student preview | Reconciled; version mechanics pending |
| Release Centre | Chat(1), concern 3; Master 6.9/6.13 | Separate release candidate screen | Reconciled; live release engine pending |
| Bulk upload destination + row repair + reversal | Chat(1), concern 4; Master 6.10 | Destination banner, row states, safe reversal | Reconciled; reversal feasibility pending |
| Failure/empty/unsaved/permission states | Chat(1), concern 5; Master 6.6/8 | Explicit screen/state samples | Reconciled |
| Images/formulas end-to-end | Chat(1), concern 6; Master 9 | Authoring + preview + integration plan | Requirement reconciled; technical feasibility pending |
| Toolbar/change comparison/student preview | Chat(1), concern 9; Master 6.7 | Full editor screen | Reconciled |
| Optional academic review | Chat(1), Master 6.12; Active Log 10.6 | Optional path; not mandatory | Reconciled; policy discrepancy pending |
| Preserve existing functionality | Master 8; 17–19 | Non-regression callouts | Reconciled |
| Mobile/tablet behavior | Master 4.2, 6.7; Chat(1) | Responsive variants | Reconciled |
| Save semantics/autosave | Master 16, 18; current code audit | Accurate save/undo/autosave states | Partially reconciled; verify code semantics before implementation |
| Main sidebar remains unchanged | Master 4; 15; latest owner instruction | Studio-only switch and Studio nav | Reconciled |

## 8. Genuine open items — do not turn them into repeated questions

1. **Studio default entry:** Should opening Question Content Studio land on a lightweight Overview or directly open Content mode? Existing records permit a lightweight overview but leave default behavior pending.
2. **Two-mode visual details:** Exact labels, placement, selected state and responsive switch behavior beyond the explicit header placement should be presented for owner review, not assumed finalized.
3. **Reference ZIPs:** Their raw content remains uninspected in this session. Inspect if available before using them as visual input; they are inspiration only, not templates.
4. **Header screenshot:** Reopen the exact current Management Panel screenshot for pixel-level comparison before implementation. The required location is already explicit.
5. **Technical release/versioning:** Inspect current branch and backend before claiming versioned student publication or implementing schema changes.
6. **Shared question copy semantics:** Requires actual reference/ownership model inspection.
7. **Academic Review discrepancy:** Optional review requirement vs existing One Reviewer correction default must be reconciled before policy changes.
8. **Media/formula capability:** Full end-to-end feasibility, storage, rendering, import and performance remain pending technical verification.
9. **Import reversal:** Verify dependency checks and safe compensating behavior; no blind delete.
10. **Save Question semantics:** Confirm exact existing lifecycle and do not equate it with publication.

## 9. Explicit non-goals and safety boundary

- This is a Management Panel design and documentation task only.
- Do not modify Student LMS frontend, backend, database/schema, Edge Functions, authentication, attempts, submissions, Test History, Results, Review, Retake, Analytics, Mistake Diary or student behavior.
- Do not modify Management Auth schema, RLS, permissions, storage, release functions or security settings merely to make a mockup appear functional.
- Do not change Vercel settings, deployment targets, DNS, merge PRs or release production as part of design review.
- Do not replace existing import/editor logic with mock-only controls.
- Do not present sample data as live data.
- Do not call the design owner-approved until the owner explicitly approves the complete corrected design.

## 10. Next Chat / next action

Prepare and present the complete corrected SJN-specific visual design directly in the conversation for owner review. It must follow Section 6 and pass the traceability matrix in Section 7. Include the existing Management Panel shell and the Studio-only Content/Workflow switch in the exact header row beside Auto / Dark / Light. Do not implement or change code while the owner is reviewing the design. After the owner approves the complete design, record that approval distinctly; implementation still follows the explicit scope/approval gates in the Master Record.
