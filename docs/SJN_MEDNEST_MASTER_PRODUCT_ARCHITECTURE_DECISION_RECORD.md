# SJN MedNest Academy — Master Product, Architecture & Decision Record

**Document type:** Permanent project source of truth  
**Project:** SJN MedNest Academy  
**Repository:** `sumairniz/SJN-MDCAT-LMS`  
**Last updated:** 21 November 2026  
**Status:** Living document — update this record whenever an owner decision, implementation, verification, reversal, or material technical discovery occurs.

> **Continuity rule:** A new chat must read this document and the linked project records before asking the owner to repeat a decision or before changing code. Do not treat a chat summary as the source of truth. Do not reopen an already settled question unless new evidence creates a genuine conflict.

---

## 1. Why this record exists

The owner works across multiple ChatGPT conversations (Chat 10, Chat 11, Chat 12, and future sessions). Conversation boundaries must never reset project knowledge. The owner should not have to copy entire previous chats into each new conversation.

This document preserves:
- Owner-approved product requirements and design decisions, with their reasoning.
- Architecture boundaries and data ownership rules.
- What is implemented, what has been tested, and exactly how it was verified.
- Pending technical investigations and their outcomes.
- Deferred, rejected, and reversed decisions.
- Explicit approvals and the scope of those approvals.
- Next actions and handover instructions.

This is a living record, not a brief formula sheet. Update it in detail, including context and rationale, rather than recording only a one-line conclusion.

### 1.1 Relationship to existing project documentation

This master record is an **additional canonical index and consolidated decision source**. It does not mean that the previous handover documents, technical documentation, owner guide, deferred-feature register, active conversation log or source chat transcripts were unnecessary or should be discarded.

The existing documents have different purposes and remain valuable:
- **AI Developer Handover:** implementation instructions and safety contract for AI development.
- **Human Developer Technical Handover:** detailed technical architecture and delivery context for a human developer.
- **Owner Guide:** operational and learning guide for the Academy owner.
- **Master Product, Architecture & Decision Record (this file):** cross-chat continuity, product decisions, exact reasoning, status distinctions, approvals, implementation records, test evidence and change history.
- **Active Conversation & Decision Log:** detailed temporary record of current-session discussion, open issues and immediate next steps. Its important outcomes must be transferred into this master record.
- **Original chats, transcripts, recordings and screenshots:** primary evidence for the actual discussion and context. Preserve/link them where possible; do not assume this master record replaces their full detail.

When existing documents overlap, do not create competing truth. Record which document owns which subject and update the relevant document when its subject changes.

## 2. Authority, chronology and decision status

### 2.1 Evidence hierarchy

When information conflicts, use this order:
1. The owner's latest explicit instruction in the current conversation.
2. The latest owner-confirmed decision recorded in this master record.
3. Detailed source conversation/transcript and owner-provided recordings/screenshots.
4. Current verified repository, database, and deployment state.
5. Older handovers and temporary chat summaries.
6. Assistant/AI suggestions, which are not decisions unless the owner explicitly approves them.

A technical discovery can establish what the system currently does, but it cannot silently change an owner requirement. Record the discovery and propose a safe reconciliation.

### 2.2 Mandatory status labels — keep discussion, proposal, decision, approval, implementation and verification separate

Every material item must have an explicit status. Do not collapse these stages:

1. **DISCUSSED** — the topic, idea, concern or possible approach came up in conversation. This does not mean a proposal was accepted or a decision was made.
2. **PROPOSED** — a specific recommendation or possible solution was put forward. It is not a decision and must not be implemented as though approved.
3. **FINALIZED / OWNER-DECIDED** — the owner explicitly settled the product requirement, design choice or intended behavior. Record the exact decision and the reasoning/context. This means the product decision is settled, **not** that implementation is automatically authorized.
4. **IMPLEMENTATION APPROVED** — the owner separately gave explicit permission to implement a defined scope. Record what was approved, what was excluded, the environment/branch boundaries and date. If scope changes materially, ask again.
5. **IMPLEMENTED** — code/configuration or other changes were actually made. Record exact files, functions, components, database objects, migrations, commit and environment.
6. **VERIFIED** — tests or owner checks actually confirmed behavior. Record test method, environment, result and any limitations. A successful deployment alone does not prove feature correctness.
7. **PENDING TECHNICAL VERIFICATION** — a requirement or decision exists, but the present architecture/capability or safe implementation route has not yet been verified. This status does not permit quietly dropping the requirement or asking the owner to repeat a discussion that may already be documented.
8. **PENDING OWNER DECISION** — a real product choice remains open and cannot be safely inferred from the existing decisions.
9. **DEFERRED** — deliberately postponed; preserve reason and any condition for revisiting.
10. **REJECTED / REVERSED** — a proposal or implementation was explicitly rejected or undone; preserve why and the replacement if any.
11. **SUPERSEDED** — replaced by a later owner decision; retain the old decision and link the new one.

Use combinations where useful, for example: **FINALIZED / OWNER-DECIDED — IMPLEMENTATION NOT YET APPROVED**, or **IMPLEMENTED — VERIFICATION PENDING**.

**Critical rule:** A finalized decision is not blanket approval to code. The owner may later change their mind, refine a requirement, or want a different approach. Before implementing a finalized item, check whether explicit implementation approval exists for that exact scope. If it does not, request approval from the owner. Do not assume that a previous design approval, old instruction, or assistant recommendation authorizes all future implementation.

### 2.3 Approval scope and owner control

Product decision, detailed design sign-off, implementation approval, preview deployment, database migration, merge, and production release are separate approval gates unless the owner explicitly combines them.

- The owner is the final authority for product decisions and implementation approval.
- The assistant/developer must not mark a proposal as finalized without the owner's explicit agreement.
- The assistant/developer must not mark implementation as approved merely because the owner said a design is finalized.
- Before making code or infrastructure changes, identify the exact scope and check the approval record. If absent or ambiguous, ask the owner.
- A previously finalized decision remains the recorded decision until the owner changes it. Do not repeatedly ask the owner to reconfirm it without a genuine new conflict or material change in circumstances.
- If the owner changes a decision, append the new decision and mark the earlier one **SUPERSEDED**. Never erase the earlier reasoning or history.
- Production merge/release must have its own explicit approval unless specifically included in a later owner instruction.

**Current Content Studio scope:** In this project conversation on 21 November 2026, the owner explicitly instructed that the complete Question Content Studio redesign be implemented. Record that as implementation approval for that defined scope, subject to staging-first delivery and the existing exclusions. This is a specific historical authorization, not a general rule that future finalized decisions can be implemented without fresh approval. Production release/merge remains separate.

## 3. Project identity and technical foundation

- Product: **SJN MedNest Academy**.
- Domain: `sjnmednest.com`.
- Repository: `sumairniz/SJN-MDCAT-LMS`.
- Hosting: Vercel.
- Database/backend: Supabase.
- GitHub is the permanent engineering record and version history.
- ChatGPT Library stores readable handover snapshots and continuity exports, but should not be the only canonical record because copies can become stale.
- The project has distinct Student LMS, Management Panel, and Management Auth responsibilities. Do not collapse these into one assumed application/database.

### 3.1 Supabase project identities previously recorded

| Purpose | Project ref | Notes |
|---|---|---|
| SJN MedNest Management Auth | `tdqbjhrmfluiinntmjfh` | Separate Management Auth project |
| SJN MDCAT LMS Staging | `aozknkrwafowsrehdwlr` | Student LMS staging project |
| Old original production (`sjn-mdcat-lms`) | `yapvnevvjfewvafbjcgc` | Historical project; was inactive in 17 Nov checkpoint |

