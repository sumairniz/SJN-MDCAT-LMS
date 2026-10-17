# SJN MDCAT LMS Pro — Phase 4 MCQ Database Foundation: Read-Only Review

**Date:** 2026-10-17 (Pakistan time)  
**Scope:** GitHub \`sjn-phase1a-foundation\` at reviewed source commit \`656f97de1ca8e00d3bd7f831286565c0bc060792\`; staging Supabase **\`aozknkrwafowsrehdwlr\`**; read-only table metadata, SELECT queries on PostgreSQL catalog policies/indexes/constraints.  
**Status:** READ-ONLY FINDINGS + ENGINEERING PROPOSAL. **NO migration, INSERT, UPDATE, DELETE, auth policy change or production action approved.**  
**Related:** [Future Question Banks and Create Test](SJN-FUTURE-QUESTION-BANKS-AND-CREATE-TEST.md), [Blueprint v1.3](SJN-PHASE4-INTERFACE-BLUEPRINT-v1.3.md), [Temporary Change Register](SJN-TEMPORARY-CHANGE-REGISTER.md).

## 2026-10-17 — exact 74-question import strategy documented, staging write NOT authorized

See [74-MCQ Staging Migration Plan](SJN-74-MCQ-STAGING-MIGRATION-PLAN.md) for the source-to-database field mapping, original source fingerprint, 1–74 stable IDs, atomic import, checks and rollback. **Critical:** after any nonempty DB return, current `loadContent()` automatically replaces the inline question array, so incomplete uploads would be visible to testers. This design work is documentation-only; migration awaits separate approval.

Confirmed future wizard direction: Unused default, Used/Incorrect/Marked as optional simultaneous selections including all four. Implementation is after question-level history, not in this import.

## 2026-10-17 owner clarification — bank separation and premium content

**CONFIRMED:** The owner does **not** want the same MCQ in both `Past Papers Question Bank` and `SJN Question Bank`. The earlier open question about multi-bank membership is resolved **against sharing**. For this foundation plan, use one ordinary bank classification per MCQ, and design duplicate-detection/curation without manufacturing separate tables per bank. The current 74 questions are all Past Papers.

**PRELIMINARY DIRECTION, not implementation authorization:** Courses may offer chapter, multi-chapter or strict mock tests with distinct premium question sets, not sourced from either regular question bank. Hide chapter/topic names during course assessments; classification may remain private for future authorized uses. When the course ends, the owner *may manually publish* some/all selected premium MCQs into **one** regular question bank. **Do not automatically disclose or publish premium content.**

**SECURITY DESIGN GATE:** The current `mcqs` SELECT policy is available to anonymous users and `/api/content` returns MCQs with correct answer keys. That is not a safe storage/exposure policy for paid or strict mock-exam questions. The eventual course assessment store or protection layer needs authorization and carefully scoped answer release. Do not insert premium course questions in the presently public `mcqs` path. No course tests have been implemented as part of this phase.

**NEXT:** Continue only with the approved design process for migrating the existing 74 **Past Papers** questions to staging, preserving original content and not creating any premium questions. Later work remains: secure question-level test history, Review/Retake, functional Report Issue and Mark for Review, Create Quiz improvements, then separately specified Analytics/Mistake Diary/course assessments.

## 1. Confirmed current architecture (OBSERVED/VERIFIED)

- Repository: \`sumairniz/SJN-MDCAT-LMS\`; development branch \`sjn-phase1a-foundation\`; separate production \`main\`. Production Supabase project **\`yapvnevvjfewvafbjcgc\`** is out of scope. The owner must independently authorize staging writes and later production merges/deployments.
- **74 original hardcoded Biology MCQs** in \`public/index.html\`, IDs **1–74**, all currently \`bank: 'Past Papers Question Bank'\` and \`chapter: 'Biological Molecules'\`. Every original inline record has \`id\`, \`bank\`, \`subject\`, \`chapter\`, \`topic\`, \`source\`, \`question\`, \`options\` (four choices), \`correctIndex\`, \`explanation\`, \`mnemonic\`. Original source text must survive verbatim, with ID fingerprint preservation tests.
- \`server.js\` \`/api/content\` reads \`mcqs\`, courses, past papers, resources and maps rows to frontend question shape. **The API currently advertises only \`Past Papers Question Bank\`**, even though the owner plans a future \`SJN Question Bank\`; avoid assuming the second bank is already implemented.
- Existing website wizard filters its in-memory bank, uses question shuffle and honors current bank/subject/chapter/topic selections; later helper code still assumes Past Papers. \`loadContent()\` preserves original inline records when \`mcqs\` is empty. **Do not let any new fetch clear the original bank accidentally.**
- Current \`/api/attempts\` writes aggregate \`total, correct, accuracy, mode, subject, selection_json\` for authenticated students; \`/api/history\` cannot reconstruct the actual question IDs, order or answers. Stage 3A Results Screen computes currently completed test insights in memory and reuses existing authenticated save.
- \`bookmarks(mcq_id)\` references \`mcqs(id)\`. No database records exist for the inline original 74, so marking those questions cannot persist in the current schema. Don't bypass the FK or per-user RLS to simulate success.

### Staging data snapshot (live read-only inspection, 2026-10-17)

| Existing public table | Rows observed | Note |
| --- | ---: | --- |
| \`profiles\` | 4 | Test identities; RLS on |
| \`mcqs\` | **0** | Original 74 **not** yet database-backed |
| \`attempts\` | 37 | Aggregate testing history; no question-level answers |
| \`bookmarks\` | 0 | FK to \`mcqs.id\` |
| \`courses\` | 0 | Existing structure, no published course data |
| \`past_papers\` | 0 | Existing structure |
| \`resources\` | 0 | Existing structure |

### Existing schema facts

- \`mcqs\`: \`id bigint GENERATED BY DEFAULT AS IDENTITY\`, \`bank text\`, \`subject text\`, nullable \`chapter/topic\`, \`question text\`, \`options_json jsonb\`, \`correct_index integer\`, nullable \`explanation/mnemonic/source\`, \`created_at timestamptz\`. Existing default bank is Past Papers. **All of these can represent the current 74 records**, so no unreviewed full rebuild is necessary just to transfer content.
- \`attempts\`: \`id bigint\`, \`user_id uuid\` (FK to \`auth.users\`), \`title\`, \`total\`, \`correct\`, \`accuracy real\`, \`mode\`, \`subject\`, \`selection_json jsonb\`, \`created_at\`.
- \`bookmarks\`: composite primary key \`(user_id, mcq_id)\`, FKs to \`auth.users\` and \`mcqs\`.
- **RLS policies verified:** authenticated users manage own attempts/bookmarks via \`auth.uid() = user_id\`; profiles are readable/editable by their owner. \`mcqs\` currently permits **anonymous and authenticated SELECT**; importantly its publicly returned rows include **correct_index/explanations**. This is acceptable as a current observation for ordinary practice **but not a proven anti-cheating design for a future strict or paid mock**.
- Catalog checks show **only primary-key indexes** on \`mcqs\`, \`attempts\`, \`bookmarks\`; no separate bank/subject/chapter/topic or user-history index was found in these tables. Additional measured indexes will be needed as volume grows.
- Applied staging migrations: \`20261012215543_create_staging_lms_schema_and_rls\`, \`20261012221323_restrict_staging_signup_trigger_execution\`. **No migration was executed in this review.**

## 2. Recommended permanent design (PROPOSED — not yet authorized)

### Foundation first; build for future features without overengineering

1. **MCQ identity and two-bank readiness:** retain a globally stable MCQ ID and add a small explicit bank definition/metadata structure when designing the first migration. Existing \`mcqs\` can remain the core question table. Owner disallows the same MCQ across banks, so favor **exactly one ordinary bank per MCQ** and no many-to-many bank membership. **Do not create one separate MCQ table per question bank.**
2. **Taxonomy and source:** store and index bank/subject/chapter/topic efficiently with unambiguous stable references; preserve all original literal metadata. Plan examination source/year separately where useful, without fabricating a year for unknown sources or rewriting question wording. Use version/publishing state to correct questions safely without silently changing historic attempts.
3. **Question privacy:** student access serves only permitted published content and should paginate/filter rather than return 50,000 records. For future strict timed mock exams, hide answer keys until authorized completion using separate checked server endpoints; ordinary Tutor practice and future mock security requirements are **different**.
4. **Question-level attempts:** later Stage 3B can add RLS-scoped attempt items with immutable ordered question IDs, selected answer, skipped state and question snapshot/version, elapsed time/mode, linked to completed \`attempts\`. This supports Review Test, exact-order Retake, Used/Unused/Incorrect, future analytics and robust handling of updated questions. Retake must create a **new** attempt, preserving the previous result.
5. **Draft/Resume:** design a separately approved in-progress attempt/draft life cycle and autosave; enforce original 24-hour session window, verified user identity, proper atomic writes, and save-failure handling. Timed Practice Save & Exit pauses; strict mock exam rules are a separate future decision.
6. **Unified marks:** retain **one bookmark/mark per user and MCQ**; secure it using RLS and stable published IDs. Only remove a mark when the student explicitly unmarks. Mark remains available across sessions/devices. Reconcile existing FK rules before import.
7. **Admin future:** permissions for publishing/importing must be separated from student endpoints; server/admin-side authorization is required. Do not implement privileged admin features in the present migration. Consider course entitlements and reports after owner specifies them.
8. **Scalability:** plan additive migrations and rollback, indexes based on query patterns, constrained foreign keys, validation of question imports, content snapshots for history, row-level security, and paginated APIs. Avoid premature framework/backend rewrites.

**Non-negotiable data invariant:** no accidental changes to the 74 current MCQs, options, answer indices, explanations, mnemonics, source or topic. Preserve provenance and use automated fingerprints before/after migration. No browser localStorage of student-scoped historical records.

### Owner clarification on disposable testing history

Owner confirms no official enrolled students yet and accepts possible cleanup of **testing attempt history** if needed for a clean schema. This **is not blanket permission to delete staging or production rows now**. The safest first plan is additive and lossless anyway; if a reset is materially simpler, present precise tables/row counts, backup/rollback, dependencies and impact, then ask for separately scoped staging-only deletion approval. Never delete original source MCQs or production records.

## 3. Proposed next stage after this documentation — require owner approval

**First, produce the reviewed migration design and reversible SQL plan**, with exact mapping of 74 inline records and the minimum bank/metadata structure needed. Before modifying staging:
- [ ] Implement planned **one-bank-per-MCQ ownership (no cross-bank duplication)** in proposed import design and decide source-year parsing rules; keep premium course content off public question APIs.
- [ ] Compare generated database rows vs all source fields and original MCQ fingerprints. Record ID mapping, unique constraints, import idempotency and sequence reset if explicit IDs are inserted.
- [ ] Audit RLS/access for student content and marks; ensure authenticated admin writes cannot be forged by students. Don't expose privileged keys to clients.
- [ ] Run additive schema migration in **staging only after separate explicit approval**; verify expected tables/policies/counts and existing auth/history functionality.
- [ ] Import copies of original 74; validate exactly 74, all immutable fields, no duplicates, correct bank. No app switch yet.
- [ ] Implement a tested, controlled staged switch of the Create Test question source; preserve fallback and entire original bank until user acceptance. Verify Tutor, Timed, Results, mobile, multi-tab, user identity.
- [ ] Then design Stage 3B secure attempt-items and historical Review/Retake; after that, later Create Test filters, Analytics and Admin.

**No SQL migration, data deletion, GitHub application-source change or production work is approved or executed by writing this review.**
