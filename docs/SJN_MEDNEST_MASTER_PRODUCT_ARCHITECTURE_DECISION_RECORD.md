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

**End of master record.**