These are historical identifiers, not a claim about current health. Always inspect live provider state before operating. Do not create a third database or new paid resources without explicit need, cost disclosure and approval.

### 3.2 Repository working context previously recorded

- Working branch: `sjn-secure-content-publishing`.
- Preview alias previously used: `https://sjn-mednest-management-git-sjn-secure-content-publishing-sjn1.vercel.app`.
- PR #3 was previously kept Draft/unmerged.
- A prior preview deployment was READY at commit `78e88ac9766f08ea0403f8dc8ed3ae4beb5b10a1`.

These values are checkpoints only. Recheck branch, PR, commit and deployment before continuing.

## 4. Product architecture — Management Panel

The Management Panel includes these main modules (preserve existing working modules and permissions):
1. Overview
2. Question Content Studio
3. Syllabus & Taxonomy
4. Courses & Sessions
5. Full-Length Past Papers
6. Academy Resources
7. Staff & Permissions
8. Reports & Analytics
9. Audit & Activity
10. Academy Settings

**Navigation ownership:** The main sidebar owns the top-level modules. Pages internal to Question Content Studio must not be duplicated as top-level sidebar entries.

### 4.1 Central Question Content Studio — FINALIZED / OWNER-DECIDED

There is **one central Question Content Studio**, not three independent MCQ editors or import engines. It has its own internal navigation and contextual workspace.

Three content destinations:
- **Question Banks:** SJN Question Bank and Past Paper Question Bank.
- **Courses & Sessions:** select a course/session (e.g. Genome), then a test, and manage the MCQs associated with that test.
- **Full-Length Past Papers:** select region/category as configured, examination/paper identity and year, then manage questions associated with that paper.

Courses & Sessions and Full-Length Past Papers remain separate top-level Management Panel modules for course/test and paper metadata, structure, configuration and availability. MCQ authoring/editing is centralized in Content Studio.

Use existing question records and destination associations where appropriate. In particular, a full-length paper should reuse/link a Past Paper Question Bank question when appropriate rather than silently create unnecessary duplicate MCQ records. Preserve provenance, source identity, ownership and associations.

### 4.2 Studio internal navigation — FINALIZED / OWNER-DECIDED

- Studio Overview
- My Drafts
- Live Library
- Create Questions
- Bulk Upload
- My Work Board
- Academic Review
- Release Centre

Single-home rules:
- **My Drafts:** the detailed home for saved/unfinished question drafts.
- **Live Library:** the home for browsing existing library questions.
- **My Work Board:** status overview only; may show counts/links, not a second draft-management interface or new workflow engine.
- **Academic Review:** one optional review workspace inside Studio; do not duplicate it in the main sidebar.
- **Release Centre:** one release-preparation/confirmation workspace inside Studio; separate from Academic Review.
- Studio Home has destination cards and a compact Work Board summary. Do not add duplicate Quick Actions that merely repeat navigation.

Desktop: persistent main navigation plus Studio navigation. Tablet: adaptive navigation. Mobile: main slide-out drawer and compact Studio selector; do not force two permanent sidebars.

## 5. Visual design system — FINALIZED DIRECTION

- SJN red identity is the dominant brand accent; the earlier blue-dominant sample is superseded.
- Palette direction recorded in V4: SJN red `#D9485F`, deep red `#A92F46`, soft red `#FCECEF`, charcoal `#202631`, white and restrained neutral surfaces. Exact token tuning remains subject to visual review.
- Support both light and dark themes with the same component structure.
- Balanced information density: professional, readable, efficient for frequent academic content work.
- Consistent normal, hover, selected, focus and disabled states; clear icons and active indicators; subtle transitions/card lift; respect reduced-motion preferences.
- Avoid heavy animation, unnecessary delays and decorative UI that slows MCQ authoring.
- Owner prefers inspectable structured interface mockups and working preview screens over AI-generated pictures as design evidence. Illustrative records/counts must be labelled illustrative until data-bound.

## 6. Content Studio screen requirements

### 6.1 Studio Overview
- Welcome/description and clear destination cards.
- Cards for Question Banks, Courses & Sessions, Full-Length Past Papers.
- Compact My Work Board counts/summary sourced from actual supported records.
- No duplicated Quick Actions section.

### 6.2 Question Banks
- Clearly distinguish SJN Question Bank and Past Paper Question Bank.
- Open existing content records and use the common editor.

### 6.3 Courses & Sessions
- Select course, then test, then manage questions.
- Course/test metadata and configuration remain in Courses & Sessions module.
- Question authoring/editing uses shared Studio engine.

### 6.4 Full-Length Past Papers
- Select configured region/category, examination/paper identity and year.
- Manage associated questions through the common editor/import engine.
- Reuse/link existing Past Paper Question Bank records where appropriate.

### 6.5 My Drafts
- Dedicated detailed draft list/table with search and useful filters (e.g. recently updated, subject, bank).
- Actual records/status/timestamps only; no fabricated metrics.
- Drafts should not be duplicated as a second management surface in Work Board.

### 6.6 Live Library
- Browse existing library questions with search and subject/chapter/topic/bank filters.
- Desktop can use a question list with contextual preview; tablet collapsible preview; mobile list then detail.
- Empty, loading, no-results, error and permission states must be designed.
- Restricted course/test content must not leak into ordinary bank library results; enforce source ownership/permissions in the backend, not only UI filters.

### 6.7 Advanced Create/Edit MCQ
Preserve existing editor behavior and fields, redesign presentation:
- Destination context and clear destination ownership.
- Question classification: bank/course/test/paper as applicable; subject, chapter, topic.
- Formatting toolbar and question statement.
- Options A–D, correct answer, explanation, mnemonic, source/past-paper metadata.
- Optional fifth option remains subject to existing compatibility restrictions; never publish incompatible five-option content into the current four-option Student LMS schema.
- Image/diagram and formula/equation controls as end-to-end requirement (see Section 9).
- Published version, Your edited copy, What changed? comparison and student-facing preview.
- Undo/redo, Save Draft, Save Question, Save & Next and existing validation/save acknowledgements must be retained.
- Desktop: efficient editing surface with side preview and accessible comparison panel. Mobile: single column with tabs/collapsible sections.
- Preview identifies whether it displays the published version or edited copy and should match student rendering as closely as possible.

### 6.8 Shared-question safety
If one question is used in multiple destinations, show **“Used in: …”** and identify every affected destination before editing.
Offer deliberate choices:
- **Fix everywhere:** edit the shared source and clearly list all affected destinations; never the default silent behavior. Confirm before applying.
- **Make a separate copy:** create an independent question for the selected destination; original remains unchanged.
Preserve original identity, provenance, history and associations. Do not implement duplicate/copy semantics until actual database reference model and version behavior have been inspected.

### 6.9 Published question editing and release
- Editing student-visible content must not mutate the currently released student version.
- Clearly show **Published version** (what students currently see) and **Your edited copy** (unreleased work).
- Saving an edit is not publishing it.
- Provide **What changed?** comparison for statement, options, correct answer, explanation, mnemonic, images/formulas and relevant metadata.
- Academic review is optional, not compulsory for every MCQ. If requested, preserve author/reviewer separation, reviewer permissions, validation and audit.
- Approval does not publish.
- Release Centre acts on eligible approved/release-prepared content only. Show destination, scope/count, version, review eligibility, warnings and student preview. Validate destination, content, answer keys, formatting, images/formulas, unresolved warnings and release permission. Require explicit confirmation and server-side release authorization.
- Statuses must remain distinct: Draft; In Progress; Changes Requested; Approved (not published); Release Prepared; Released.
- Do not assume the existing database already implements safe versioning or release mechanics; inspect current implementation and prior decisions before proposing schema changes.

### 6.10 Bulk Upload
- Shared import engine across destinations.
- Before file selection and throughout the process show **“This will go into: [destination]”**.
- If opened from a destination, preselect it and keep it visible. If opened directly, require an explicit destination. Changing destination must be deliberate and confirmed.
- Preserve supported XLSX/CSV templates, batch cap, chunking, idempotency, version checks and existing validation.
- Row-level validation/errors/warnings/retry outcomes.
- Where compatible with current batch architecture, open and correct invalid rows in place and revalidate without re-uploading the entire spreadsheet.
- Provide a safeguarded **Revert Import Batch** concept only after checking actual capabilities and dependencies: identify exact batch, preview affected records, check later edits/reuse/release, block unsafe reversal, require permission/confirmation and audit. Never blind-delete.
- Failed upload must explain the failure and safe retry/correction route without silently replacing existing records.

### 6.11 My Work Board
- Status overview only, based on actual existing supported states.
- May link to My Drafts, Academic Review or Release Centre.
- Must not create a second workflow engine, duplicate detailed draft list or invented status counts.

### 6.12 Academic Review
- Optional independent review only when requested.
- Not every question requires a reviewer.
- Keep author and reviewer roles separate; actions depend on real permissions and existing policy.
- Review approval is distinct from publication.
- There was a previously recorded discrepancy: individual correction review policy defaulted to One Reviewer. Inspect current policy and the detailed later owner discussion before altering anything. Do not change review policy by assumption.

### 6.13 Release Centre
- Dedicated Studio destination for final student release preparation and confirmation.
- Approval must not automatically publish.
- Show release candidate, destination, content scope, version, validation/review eligibility, warnings, permission state and student-facing preview.
- Server-side authorization is mandatory; disabled UI alone is not security.
- Production release remains separate from staging implementation and requires its own owner approval.

## 7. Destination, ownership, analytics and provenance rules

- The selected destination determines where content is created/imported. Keep context visible at all times.
- Server-side authorization must enforce destination and permissions.
- Keep Question Banks, My Courses and Full-Length Past Papers distinct in analytics and student attempt provenance.
- SJN Question Bank and Past Paper Question Bank remain separate sources.
- Course MCQs must not leak into general-bank library/analytics; past-paper questions must remain attributable to their source/paper.
- Preserve origin, question identity, destination associations and audit history through authoring, reuse, attempts, analytics, review and Mistake Diary.

## 8. Existing functionality and non-regression contract

Preserve:
- Existing MCQ creation/editing and Browse & Edit.
- My Drafts and save acknowledgements/autosave behavior.
- Save Question, Save Draft, Save & Next, undo/redo and validation.
- Taxonomy matching.
- XLSX/CSV imports, batch processing, idempotency/version checks.
- Audit trail, authentication, staff roles and permissions.
- Four-option Student LMS compatibility.
- Student LMS Test History, attempts, submission, Results, Review, Retake, Analytics and Mistake Diary.

Do not casually refactor unrelated Student LMS functionality. Do not reintroduce autosave lag or false unsaved-change warnings. A warning is appropriate only when changes genuinely remain unacknowledged as saved.

## 9. Images, diagrams, formulas and chemical notation — FINALIZED REQUIREMENT; TECHNICAL DETAILS TO VERIFY

The owner clarified that the Student LMS does **not currently have a complete image-based MCQ capability**. This is a planned new end-to-end capability, not a verified existing feature.

Required scope:
1. Management Panel authoring: attach/upload, preview, replace, remove and associate image/diagram with question.
2. Secure storage and access, appropriate file formats, size limits, validation and audit.
3. Student question view: render the attached media correctly.
4. Relevant student review/history contexts: preserve and display media consistently where the question is shown.
5. Formula/equation and chemical notation authoring/rendering consistent across editor, preview and student-facing surfaces.
6. Toolbar needs text emphasis, bullets/numbering, statement/arrow formatting, subscript/superscript, image insertion and formula/equation entry.
7. Accessibility: useful alt text and keyboard-accessible controls.
8. Performance: optimize media and avoid slowing ordinary text-only questions.
9. Import compatibility: define whether XLSX/CSV can reference images/formulas and provide clear validation if unsupported.
10. Test Biology diagrams/labelled structures, Chemistry structures/reaction diagrams and Physics circuits/graphs.

The requirement is accepted; technical implementation details must be recovered from prior discussions and verified against the actual code/schema. Technical verification is not permission to discard or silently narrow the requirement.

**Continuity instruction for the next chat:** Do not reflexively ask the owner whether image rendering and published-version handling were ever discussed. First inspect the uploaded full conversation `Chat(1).txt`, earlier project chats/recordings if available, repository code and the most recent decision record. The owner has explicitly said that some technical details were already discussed in the previous conversation and should be retrieved before being raised again. If exact detail cannot be found, state precisely what sources were checked and ask only the smallest unresolved question.

## 10. Recent implementation and testing history (checkpoint; re-verify live)

The following was reported/verified during the 21 November 2026 continuation. Recheck before relying on it:
- Repo `sumairniz/SJN-MDCAT-LMS`, branch `sjn-secure-content-publishing`.
- Management Auth project `tdqbjhrmfluiinntmjfh`; Student LMS staging `aozknkrwafowsrehdwlr`.
- Preview origin CORS allowlists were updated for Management Auth isolated auth v8, step-up v7, team v8 and team-actions v8; browser login was not yet independently confirmed by owner.
- Library function v5 and Content Studio function v7 were deployed with the required preview origin allowed; JWT verification retained.
- Active preview route was `integrated-auth-preview.html`, not `index.html`. The V4 shell was carried into the active preview route while preserving existing module/editor IDs.
- Regression test was added; deployment reached READY at commit `78e88ac9766f08ea0403f8dc8ed3ae4beb5b10a1`, alias `https://sjn-mednest-management-git-sjn-secure-content-publishing-sjn1.vercel.app`.
- PR #3 was kept Draft/unmerged; no production merge.
- Read-only database checks previously found 1,275 staging MCQs: 1,129 regional-bank MCQs, 146 Past Paper Question Bank MCQs and 79 restricted SJN MedNest Course Test MCQs. The 79 restricted course questions must remain excluded from ordinary Live Library and publishing.
- Management Auth previously showed 3 draft batches, 6 batch rows, 1 individual MCQ correction draft and 0 academic review submissions. Old random test drafts were missing; owner said these were random and not important.
- Owner tested seven basic checks and reported all correct. Owner then flagged that Bulk Upload UI was still legacy/not the new agreed design, and that Live Library search did not return complete/relevant results for subject matter terms such as carbohydrates, proteins, nucleic acids, chapter names and topics.
- Owner confirmed all MCQs appeared in Live Library after the CORS fix.
- Student LMS had not been changed in that basic check, as expected.

## 11. Current implementation authorization and delivery boundary

**Specific authorization recorded on 21 November 2026:** The owner explicitly instructed that the complete Question Content Studio redesign be implemented. Proceed on the existing feature branch/PR path, staging-first, within the scope described in this record. This authorization is specific to that redesign; it does not automatically authorize unrelated feature work, new paid services, destructive data operations, production migrations or production release.

Delivery should be staged:
1. Read this document and latest active decision log, full `Chat(1).txt`, original handovers and relevant implementation docs before coding.
2. Inspect current GitHub branch, PR, working tree/commit history and current Vercel preview.
3. Audit existing MCQ editor, destination references, shared-question relationships, image/formula support, versioning, review policy, release mechanics, import batch metadata and Student LMS renderer. Reuse prior detailed discussions in source chat rather than asking the owner to repeat.
4. Write any newly discovered implementation constraints and decisions into this record before implementing architectural changes.
5. Implement incrementally on the authorized feature branch; keep changes focused and preserve existing IDs/APIs/behavior.
6. Run tests and verify each workflow, including regression tests for existing behavior.
7. Deploy preview/staging and report exact commit, deployment URL/status, test coverage, known limitations and owner actions needed.
8. Do not merge to production, alter production data or release student-facing changes without separate explicit owner approval.

## 12. Mandatory new-chat startup protocol

At the start of every new SJN MedNest chat:
1. Search/read this **Master Product, Architecture & Decision Record** first.
2. Read the latest **Active Conversation & Decision Log** and the latest continuation checkpoint.
3. Search for the relevant full source conversation/transcript by title and inspect it when the task refers to prior discussion. For this redesign, source includes `Chat(1).txt` / chat titled **English Project Continuation Clarification**.
4. Inspect current GitHub branch/PR/commit and provider state if the task concerns implementation; never assume yesterday's deployment is still current.
5. Build a short internal checklist of discussed topics, proposals, finalized decisions, implementation approvals, implemented changes, verified results, unresolved matters and next action.
6. Do not ask the owner to repeat information already in these records or source conversations.
7. If a missing detail genuinely cannot be recovered, identify the exact missing detail and sources checked; ask one focused question only.
8. After any material discussion, proposal, owner decision, approval, implementation or test, update this master record and the active session log. Include context, exact wording/behavior, rationale, affected files/functions/tables, tests, environment, commit/deployment, verification level and rollback notes as applicable.
9. Do not mark a discussion as a proposal, a proposal as finalized, a finalized decision as implementation-approved, or an implementation as verified unless the evidence supports that exact status.

## 13. Documentation maintenance workflow — OWNER-APPROVED

For every meaningful project discussion:
- Record what was **DISCUSSED**, even if no decision was reached, with the question/context and options considered.
- Record each **PROPOSED** approach separately, including who/what suggested it, benefits, drawbacks and why it has or has not been accepted.
- When the owner **FINALIZES** something, record the exact requirement/decision, reasoning, scope, constraints and any alternatives rejected.
- Keep **IMPLEMENTATION APPROVAL** separate. Ask the owner before implementing a finalized decision unless explicit authorization for that exact scope is already recorded.
- After implementation, record exact technical changes: repository path, component/function, database object/migration if any, relevant commit and environment.
- After testing, record the actual test steps and results, who tested them, environment, limitations and whether verification is complete.
- When the owner changes a previous decision, preserve the old entry as superseded and append the new decision, date, reason and impact. Do not erase history.
- Keep the master record detailed enough that a future assistant/developer can understand not only **what** was decided but **why**, what was considered, what remains open and what is authorized next.

At the end of a substantial chat/session, update the master record and create/update a dated Active Conversation & Decision Log or continuation checkpoint as needed. The Library may contain readable copies/snapshots, but GitHub remains the canonical, version-controlled master.

## 14. Change log

| Date | Change |
|---|---|
| 21 Nov 2026 | Created permanent master record to prevent cross-chat context loss. Consolidates Content Studio V4 architecture, visual direction, detailed screens, nine external review concerns and technical refinements, non-regression requirements, recent staging checkpoint, and the owner's specific implementation authorization. |
| 21 Nov 2026 | Clarified that this master record supplements rather than replaces existing AI Developer Handover, Human Developer Technical Handover, Owner Guide, deferred-feature register, active session logs and original source conversations. |
| 21 Nov 2026 | Added the owner's governance rule: distinguish DISCUSSED, PROPOSED, FINALIZED, IMPLEMENTATION APPROVED, IMPLEMENTED and VERIFIED. Finalizing a decision never automatically grants implementation permission. Preserve prior decisions when superseded. |



### 13.1 Required depth for design documentation — OWNER-APPROVED

The owner explicitly requires the master documentation to preserve the **full detailed design as it was presented and discussed**, not merely a compressed summary or a list of final decisions. The purpose is to prevent a future chat from having to repeat an entire screen-by-screen design exercise.

Whenever a detailed design is discussed or proposed, document it at the same practical level of detail as the design presentation in chat. For each screen, module, workflow or component, include as applicable:

1. **Purpose and user outcome:** why the screen exists, who uses it and what task it enables.
2. **Information architecture and navigation:** exact parent/child hierarchy, entry points, destination context, back/next navigation and relationships with other modules.
3. **Full layout specification:** page regions, sidebars, headers, panels, cards, tables, columns, tabs, accordions, drawers, modals, toolbars, forms and their order/placement.
4. **Visible content:** labels, headings, helper text, metadata, badges/status text, summaries, empty-state wording and what information appears in each region.
5. **Controls and interactions:** every meaningful button, link, menu, filter, selector, input and row action; what happens on click/selection/submission; confirmations; navigation outcomes; cancel behavior; and success/failure feedback.
6. **Workflow and state transitions:** starting state, intermediate steps, validation, save behavior, status changes, approval/release boundaries, retry paths and final outcomes.
7. **All relevant UI states:** normal, selected, hover, focus, disabled, loading, empty, no results, validation warning, partial success, failure, network interruption, permission restricted and unsaved/unacknowledged changes.
8. **Responsive behavior:** desktop, tablet and mobile layout and interaction differences, including what collapses, moves, becomes a tab, drawer or stacked section.
9. **Visual system:** theme, color usage, hierarchy, density, spacing intent, typography, icon meaning, active/hover/focus feedback, motion and accessibility considerations.
10. **Data and technical behavior:** source of each displayed value, records/relationships, destination ownership, filtering/search rules, persistence, API/function dependencies, permissions and audit expectations. Clearly separate known current behavior from proposed future behavior.
11. **Integration and non-regression:** affected Management Panel, Student LMS, analytics, attempts, review, history, import or other modules; what must remain unchanged; compatibility and migration considerations.
12. **Examples and edge cases:** realistic illustrative examples, unusual inputs, duplicate/shared records, missing data, conflicting edits and recovery scenarios. Mark illustrative data as illustrative.
13. **Alternatives and rationale:** options considered, strengths/risks, why one approach was recommended, owner feedback/corrections and why the final approach was selected.
14. **Decision and approval status:** separately label DISCUSSED, PROPOSED, FINALIZED, IMPLEMENTATION APPROVED, IMPLEMENTED and VERIFIED. State exactly what is not yet decided or authorized.
15. **Open questions and dependencies:** only genuine unresolved items, why they matter, what evidence is needed and whether owner input is required.

For complex screens, use subsections and detailed tables/step-by-step flows rather than compressing information to save space. Preserve exact owner wording when it defines a requirement or constraint. Record corrections and rejected alternatives so they are not proposed again without new evidence.

### 13.2 Chat-to-chat continuity package — OWNER-APPROVED

At the end of each substantial design or development chat:
- Update this master record with the full detail of newly discussed/proposed/finalized items and the current status.
- Update the dated Active Conversation & Decision Log with the session's detailed chronology, important reasoning, screenshots/recording references, corrections and next steps.
- If a screen-by-screen design was presented, preserve the complete screen specifications and interaction details, not merely the names of screens.
- Keep source transcripts, screenshots and recordings referenced where available; the log/master record should explain their relevance.
- Add a concise **Next Chat Start Here** section identifying the exact document sections and source transcripts to read, the current project/branch/PR/deployment checkpoint, decisions already settled, approvals available, open questions and immediate next action.
- Never require the owner to repeat or re-approve something solely because a new chat has started. Reopen it only if the owner changes it or new technical evidence creates a real conflict.

**The owner should be able to start a new chat by saying “continue SJN MedNest” and have the assistant retrieve and continue from the detailed records, without asking the owner to paste the previous conversation again.**

| 21 Nov 2026 | Added the owner's requirement that detailed proposed and discussed designs be preserved screen-by-screen at full practical depth, including layouts, exact content, controls, interactions, states, responsive behavior, data/integrations, rationale, alternatives, status and approvals. Added a mandatory detailed chat-to-chat continuity package. |


## 15. Navigation review — Claude's two-mode proposal (21 Nov 2026)

**Status: DISCUSSED / REVIEWED. Assistant assessment recorded. Revised navigation recommendation is PROPOSED — NOT YET OWNER-FINALIZED. No code or deployment authorized by this review.**

### 15.1 Source and problem identified
The owner supplied Claude's review proposing two internal Studio modes: **Content** and **Workflow**. The concern is that the former eight-item internal navigation mixed three different concepts: content destinations (where work belongs), content actions (what users do), and workflow stages (where work currently stands). A flat menu risks allowing Create Questions or Bulk Upload to be entered without a destination and may become harder to extend as Studio features grow.

This is a valid information-architecture concern. It does not reject the approved central Studio, common MCQ editor/import engine, or destination ownership model. It refines how users navigate those capabilities.

### 15.2 Assessment of Claude's recommendations

| Claude proposal | Assessment | Status |
|---|---|---|
| Two modes: Content and Workflow | Clear separation of content location/actions from cross-destination work stages. Recommended. | PROPOSED |
| Content destination tree | Better than relying only on destination cards for frequent users. Show banks, course → test and region → paper hierarchy. | PROPOSED |
| Content tabs: Browse & Edit, Create, Bulk Upload, My Drafts | Good grouping. My Drafts needs a cross-destination view/filter; it should not be trapped inside only one selected destination. | PROPOSED WITH REFINEMENT |
| Workflow mode: My Work Board, Academic Review, Release Centre | Appropriate cross-destination grouping. Preserve separate responsibilities and avoid duplicate workflows. | PROPOSED |
| Jump-to search | Useful shortcut; results must respect permissions and show destination context. | PROPOSED |
| Recently opened | Useful compact convenience, not a competing navigation system. | PROPOSED |
| Main Management sidebar collapses to icon strip | Useful optional space-saving behavior. Do not force two permanently expanded sidebars; retain accessible labels/tooltips and a way to expand. | PROPOSED WITH REFINEMENT |
| Mobile destination dropdown and Content/Workflow tabs | Sensible responsive adaptation. | PROPOSED |
| Studio Overview optional/removable | Do not decide solely from this proposal. Retain a lightweight landing state only if it adds orientation, destination selection, recent work or useful overview; otherwise the Content mode can open directly. | PENDING DESIGN DECISION |

### 15.3 Proposed revised information architecture

**Main Management Panel navigation remains unchanged.** Question Content Studio remains one top-level module. The proposed two-mode switch exists only inside the Studio.

**Content mode — work with questions and their destination**
- Persistent contextual destination tree:
  - Question Banks → SJN Question Bank; Past Paper Question Bank.
  - Courses & Sessions → Course → Test.
  - Full-Length Past Papers → Region/category (as configured) → Paper.
- Contextual breadcrumb always visible, e.g. Question Content Studio › Courses & Sessions › Genome › Test 03.
- Content workspace tabs: Browse & Edit (existing Live Library function; no duplicate library); Create (existing Create Questions function); Bulk Upload; My Drafts.
- Selected destination remains visible while moving among Browse & Edit, Create and Bulk Upload.
- My Drafts supports All My Destinations and selected-destination filtering. Each draft displays its true destination; opening it restores that destination context. Do not move or reassign a draft merely because a different destination is selected.
- Jump-to search and Recently Opened may provide shortcuts to permitted destinations. Search results must disclose destination and respect staff permissions.

**Workflow mode — track and progress work across destinations**
- My Work Board — overview of actual supported work statuses across destinations; links to the owning detailed workspace, not a duplicate editor or task engine.
- Academic Review — optional requested reviews and reviewer actions; approval does not publish.
- Release Centre — final release preparation, validation, authorization and explicit release confirmation; separate from review.
- Each entry should have a concise one-line job description. Keep status ownership and release safeguards already specified in Sections 6.11–6.13.

### 15.4 Destination inheritance and safety — proposed detailed behavior

**Create Questions opened from a selected destination:**
- Inherit the selected destination automatically.
- Show a persistent Current destination label and breadcrumb before the editor opens and throughout the editing session.
- State clearly that new questions will be associated with that destination.
- Save is disabled until destination context and server-side permission are valid.
- Changing destination requires an explicit user action, clear warning and confirmation. It must not silently move existing questions/drafts or change ownership of already-created records.

**Bulk Upload opened from a selected destination:**
- Inherit and display the destination before file selection.
- Keep it visible through file selection, validation, row correction, batch review and final import confirmation.
- Repeat destination and record count in the final pre-import summary.
- Reject/stop the import if destination context or server-side permission is missing or changed unexpectedly.

**Create Questions opened directly with no destination:**
- Do not open an active editor that can save content.
- Present a destination chooser for Question Banks, Courses & Sessions or Full-Length Past Papers, then the required child destination (bank, course/test or paper).
- Open the editor only after a valid destination is selected and authorized.

**Bulk Upload opened directly with no destination:**
- Require the same explicit destination selection before file processing/import.
- Do not accept or process a batch into an implicit/default destination.
- Display destination again before final import commit.

**Security and ownership:** UI labels are not authorization. Enforce destination access and allowed operations server-side. A destination selector for new content is not a record-move function. Moving existing content is a separate operation requiring its own design, permissions, impact preview, confirmation and audit.

### 15.5 Responsive navigation proposal
- Desktop: Studio mode switch is prominent. In Content mode, destination tree remains visible. Main Management Panel sidebar may collapse to a narrow icon rail on request to gain workspace width; avoid two full expanded sidebars competing for space. Provide accessible labels/tooltips and restore/expand control.
- Tablet: adapt/collapse the destination tree and preserve a clear visible destination breadcrumb/selector.
- Mobile: Content and Workflow become two tabs; destination tree becomes a compact selector/dropdown at the top (e.g. Genome › Test 03). Keep the selected destination visible in Create and Bulk Upload flows.

### 15.6 Existing decisions preserved
This proposal must not undo:
- One central Studio and one shared MCQ editor/import engine.
- Question Banks, Courses & Sessions and Full-Length Past Papers as distinct destinations.
- Courses & Sessions and Full-Length Past Papers remaining separate top-level Management Panel modules for metadata/configuration.
- My Drafts and Live Library having one detailed home each; Work Board is an overview only.
- Academic Review being optional and separate from release.
- Release Centre being the only final release preparation/confirmation home; approval never auto-publishes.
- Destination-aware creation/import, persistent context and server-side authorization.
- Existing Student LMS and Test History non-regression requirements.

### 15.7 Owner decision and approval boundary

**Status: FINALIZED / OWNER-DECIDED — navigation design direction accepted on 21 November 2026. IMPLEMENTATION APPROVAL IS NOT GRANTED BY THIS DESIGN DECISION.**

The owner explicitly agreed with the revised two-mode navigation and the assistant's refinements to Claude's proposal. The finalized direction is:
- Content and Workflow are the two modes inside the central Question Content Studio.
- Content mode uses the contextual destination tree and the Browse & Edit, Create, Bulk Upload and My Drafts workspace tabs.
- My Drafts supports All My Destinations and selected-destination filtering; each draft displays and restores its true destination.
- Workflow mode contains My Work Board, Academic Review and Release Centre, with distinct responsibilities and concise descriptions.
- Jump-to search and Recently Opened are useful navigation conveniences subject to permissions.
- Main Management Panel sidebar may optionally collapse to an accessible icon rail; it should not force two permanently expanded sidebars.
- Mobile uses Content/Workflow tabs and a compact destination selector; tablet adapts the tree and preserves destination context.
- Create Questions and Bulk Upload inherit a selected destination; when opened without one, they require explicit destination selection before editing/import. Destination context remains visible and is enforced server-side. Selecting a destination for new work is not permission to move existing records.

**Studio Overview:** The owner has not separately chosen between a lightweight landing state and opening directly into Content mode. Preserve this as a small unresolved presentation detail. The recommended default is a lightweight landing state only if it adds useful destination shortcuts/recent destinations/compact overview; otherwise open Content mode directly. Do not let this unresolved detail block the finalized two-mode navigation architecture.

This is finalization of the navigation design direction, not blanket approval to implement. Implementation still requires the owner's explicit approval for the relevant scope. No code, database, security, deployment, merge or production changes are authorized by this decision.

### 15.8 Change log
| Date | Change |
|---|---|
| 21 Nov 2026 | Reviewed Claude's two-mode Content/Workflow proposal against original Chat(1).txt and V4 navigation decisions. Recorded assistant assessment, accepted elements, refinements, detailed Create/Bulk Upload destination behavior, responsive behavior and approval boundary. |


## 16. Reference design ZIP access and editor save-action clarification (21 Nov 2026)

**Status: DISCUSSED. Reference assets located in Library; raw inspection not completed. Save-action meanings below are proposed UX definitions, not verified current implementation behavior. No implementation approval granted.**

### 16.1 Three visual reference ZIPs
The three previously supplied reference archives are present in the user's Library under `/Online Academy`:
- `Ref designs 1.zip` (about 1.59 MB)
- `Ref designs 2.zip` (about 1.43 MB)
- `ref designs 3.zip` (about 1.70 MB)

The archives are reference/inspiration only. The owner explicitly says not to copy them; use them to inform a distinct SJN MedNest interface consistent with the finalized SJN-red visual direction, professional modern UI, ease of use, density, and workflows. During this retrieval, Library metadata confirmed the archives exist, but raw-byte materialization was denied because the Project files have no authorized raw-byte path. Therefore their internal screens have **not** been freshly inspected in this session. Do not claim to have opened or reviewed their contents. When a usable file-reading path becomes available, inspect all three archives and map useful patterns to the SJN design without copying.

### 16.2 Save Question / Save Draft / Save & Next — conceptual distinction
The owner asked what the three editor actions mean. The intended UX distinction to validate is:
- **Save Question:** save the current MCQ as a normal question record in the selected destination, using the existing supported save/publish lifecycle. The button label alone must not imply student publication. Whether the saved record is immediately live or remains unpublished depends on the actual existing content/version/release model and must be verified before finalizing exact semantics.
- **Save Draft:** save the current work as an unfinished draft so the author can return later. It should not make the question student-visible. Preserve the current draft/save acknowledgement behavior and destination context.
- **Save & Next:** save the current question using the appropriate save path, then open a fresh editor for the next question while retaining the current destination and suitable classification context (e.g. subject/chapter where appropriate). It must not skip validation, lose entered data, or accidentally publish content.

These are **proposed user-facing meanings**, not a verified description of the current code. Before implementation, inspect current editor handlers, persistence APIs, draft records, publication/version semantics, validation and navigation behavior. Resolve whether Save Question is a normal saved-but-unreleased record or an immediately student-visible record; do not assume. Keep three actions only if each has a distinct, understandable purpose. Consider contextual helper text/confirmation and success feedback so users know where the question was saved and whether it is a draft or released.

### 16.3 Owner's implementation approach
The owner says the design is still being discussed and is **not yet approved for implementation**. The expected process is to implement only after explicit approval, then inspect the working interface together and make practical refinements based on the owner's feedback. This iterative refinement process does not mean implementation can start now without approval. Preserve the finalized design and record later adjustments as new decisions, with previous history retained.

### 16.4 Change log
| Date | Change |
|---|---|
| 21 Nov 2026 | Recorded the three reference ZIP archive locations and the limitation that raw contents could not be opened in this retrieval; clarified they are inspiration, not templates to copy. Added conceptual distinctions for Save Question, Save Draft and Save & Next, explicitly pending code-level verification. Recorded that implementation approval is still pending and future visual refinements will be owner-led after preview. |


## 17. Read-only technical and live Supabase verification — Content Studio (24 Nov 2026)

**Status: AUDIT COMPLETED FOR THE SCOPED WORKFLOWS. READ-ONLY ONLY. No source, database, function, deployment, PR, or production changes were made. Implementation approval remains NOT GRANTED.**

### 17.1 Scope and evidence inspected

The audit inspected the current `sjn-secure-content-publishing` branch and the connected live Supabase projects:
- Management Auth: `tdqbjhrmfluiinntmjfh` (ACTIVE_HEALTHY).
- Student LMS Staging: `aozknkrwafowsrehdwlr` (ACTIVE_HEALTHY).
- The separate legacy/student project `yapvnevvjfewvafbjcgc` was listed as INACTIVE; it was not modified.

Inspected frontend files:
- `apps/management/content-studio.js`
- `apps/management/content-studio-storage.js`
- `apps/management/content-studio-core.js`
- `apps/management/mcq-library.js`
- `apps/management/mcq-editor-assist.js`
- `apps/management/academic-review.js`
- `apps/management/content-publish-client.js`
- `apps/management/index.html`

Inspected Management Auth Edge Function source and live deployments:
- `mednest-content-studio` (live ACTIVE version 7)
- `mednest-mcq-library` (live ACTIVE version 5)
- `mednest-academic-review` (live ACTIVE version 2)

Inspected relevant SQL definitions:
- `database/management/isolated-content-studio-drafts-20261107.sql`
- `database/management/isolated-mcq-library-draft-edits-20261108.sql`
- `database/management/isolated-academic-review-workflow-20261108.sql`
- `database/management/isolated-content-batch-audit-execute-hardening-20261117.sql`

Live SQL reads checked table counts/statuses, review policy, relevant routine definitions, RLS flags, table grants and policy metadata. Supabase security advisors were queried for Management Auth and Student LMS Staging. No writes or test submissions were performed.

### 17.2 Live Management Auth state (24 Nov 2026 audit)

The live database returned:
| Item | Live result |
|---|---:|
| Active staff membership records | 1 |
| New-question draft batches | 3 |
| New-question batch statuses | All 3 are `draft` |
| New-question draft rows | 6 |
| Existing-MCQ correction drafts | 2 |
| Existing-MCQ correction draft states | Both `draft` |
| Academic review submissions | 0 |
| Existing-MCQ correction review policy | `one`, version 1 |

The staff membership count is a record count only; no personal email or user identifier is recorded here. The live audit log contained draft-save actions for existing-MCQ correction drafts on 20 Nov and batch-save actions, most recently on 17 Nov. No question text or personal data is copied into this decision record.

These counts confirm that draft storage has been used and that no academic review submission is currently recorded. They do not prove every user-interface path works end-to-end.

### 17.3 Exact current save behavior — verified

**New-question editor**
- `Save Question` submits the current form, validates it, then persists the question into the protected Management Auth draft batch. It is not a student publication action.
- `Save Draft` persists the complete current working batch to Management Auth, in chunks of up to 40 rows per request (with a 3,000-question batch ceiling).
- `Save & Next` sets the advance flag and submits the same form. It waits for the save operation to succeed before opening the next existing question in the batch or a fresh question editor.
- The first save of a new/dirty batch can persist all current rows; subsequent individual edits can persist only the changed row. The explicit batch-save action persists the batch.
- A save failure keeps the form and marks it dirty; the UI reports that protected storage did not confirm the save.
- The save confirmation explicitly says the question is in Management Auth and nothing has been published.

**Existing-MCQ Library editor**
- Its Save action is labelled and implemented as `Save Draft` through `mcqs.save_draft`.
- It stores a proposed correction in Management Auth; it does not update the Student LMS source MCQ.
- The source revision and draft version are checked. A changed source revision or stale draft version blocks the save.
- The UI explicitly says academic review and release are still required.

**Important clarification:** the current new-question `Save Question` label does NOT mean a released/live question. It saves into the protected batch draft. This resolves the ambiguity recorded in Section 16.2 for the currently inspected new-question workflow. The existing-Library correction workflow remains a separate correction-draft lifecycle.

### 17.4 Autosave conflict — confirmed implementation discrepancy

The current new-question editor has automatic network persistence:
- After an edit is recorded (the history debounce is about 180 ms), it schedules autosave after 1,100 ms.
- It sends draft data through the same protected server storage path.
- If another save is in progress, it retries after 700 ms.
- On failure, it reports the problem and retries after 2,500 ms.
- Undo/redo also schedules autosave.

This conflicts with the owner's established preference to remove autosave-induced lag and unnecessary network dependency. **Finding: confirmed product-requirement discrepancy.** Do not silently retain it in the redesign. A proposed future behavior is explicit/manual save only, with clear unsaved-state warning and acknowledgement; however, the precise replacement UX must be owner-confirmed before implementation. Do not remove autosave in code until implementation scope is separately approved.

### 17.5 Live database access boundary and RLS findings

The relevant Management Auth tables have RLS enabled. The audit found no row-level policies for these tables, and the Supabase security advisor reports the informational `rls_enabled_no_policy` finding. Separate privilege checks showed:
- `anon` has no SELECT privilege on the inspected staff/draft/review/audit tables.
- `authenticated` has no SELECT privilege on those tables.
- `service_role` has the expected table access used by the server-side Edge Functions.

The current architecture intentionally routes these operations through server-side functions using verified Management Auth sessions and the service role, while direct browser-role table access is revoked. In this specific arrangement, the empty policy list is not by itself evidence that draft records are publicly readable. Preserve this restrictive boundary; do not add broad RLS policies merely to silence the informational advisor. Reassess if direct client access is ever proposed.

Relevant server routines inspected for existing-MCQ draft save and review submit/decision/withdraw/policy changes are `SECURITY INVOKER`; the SQL grants their execution to `service_role`. The functions check the live staff session and relevant actor permissions. The two-reviewer decision function blocks the author and the first reviewer from acting as the second reviewer.

The Management Auth advisor also reported leaked-password protection disabled. This is a general Auth hardening recommendation, not a Content Studio implementation defect; it was not changed in this audit.

### 17.6 Review-policy reconciliation

The live existing-MCQ correction policy is `one` independent reviewer, version 1. The correction submission routine snapshots the policy and creates an `approved_for_release` submission immediately when policy mode is `direct`; otherwise it requires one or two reviewers. Review approval itself returns `published:false`.

The new-question batch workflow is separate: it can be submitted for independent review or, by Chief Administrator, prepared directly as `approved_for_release`. Both routes explicitly leave student publication disabled.

Therefore, the design principle “Academic Review is optional and approval never auto-publishes” can be preserved, but it must be implemented as two clearly explained workflows until their data models are intentionally unified. Do not change the live policy or merge the two mechanisms as part of UI redesign without separate approval.

### 17.7 Critical preview-origin mismatch found in deployed Academic Review Edge Function

The live deployed `mednest-academic-review` version 2 has an `ALLOWED_ORIGIN` regular expression that allows the management host and the `-git-sjn-phase1a-foundation` preview suffix, but does **not** allow the current `-git-sjn-secure-content-publishing` preview suffix.

The current GitHub branch's Management Panel preview origin uses the `sjn-secure-content-publishing` branch suffix. As a result, Academic Review API requests made from that branch preview are expected to be rejected at the origin check (HTTP 403), even though the Content Studio and MCQ Library deployed functions have allowlists that include the secure-content-publishing suffix.

**Finding: high-priority integration defect to reproduce and correct before relying on Academic Review from the current branch preview.** This is a source/deployment inspection finding; no live request was sent to test the rejection, and no function was changed. Before any fix, verify the exact current preview hostname and ensure the allowlist is narrow and consistent with the authorized Management Panel origins. Do not broadly allow arbitrary origins.

### 17.8 MCQ Library search limitation — confirmed in current code

The visible search placeholder promises ID, question phrase, bank, subject, chapter, topic and source. However, the current server query:
- Filters bank and subject separately.
- Treats the free-text query as an MCQ ID if numeric.
- Otherwise applies `ilike` only to the `question` column.
- Does not search chapter, topic or source text.

The interface does not expose dedicated chapter/topic/source filters in the inspected markup. This matches the previously reported incomplete search behavior. **Finding: confirmed search/UI contract mismatch.** Design and implementation should make the search promise truthful and define chapter/topic/source filters or a safe combined search, with server-side query limits and performance testing. This is a separate scoped enhancement; do not silently change the student-facing MCQ schema or unrelated Test History features.

### 17.9 Student Staging and non-regression observations

Student LMS Staging has a separate active `mednest-content-publish` Edge Function and a separate publication-receipt table. The browser publisher calls that separate endpoint with a Management Auth access token; the new-question publisher is not the same endpoint as existing-MCQ correction publication. Existing correction publication is exposed through a separate action in Academic Review.

The Staging security advisor returned a warning about `public.sjn_submit_practice_attempt(...)` being executable by `authenticated` as a `SECURITY DEFINER` function, plus the general leaked-password protection warning. This practice-submission finding is outside the Content Studio scope and must not be changed during this redesign. It should be recorded for a separate, careful security review because student attempt submission and Test History are protected non-regression areas.

The table-list tool's estimated row counts for some Student LMS tables did not agree with the historical MCQ totals; no new exact MCQ inventory count was inferred from those estimates. This audit did not modify or test student attempts, Results, Review, Retake, Analytics or Mistake Diary.

### 17.10 Consolidated findings and recommended order

| Priority | Finding | Recommendation |
|---|---|---|
| High | Academic Review deployed origin allowlist excludes current secure branch preview | Reproduce on preview, then prepare a narrowly scoped allowlist correction for explicit approval |
| High | Autosave conflicts with established performance preference | Design manual-save-only interaction and unsaved-change safeguards; do not alter code before approval |
| Medium | MCQ Library free-text search only searches question text despite broader placeholder | Define and implement accurate chapter/topic/source search/filter behavior after approval |
| Medium | New-question and correction review flows have separate models/policies | Preserve separation and explain status transitions; do not merge casually |
| Informational | RLS-enabled Management tables have no policies | Current privilege checks show no direct anon/authenticated SELECT; preserve service-role-only access model |
| Separate security review | Staging practice-submission SECURITY DEFINER advisor warning | Isolate for independent review; do not touch as part of Studio work |

### 17.11 Implementation and approval boundary

This audit is a read-only technical verification and does not grant implementation approval. The next phase should be a written technical change plan with file/function scope, migration impact (if any), tests, rollback, and non-regression checks. It must explicitly exclude Student LMS attempt/submission history and all unrelated student-facing modules. The owner must approve that implementation scope separately before code changes.

### 17.12 Change log

| Date | Change |
|---|---|
| 24 Nov 2026 | Completed read-only branch, live Management Auth and Student LMS Staging inspection. Verified save handlers, autosave behavior, live draft/review counts, review policy, RLS/table privileges, active Edge Function versions, preview-origin allowlist mismatch, and MCQ Library search limitation. Recorded findings and implementation boundary. No code, database, Edge Function, deployment, PR or production changes. |


## 18. Owner clarification and Academic Review preview-origin fix (24 Nov 2026)

### 18.1 Autosave requirement clarification — owner-confirmed

The previous audit incorrectly treated the owner's earlier no-autosave requirement as applying to the Management Panel Content Studio. The owner clarified that the no-autosave requirement applies to the **Student LMS test-taking experience**, where network dependency and lag must be avoided.

For the **Admin/Management Panel Content Studio**, the intended experience is an editor-style workflow:
- Automatically save edits in the background.
- Provide Undo and Redo so the author can reverse changes.
- Preserve clear save status/acknowledgement and unsaved-change protection.
- Avoid unnecessary lag and prevent autosave races or lost edits.

Therefore, the existing Content Studio autosave is **not a requirement conflict**. It is aligned with the owner's intended Admin editor experience, subject to performance and reliability refinement. Do not remove autosave from the Admin Panel on the basis of the Student LMS requirement. The Student LMS no-autosave principle remains unchanged.

### 18.2 Academic Review preview-origin correction — implemented

The owner explicitly asked to fix finding 17.7. The exact allowlist in `database/management/mednest-academic-review/index.ts` was updated to include the specific `-git-sjn-secure-content-publishing` preview suffix. The allowlist remains anchored to the expected `sjn-mednest-management` Vercel hostname and does not permit arbitrary origins.

- GitHub branch: `sjn-secure-content-publishing`
- Source commit: `691083b0deebd15999d91ecee4f774543ead48cc`
- Live Management Auth Edge Function: `mednest-academic-review`
- Live deployment version after update: **3**
- JWT verification remains enabled.
- The deployed source was fetched again after deployment and confirmed to contain the new exact origin suffix.

**Verification boundary:** source and deployment version were verified. A browser/API request from the actual Vercel preview was not executed in this step, so end-to-end CORS success remains pending preview verification. No database schema, review policy, staff permissions, Student LMS data, publishing logic or production application code was changed.

### 18.3 MCQ Library search

The owner confirmed that the incomplete MCQ Library search should be completed. This remains a planned enhancement; no search implementation has been changed in this step. Its scope should include truthful and useful searching/filtering across question ID/text, bank, subject, chapter, topic and source, with performance-safe server-side filtering and clear result behavior.

### 18.4 Change log

| Date | Change |
|---|---|
| 24 Nov 2026 | Corrected the autosave requirement interpretation: no-autosave applies to Student LMS attempts, while Admin Content Studio should autosave with Undo/Redo. Fixed and deployed the Academic Review preview-origin allowlist as Edge Function version 3; re-fetched live source to verify the exact origin entry. MCQ Library search enhancement confirmed as required but not yet implemented. |

**End of master record.**


## 19. MCQ Library search and classification filters — implementation (24 Nov 2026)

**Status: IMPLEMENTED IN MANAGEMENT PANEL BRANCH; MANAGEMENT AUTH EDGE FUNCTION DEPLOYED; VERCEL PREVIEW BUILD PENDING.** Student LMS application code, schema, functions, and student records were not modified.

### 19.1 Owner-approved behavior
The MCQ Library search now supports:
- Dedicated Bank, Subject, Chapter, and Topic filters.
- Chapter options derived from chapter labels present in permitted MCQs for the selected Bank/Subject.
- Topic options derived from topic labels available in the selected Bank/Subject; selecting a Chapter narrows Topic options to that Chapter.
- Main search across MCQ ID, question text, bank, subject, chapter, topic, and source.
- Combined filters and free-text search use AND semantics; the free-text term matches any of the listed fields.
- Existing restricted Course Test exclusion and permitted bank allowlist remain unchanged.

### 19.2 Implementation files and commits
- `apps/management/index.html` — added Chapter and Topic selectors and corrected search guidance. Commit: `e446a6248484f508614917b99aafd7918865fc1e`.
- `apps/management/mcq-library.js` — loads dynamic facets, resets dependent filters when Bank/Subject/Chapter changes, and sends all selected filters. Commit: `e03df926e7751ca57109b51d659456ee11ed9a1d`.
- `database/management/mednest-mcq-library/index.ts` — added authenticated `mcqs.facets` operation and server-side combined filtering for `mcqs.list`. Commit: `7233b374ec7b7f4bc72fec4c851160ec4ecb4ba7`.
- The facet query was subsequently paginated in 1,000-row pages (up to 50,000 rows) to avoid the default PostgREST response cap. Commit: `1cada17e89320f36fd06f9cc5bfba5aba2d97c17`.

### 19.3 Live data observations used
Read-only inspection of the existing MCQ source showed populated chapter/topic metadata across the permitted regional/past-paper banks, including provisional/legacy labels. The filters therefore use actual source MCQ labels rather than only the approved Management Auth syllabus tree, so existing classifications remain discoverable. No syllabus taxonomy rows were created or modified.

### 19.4 Security and scope
- The new facet operation is inside the existing Chief Administrator authenticated Edge Function and existing allowed-bank boundary.
- The Student LMS API remains accessed only through its existing publishable/read-only client; no Student LMS write path was added.
- MCQ result pagination remains 25 rows.
- Existing course-only MCQ exclusion, edit-draft lifecycle, revision checks, and no-publication behavior are preserved.
- No Student LMS frontend, database schema, Edge Function, attempts, Test History, Results, Review, Retake, Analytics, or Mistake Diary code/data was changed.

### 19.5 Deployment and verification status
- Management Auth Edge Function `mednest-mcq-library` deployed successfully as **version 6**, with JWT verification enabled.
- The deployed function source was fetched back and confirmed to include `mcqs.facets` and the expanded search fields.
- Vercel had not yet produced a preview deployment for the branch at the time of this record. Browser/UI testing and authenticated end-to-end searches remain pending; do not treat deployment/source verification as full functional verification.
- No production deployment or PR merge was requested or performed.

### 19.6 Change log
| Date | Change |
|---|---|
| 24 Nov 2026 | Implemented Chapter/Topic facets and cross-field search in Management Panel; deployed Management Auth MCQ Library Edge Function v6. Awaiting Vercel preview and browser-level verification. |
