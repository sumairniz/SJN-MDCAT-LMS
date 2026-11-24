# Student LMS → Management Panel Compatibility Audit

**Audit opened:** 24 November 2026 (Asia/Karachi)  
**Status:** IN PROGRESS — READ-ONLY SOURCE AND DOCUMENTATION AUDIT  
**Branch inspected:** `sjn-secure-content-publishing`  
**Repository:** `sumairniz/SJN-MDCAT-LMS`  
**Scope:** Establish the existing Student LMS journeys, data contracts and deferred capabilities that the Management Panel / Question Content Studio must respect.

## 1. Owner instruction and authority

The owner explicitly authorized the first step: a read-only technical audit of the existing Student LMS before finalizing the Content Studio design.

The owner explicitly clarified that **Claude's 11 points supplied on 24 November 2026 are external proposals only**. They are not owner instructions, approvals, finalized requirements or implementation authorization. Each point must be independently checked against existing product decisions, actual code/data structures and the owner's established design. A suggestion may be accepted, refined, rejected, deferred or returned for an owner decision only after that evaluation.

The owner also clarified that voice transcription may misrecognize technical words (for example, “LMS”). Interpret ambiguous terms in project context; ask only when a material contradiction remains.

## 2. Non-negotiable audit safety boundary

- Read-only inspection only.
- Do not modify Student LMS code, database, schema, RLS, Edge Functions, authentication, storage, deployments or production.
- Do not modify Management Panel application code or database during this audit.
- No Student LMS writes, migrations, releases or configuration changes.
- Preserve examination behavior, Test History, Results, Review, Retake, Analytics and Mistake Diary.
- The output is an evidence-based specification and compatibility report, not implementation approval.

## 3. Repository discovery and initial evidence

The active repository tree was retrieved from GitHub for branch `sjn-secure-content-publishing` at tree commit `209fc16d962beb2d3f18d10c6c7a0144c15c930a`. The tree contains 287 entries and includes both Management Panel source and Student LMS-facing source modules, database migrations, tests and handover records.

Student-facing source files identified for inspection include:

- `public/sjn-pastpapers.js`
- `public/sjn-courses.js`
- `public/sjn-history.js`
- `public/sjn-analytics.js`
- `public/sjn-mistakes.js`
- `public/sjn-phase4-preview.js`
- `public/sjn-phase4-results.js`
- `lib/mistake-diary.js`
- Student API and database migrations under `database/migrations/`

Relevant existing tests identified include:

- `tests/pastpapers-browser-ui.test.js`
- `tests/pastpapers-submission-catalog.test.js`
- `tests/courses-preview-ui.test.js`
- `tests/history-ui.test.js`
- `tests/practice-question-filters.test.js`
- `tests/student-analytics.test.js`
- `tests/student-analytics-render.test.js`
- `tests/mistake-diary.test.js`
- `tests/phase4-stage3-results.test.js`
- `tests/phase4-stage3b-submit.test.js`
- `tests/phase4-preservation.test.js`

This confirms the repository has relevant Student LMS source and tests available for read-only inspection; the audit must inspect them rather than relying only on previous chat summaries.

## 4. Initial source observations — preliminary, not final conclusions

### 4.1 Past Papers regional hierarchy

Direct inspection of `public/sjn-pastpapers.js` (blob SHA `b444b5a1d897a3855736c7dd28451137c190c11a`) confirms a region-first browser. The currently hard-coded category list is:

1. Sindh (`sindh`)
2. Punjab (`punjab`)
3. KPK (`kpk`)
4. Balochistan (`balochistan`)
5. Federal (`federal`)
6. NUMS (`nums`)

The module filters published papers by region, renders a regional collection, shows paper year/title/description/question count, and offers Tutor Mode and Timed Mode. It labels empty collections “Papers coming soon” and uses non-published sample cards as disabled examples. This is direct evidence of the current regional navigation implementation, not a claim that every region currently has live papers. The exact paper catalogue schema, API and launch/history integration still require inspection.

**Important precision:** The owner referred to regional past-paper collections including Sindh and Punjab. The current source additionally includes Federal and NUMS as categories; do not silently omit them or assume NUMS is a province.

### 4.2 Courses preview

Direct inspection of `public/sjn-courses.js` (blob SHA `bf028c477ff273f0a8e95e894e6ec61ae9b6cf27`) identifies a clearly labelled staging preview. Its source comment says Genome is the authenticated pilot and other sessions are illustrative; it reuses the existing exam, history and drafts rather than introducing an alternate scoring system. The visible source defines Genome, Early Mock and Final Sprint sessions, with explicit enrolled/locked and illustrative distinctions. Further inspection is required to establish the actual server-loaded Genome schedule, course access checks and test launch contract.

### 4.3 Test History

Direct inspection of `public/sjn-history.js` (blob SHA `8256375d234f97abca26de7107c577a903355b7d`) confirms a student-owned history view with source/mode/status/date filters, search, pagination, resume for in-progress drafts, and Results/Review/Retake actions for completed attempts. Review and Retake are disabled for old summary-only tests without preserved question-level details. The complete behavior and backend security contract must be reconciled against the Stage 3C handover and API implementation.

## 5. Relevant project records located

The repository contains the following primary references, to be read and reconciled with current source:

- `docs/SJN-LMS-MASTER-DEVELOPMENT-PLAN.md`
- `docs/SJN-PHASE4-STAGE3C-TEST-HISTORY-IMPLEMENTATION.md`
- `docs/SJN-CREATE-TEST-FILTERS-DECISIONS-2026-10-22.md`
- `docs/SJN-CREATE-TEST-STAGE4-QA-2026-10-23.md`
- `docs/SJN-CREATE-TEST-AUTOMATIC-CHAPTER-DISTRIBUTION-POLICY-2026-11-06.md`
- `docs/SJN-ANALYTICS-V1-HANDOVER-2026-11-05.md`
- `docs/SJN-MISTAKE-DIARY-V1-HANDOVER-2026-11-05.md`
- `docs/SJN-MISTAKE-DIARY-DESIGN-DISCUSSION-2026-11-05.md`
- `docs/SJN-AI-TUTOR-V1-HANDOVER-2026-11-03.md`
- `docs/SJN-MEDNEST-FF008-COURSE-ACCESS-READ-ONLY-AUDIT-2026-11-08.md`
- `docs/SJN-FUTURE-FEATURES-AND-DEFERRED-DECISIONS-REGISTER.md`

## 6. Claude's 11 proposals — current status

All 11 are **PROPOSED BY CLAUDE — NOT OWNER-APPROVED**. This audit will assess each independently. No item becomes a finalized requirement merely because it appears in the proposal. The assessment will distinguish:
- already implemented and verified;
- existing owner-decided behavior;
- partially supported;
- valid new Management Panel requirement;
- dependent on Student LMS changes (which are outside this audit's write scope);
- technically unsuitable or conflicting;
- deferred; and
- pending owner decision.

## 7. Audit work plan

1. Trace the complete Past Papers regional navigation, catalogue, paper identity, attempt launch, submission, results, review and history integration.
2. Trace Question Banks and Create Practice Test: modes, Subject/Chapter/Topic steps, filters, distribution, validation, Tutor/Timed behavior and question metadata.
3. Trace Courses & Sessions: actual Genome pilot versus illustrative sessions, course/test identity, access control, test metadata and history integration.
4. Trace Results, Review, Retake and Test History, including immutable question snapshots and revision handling.
5. Trace Analytics aggregation and display hierarchy; verify what is genuinely present when chapter/topic metadata is missing.
6. Trace Mistake Diary collection, categorization, review/mastery and question-option display.
7. Trace Student Report an Issue UI and determine whether submission/persistence/admin workflow exists.
8. Trace question and taxonomy schemas, source metadata, A–D/A–E handling, question identity, revision, retirement/deletion semantics, and release bridge.
9. Compare source findings with the deferred register and all relevant owner-approved records.
10. Produce a point-by-point assessment of Claude's 11 proposals and a corrected Content Studio compatibility specification.

## 8. Current checkpoint

- Audit opened and repository tree inspected.
- Past Papers region-first navigation verified at source level; six categories identified.
- Course preview and History source entry points inspected.
- Remaining journeys, database/API contracts and proposal assessments are **PENDING**.
- No code, database, configuration, deployment or Student LMS changes made.


## 9. Past Papers journey — deeper source verification (24 November 2026)

### 9.1 Browser/catalogue boundary — VERIFIED

Direct source and test inspection confirms `public/sjn-pastpapers.js` is a pre-attempt catalogue/browser only. Its own source comment states it does not create tests, publish questions or read PDFs; the authenticated existing exam renderer remains the only quiz interface.

- The catalogue receives its paper rows through `setPapers(rows)`; this browser module itself does not fetch or write data.
- It accepts only rows whose region is one of the six configured categories, whose ID is a safe integer, whose `mcqIds` is a nonempty array capped at 200, and whose title is a string.
- Region selection filters the supplied published-paper rows. A paper card displays its region, year, title, description and MCQ count.
- A paper's Start Paper control reveals Tutor Mode and Timed Mode choices. The delegated handler calls `window.SJNStartPublishedPaper(paperId, mode)` only when the selected paper still belongs to the active region.
- Empty regional collections show a disabled sample card clearly labelled not published; they cannot launch a quiz.
- No PDF viewer or PDF loading belongs to this browser module.

### 9.2 Existing exam launch reuse — VERIFIED AT TEST/HTML CONTRACT LEVEL

`tests/pastpapers-browser-ui.test.js` asserts that published-paper launch uses `window.SJNStartPublishedPaper` and the existing authenticated exam launcher (`launchGeneratedQuiz(questions)`), with a single consistent question bank for the selected paper. It explicitly rejects using the random Create Test draw for a published paper.

The source test also checks the six region cards, empty-state disabled examples, year-wise paper cards and Tutor/Timed choices. This is strong source/test evidence for the intended launch contract, but it is not a live authenticated end-to-end test of a real published paper in this audit.

### 9.3 Important distinction: question bank versus full-length paper

The Student LMS region-first Past Papers catalogue is a full-paper examination entry point. It must not be conflated with the separate Past Paper Question Bank used for practice-question selection and analytics. The Management Content Studio must preserve these as distinct destinations and their associations/provenance.

### 9.4 Remaining Past Papers verification

Still to inspect:
- `SJNStartPublishedPaper` full implementation and the exact source of `pastPapersList`.
- Server/API validation and catalogue source, including whether the catalogue is static, database-backed or assembled through a protected endpoint.
- The exact paper-to-MCQ association and order guarantees.
- Submission metadata/source tagging and how a full paper is identified in Results, Review, Retake, History and Analytics.
- Any mismatch between the UI's 200-question cap and actual backend/schema limits.
- Live staging evidence, if available read-only, without exposing or copying student personal data.

## 10. Additional confirmed Student LMS compatibility constraints

### 10.1 Four-option student rendering — VERIFIED IN EXAM SOURCE

The inspected exam renderer builds option labels from `ABCD`, and saved-attempt review validation requires exactly four options with a correct index in the range 0–3. The Management draft validator's optional Option E therefore cannot be assumed student-compatible. Any A–E release remains blocked until the complete student-side lifecycle is separately designed, approved, implemented and verified.

### 10.2 Report an Issue — UI exists; persistence explicitly inactive

The inspected `public/sjn-phase4-preview.js` opens a report dialog, requires at least one reason checkbox and accepts optional details. Its submit handler explicitly states that backend and authenticated report storage are deferred and displays: “Report submission is not active yet. Nothing has been sent or saved.” Thus a visible dialog is not evidence of a functioning reporting workflow. Claude's proposed Admin-side Student Reports workflow is a possible future extension, not an existing integrated feature.

### 10.3 No per-answer autosave

The same exam source comments that answers are not written during MCQ interactions. The existing Save & Exit flow persists an explicit student checkpoint; do not infer that every answer is autosaved. This is consistent with the owner's established no-autosave decision for student test-taking.

## 11. Evidence status after this pass

**Verified from source and tests:** six region categories; region-first navigation; catalogue-only responsibilities; disabled unpublished empty-state cards; Tutor/Timed choices; existing exam launcher handoff contract; separate full-paper versus question-bank concept; four-option saved review contract; Report an Issue UI currently does not persist; no per-answer writes.

**Not yet verified:** live paper records and exact catalogue API; complete full-paper attempt-to-history metadata chain; exact schema constraints and all source provenance; full server-side security and authorization for each journey; real live browser test with a published paper.

The audit remains **IN PROGRESS**. No application, database, configuration or deployment changes were made.


## 12. Create Practice Test — source and owner-policy audit (24 November 2026)

### 12.1 Existing student journey — VERIFIED

The current `public/index.html` wizard and `tests/create-test-stage2.test.js` establish the following behavior:

- Question bank is selected first; the current UI/test wording treats the SJN Question Bank and Past Papers Question Bank as separate sources.
- Practice scope choices include All Subjects, One or Multiple Subjects, Custom Quiz and Topic Drill (the internal scope IDs remain stable).
- All Subjects goes directly to Settings after loading all available subjects.
- One or Multiple Subjects goes from subject selection to Settings with all chapters.
- Custom Quiz permits one or more subjects, then an optional chapter selection; leaving chapters unselected means all chapters in the chosen subjects.
- Topic Drill requires at least one chapter, then proceeds to Topics, then Settings. Science topics must be explicitly selected and are scoped to the selected chapters. Changing chapters on Back removes now-stale topic selections.
- English and Logical Reasoning are explicitly treated as single-level categories: the selected chapter is also the topic; the UI shows an explanatory note and no extra topic checkboxes. No nested topic selection is required.
- Only subjects, chapters and topics present in the loaded published MCQ pool are offered. Empty subject/chapter lists do not get fabricated chapter cards.
- The requested question count starts blank for ordinary new tests; invalid/blank values are rejected rather than silently defaulted to one.
- Tutor and Timed modes use the shared exam launcher. Retake uses the saved verified question order instead of a new random selection.

### 12.2 Metadata behavior and Claude proposal #1 — PARTLY CORRECT / NEEDS REFINEMENT

**Verified current behavior:** Question selection and filtering use `bank`, `subject`, `chapter` and `topic` values from the loaded MCQ records. Science Topic Drill uses explicit subject+chapter+topic selection. English/Logical Reasoning are single-level, with the chapter acting as the topic in the student experience. The test fixtures include both `topic:null` and `topic:'Verb'` examples for English, so the current contract does not require a duplicate topic value to be populated for every flat-category question.

**Assessment:** Claude is directionally right that metadata must reflect the subject's actual syllabus structure, and that courses/papers may have different metadata rules. But the proposal to always show one selection that fills both chapter and topic for English/Logical Reasoning is not established as the existing data contract; the student tests explicitly permit `topic:null`. Requiring both fields or backfilling duplicates could alter analytics, source records or existing questions. Do not implement this rule without inspecting actual stored rows and analytics aggregation, then presenting the owner with a precise mapping decision.

**Status:** PROPOSED BY CLAUDE; partially supported by current UX; exact persistence/analytics rule PENDING DATA AND ANALYTICS AUDIT; NOT OWNER-APPROVED.

### 12.3 Missing metadata and placeholder values — CONFLICT FOUND / FURTHER AUDIT REQUIRED

The current student selection functions contain fallback expressions `q.chapter || 'General Chapter'` and `q.topic || 'General Topic'` when constructing selection keys and displaying topic choices. However, the same source also has a comment and behavior to omit empty chapter headings and tests that reject showing a fabricated “General Chapter” in the chapter selector. English/Logical Reasoning null-topic cases are deliberately valid and have no extra topic choice.

Therefore Claude's absolute proposal “never use General Topic/General Chapter” is too broad as written: fallback labels exist internally in the selection key logic, while visible UI behavior is more selective. The data, rendering and analytics consequences have not yet been traced. In particular, the phrase “General Topic” may be an internal fallback key rather than a visible analytics category.

**Status:** PROPOSED BY CLAUDE; PARTIAL SOURCE CONFLICT; PENDING DATA/ANALYTICS TRACE. Do not remove or migrate fallback semantics until all consumers are mapped.

### 12.4 Filter rules — OWNER-APPROVED AND VERIFIED

The owner-approved 22 October filter decision record and current code/tests establish:

- Five multi-select filters: Unused (default), Incorrect, Skipped, Marked and Correct. There is no Used filter.
- OR/union semantics across selected filters, deduplicated by stable MCQ identity.
- Correct/Incorrect/Skipped use the student's latest completed attempt for that question; Skipped means unanswered in the latest completed attempt.
- Marked is an independent persistent bookmark state.
- Unfinished drafts do not change Unused or Skipped classification.
- Filter history is read from authenticated, user-scoped immutable `attempt_items` and bookmarks. It does not infer from old score-only records or draft answers.
- The status API is authenticated, paginated (1,000 rows per page), rejects incomplete/unverifiable reads and returns 503 rather than silently classifying incomplete history.
- The UI fails closed until history is verified; an explicit retry is available. Account switches invalidate pending results to avoid cross-account leakage.
- Direct course/past-paper/retake/resume entry points bypass normal Create Test filters as appropriate.

References: `docs/SJN-CREATE-TEST-FILTERS-DECISIONS-2026-10-22.md`, `lib/practice-question-status.js`, `server.js` (`/api/practice/question-status`), `tests/practice-question-filters.test.js`.

### 12.5 Automatic chapter distribution — OWNER-AGREED POLICY, IMPLEMENTATION NOT VERIFIED HERE

The owner-approved policy document dated 6 November 2026 states that multi-chapter Create Practice Test must use automatic distribution only; no Custom Distribution controls. It must be balanced but meaningfully weighted by overall published eligible MCQ inventory per selected chapter, while never bypassing the student's chosen filter. If a chapter cannot fill its target, use only genuinely eligible questions and redistribute the remainder to other selected chapters when feasible. If the combined eligible pool cannot meet the requested total, explain the limitation honestly. The exact weighting/rounding algorithm and implementation remain documented as not yet implemented in that policy.

This is a binding owner-agreed product rule, but the current active branch's allocator implementation has not yet been fully traced or tested against the 6 November policy. Do not infer implementation merely from the existence of the policy or from generic random shuffle logic.

Reference: `docs/SJN-CREATE-TEST-AUTOMATIC-CHAPTER-DISTRIBUTION-POLICY-2026-11-06.md`.

### 12.6 Question identity, revision and option constraints — VERIFIED AT VALIDATION BOUNDARY

- The student launcher refuses to start if loaded questions lack valid positive revision IDs.
- The submission validator accepts a maximum of 200 questions, requires unique MCQ IDs and positive revision IDs, and only accepts selected answer indices 0–3 (A–D).
- Saved manual drafts also cap at 200, require unique MCQ and revision IDs, and accept answer indices 0–3.
- The selected test's question identities and revisions are carried into the explicit submission/draft payload; the browser does not supply the answer key or score as trusted grading input.
- Retake validates that the selected historical questions are canonical objects from the currently loaded bank and preserves their saved order.

References: `lib/practice-submission.js`, `lib/practice-drafts.js`, `tests/phase4-quiz-launch.test.js`.

### 12.7 Claude's metadata/taxonomy proposals — interim classification

| Claude proposal | Interim evidence-based assessment | Status |
|---|---|---|
| #1 Subject/Chapter/Topic required rules by subject and destination | Science hierarchy and flat English/Logical Reasoning behavior partly verified; destination-specific storage rules not yet verified | PARTLY CORRECT / PENDING DATA AUDIT |
| #2 No General Chapter/General Topic or Unspecified | Visible UI and internal fallback-key behavior differ; absolute rule is too broad | PARTIAL CONFLICT / PENDING ANALYTICS TRACE |
| #3 Taxonomy controlled only by approved Syllabus & Taxonomy; no spreadsheet auto-create; duplicate detection/merge | Not yet verified against actual Management taxonomy and Student data/analytics dependencies | PENDING TAXONOMY AND SCHEMA AUDIT |
| #4 Retire instead of delete; attempted question must not be hard-deleted | Stable historical question/revision identity is established, but actual retirement/deletion semantics and FK protections not yet inspected | PENDING SCHEMA/REFERENCE AUDIT |
| #5 Structured source provenance (exam/board/year/paper code) | Student records carry a source string in the exam UI and paper-specific selection metadata exists; exact schema and course/full-paper inheritance not yet verified | PARTLY SUPPORTED / PENDING SOURCE CONTRACT AUDIT |
| #6 Option E | Conflicts with verified four-option exam and saved-review contracts; cannot be released today | NOT STUDENT-COMPATIBLE / RELEASE BLOCKED |
| #7 Empty destinations / phased rollout | Student course area is a staging Genome pilot plus illustrative content; Full-Length Papers have empty-state samples. Management-side destination readiness remains to be audited | PARTLY SUPPORTED / PENDING MANAGEMENT MODULE AUDIT |
| #8 Question order and expected-vs-uploaded count | Paper and attempt order are important, but exact management publishing/count contract not yet audited | PENDING |
| #9 Student preview must exactly match student view | Existing student rendering contract is available; exact Management preview parity has not been verified | VALID GOAL / PENDING RENDERER AUDIT |
| #10 Student Reports workflow | Student Report Issue UI exists but explicitly does not submit or persist; Admin workflow is new future work | FUTURE PROPOSAL / NOT EXISTING |
| #11 Existing models and Student-side support matrix | Required outcome of this audit; not yet complete | AUDIT DELIVERABLE / IN PROGRESS |

## 13. Next audit areas

1. Trace the actual MCQ loading/API query and source database schema for both banks, including source fields, chapter/topic nulls and current revisions.
2. Trace analytics grouping for missing/flat metadata and verify whether General Chapter/General Topic can become visible categories.
3. Inspect Syllabus & Taxonomy management implementation, taxonomy persistence and duplicate/rename/move/delete impact.
4. Inspect actual question/paper/course associations, retirement/deletion semantics, historical references and source provenance.
5. Continue with Courses & Sessions and their course-test manifests/access policy, then Results/Review/Retake/History and Mistake Diary.
6. Complete the point-by-point 11-proposal assessment and prepare a corrected compatibility specification for owner review.

**Checkpoint:** This is a source-level and owner-document reconciliation, not a live student account end-to-end test or a fresh database inspection. No Student LMS code, database, configuration, Management Panel application or deployment was changed.


## 14. Owner clarification — current student taxonomy values are temporary (24 November 2026)

The owner clarified that the chapter names and topic names currently visible in the Student LMS are **TEMPORARY TEST DATA**, not the final approved syllabus taxonomy. The small number of student accounts used so far are the owner's own test accounts, created to test the examination system and student experience. The currently visible chapter/topic names must therefore not be treated as authoritative syllabus names, approved taxonomy, or a final content model.

Consequences for this audit and Management Panel integration:
- Do not use currently visible chapter/topic labels as the canonical syllabus list.
- Do not infer that the current taxonomy is complete, approved, or representative of the final course/syllabus structure.
- Audit the technical shape of taxonomy storage, references, validation, analytics grouping and historical snapshots separately from the correctness of the labels.
- Treat current Student LMS chapter/topic records and labels as temporary test fixtures unless the owner later identifies particular records as approved.
- The Management Panel should ultimately provide the controlled source of approved taxonomy, but the exact upload/approval/propagation workflow remains to be designed and owner-approved.
- Existing student test accounts and their test attempts are not a reliable source for deciding the final academic taxonomy.
- This clarification supersedes any earlier assumption in this audit that current visible chapter/topic names represent the final academic syllabus.

**Status:** OWNER CLARIFICATION — RECORDED; taxonomy labels TEMPORARY; technical data-model audit may continue read-only.

## 15. Next audit checkpoint — taxonomy/data contract

The next pass will focus on the technical data model rather than judging temporary labels. It will inspect repository migrations, server routes, query helpers and tests to establish:
- where subjects, chapters and topics are stored or denormalized;
- whether they are plain text, IDs, foreign keys, JSON, or a combination;
- how MCQs reference taxonomy and what is required/nullable;
- how taxonomy changes affect attempts, revisions, analytics and saved question snapshots;
- whether paper/source metadata is structured or free text;
- whether question deletion/retirement is supported and how references are protected.

No live database writes or schema changes are authorized.


## 16. Technical data-contract audit — source migrations and server (24 November 2026)

### 16.1 Owner's temporary-taxonomy clarification applied to interpretation

The current visible chapter/topic values are test data and cannot be used as the final approved syllabus. The findings below describe the technical contract and historical test implementation only; they do not endorse the current labels.

### 16.2 Published question payload — VERIFIED IN SERVER SOURCE

`server.js` loads all published `mcqs` through `readAllPublishedMcqs`, reads `courses` and `past_papers`, and returns:
- bank, subject, chapter and topic;
- question, options, correct index;
- current revision ID;
- explanation, mnemonic and source;
- course records with `chapters_json` exposed as `chapters`;
- full-paper records with `mcq_ids_json` exposed as `mcqIds`.

The public payload normalizes null chapter/topic/source/explanation/mnemonic values to empty strings. It rejects an incomplete published-question/revision read rather than returning a seemingly valid empty catalogue. This is the server payload shape, not a final Management Panel write contract.

### 16.3 Question metadata storage and revisions — VERIFIED IN MIGRATION SOURCE

The Stage 3B question-history migration defines immutable `mcq_revisions` snapshots with:
- `mcq_id` identity linked to `mcqs(id)` using `ON DELETE RESTRICT`;
- revision number, bank, subject, nullable chapter, nullable topic, nullable source;
- question text, JSON options, correct index, explanation and mnemonic;
- exactly four options and A–D correct index;
- unique revision number per MCQ and unique (MCQ, revision) identity.

It adds `mcqs.current_revision_id` with a composite FK to the revision belonging to that same MCQ and `ON DELETE RESTRICT`. Revision UPDATE and DELETE are blocked by an immutability trigger. This supports the safety direction behind preserving history, but it does not prove that an MCQ retirement/archival workflow exists.

**Important migration caveat:** The retrieved `20261018_stage3b_question_history_foundation.sql` explicitly labels itself “REVIEW ONLY, NOT EXECUTED” and says separate owner approval is required. Therefore the migration text proves the designed schema, not by itself the live staging schema. Later migrations and source code reference these objects, but a live read-only schema check is still needed to prove current deployment state.

### 16.4 Attempt history preserves question revision and order — VERIFIED IN MIGRATION/RPC SOURCE

The designed `attempt_items` records retain attempt ID, user ID, position, MCQ ID, MCQ revision ID, selected option and correctness. They enforce unique question identity per attempt and reference the immutable revision with `ON DELETE RESTRICT`. The published-paper submission RPC validates the current revision and derives the answer key server-side; it does not trust browser-supplied keys, question text or score. Submission supports up to 200 questions, four answer positions A–D, and Tutor/Timed modes.

This makes immutable revision history and stable question identity essential Management Panel compatibility requirements. Editing an existing published question must create a new version rather than mutate historical snapshots.

### 16.5 Taxonomy is currently text-based in question/revision records — VERIFIED IN MIGRATION SOURCE

The inspected revision migration stores `bank`, `subject`, `chapter`, `topic` as text columns; `chapter`, `topic` and `source` are nullable. No chapter_id/topic_id foreign-key relationship is defined in this migration. This does not exclude a separate syllabus taxonomy table elsewhere; a complete repository search and live schema check remain necessary.

**Implication:** Do not assume the Management Panel can safely rename/merge a taxonomy node by updating a normalized foreign-key row. In the inspected historical question model, taxonomy labels are embedded in each revision snapshot. A canonical taxonomy layer would be a new controlled relationship or mapping and must preserve historical labels and analytics semantics.

### 16.6 Analytics semantics — VERIFIED IN MIGRATION SOURCE

The student Analytics RPC:
- reads only completed attempts with `details_version=1`;
- joins attempt items to the immutable MCQ revision for historical question metadata;
- groups by source type, bank, subject, chapter and topic;
- normalizes null/blank chapter and topic to empty strings in grouping;
- explicitly suppresses topic for Course Tests;
- distinguishes SJN Question Bank, Past Papers Question Bank, full MDCAT paper source and courses;
- derives bank catalog, lifetime coverage, period coverage and per-course-test breakdown.

Thus the current analytics grouping is based on revision-snapshot labels for attempt facts, not simply the current editable MCQ row. The visible display treatment of empty groups still requires frontend inspection. Temporary taxonomy values in the current small test account must not be promoted into the final taxonomy.

### 16.7 Mistake Diary source and grouping — VERIFIED IN MIGRATION/SERVER SOURCE

Mistake Diary V1 is based on genuinely saved incorrect answers in verified question-level attempts. It selects the latest wrong response per student/MCQ, joins the exact revision snapshot, and exposes the four-option question and answer state. Student annotations use four categories (`information`, `conceptual`, `silly`, `retention`) and review statuses. The catalog groups bank mistakes by subject/chapter, course mistakes by course test, and full-paper mistakes by paper title. Course and paper grouping intentionally does not use the bank subject/chapter tree.

The annotation table's MCQ foreign key uses `ON DELETE CASCADE`, while attempt items and revision references use restrictive links. This is an important cross-feature dependency: hard deletion could remove student annotations even if immutable historical attempt/revision rows restrict deletion. A real retirement policy and deletion protection must be designed only after live schema verification and all references are inventoried.

### 16.8 Claude proposal status updated by this pass

- **#1 metadata:** The historical question/revision schema confirms text fields and nullable chapter/topic/source. Science-vs-flat subject semantics remain tied to temporary test labels and must not become final taxonomy rules. PARTLY VERIFIED; FINAL MAPPING PENDING OWNER SYLLABUS.
- **#2 placeholders:** Server normalizes nulls to empty strings; Analytics groups null/blank as empty strings; internal wizard fallback labels are a separate UI selection concern. Do not create visible “General Topic” taxonomy from these defaults. FINAL UI treatment pending full frontend audit.
- **#3 taxonomy:** No taxonomy IDs/foreign keys were found in the inspected question/revision migration. Controlled canonical taxonomy is a plausible Management Panel responsibility but requires a new design; current storage does not prove an existing taxonomy module contract.
- **#4 retire vs delete:** Revisions and attempt references are restrictive; annotations cascade from MCQ deletion. Retirement is a reasonable safeguard but not yet an existing verified capability.
- **#5 provenance:** Revision has nullable free-text `source`; paper catalog carries region/year/title and ordered MCQ IDs. Structured provenance is not proven as an existing normalized source schema.
- **#6 Option E:** Four-option constraints confirmed at question revision, attempt submission, review and Mistake Diary boundaries.
- **#8 order/count:** Paper MCQ ID arrays and attempt-item positions preserve ordered question identity; UI expected-vs-uploaded content-management controls remain unverified.
- **#11 model support:** Current question/revision/attempt/analytics/Mistake Diary contracts are now partially mapped; live schema and remaining source modules are still needed.

### 16.9 Critical limits of this checkpoint

This is repository-source and migration-text inspection only. No database connection was used and no migration was run. The migration's own “REVIEW ONLY, NOT EXECUTED” status means live deployed schema must not be inferred from migration text. Temporary student taxonomy labels remain excluded from final academic decisions.

No Student LMS code, data, database, configuration, Management Panel application or deployment was changed.


## 17. Courses & Sessions — owner screenshots and source audit (24 November 2026)

### 17.1 Owner-supplied Student LMS screenshots — direct UI evidence

The owner supplied four screenshots showing:
1. My Courses landing page: two enrolled sessions (Genome Test Session 2026 and Early Mock Session) and one explore/locked session (Final Sprint Mock Series). The banner explicitly says this is a staging testing environment, Genome tests are real, other sessions are illustrative and production is unchanged.
2. Genome session page: 100-test plan, progress indicator, filters All / Available / Unattempted / Upcoming / Completed, and a list of session tests with title, MCQ count, subject, completion and availability.
3. Genome session Details → Schedule modal: schedule entries are numbered, with test title, test type, subject, date, MCQ count and duration where available. The schedule describes Tests 01–100 as an academic plan independent of availability and student progress. Tests 01–03 are shown without dates; subsequent entries are dated.
4. A specific test detail page: test overview (question count, duration, availability, scheduled/available-anytime label, subject, attempt status, last completed result, selected mode, retake action) alongside a separate Test Syllabus panel showing subject and chapter.

These screenshots corroborate the staging-only distinction and the visible student journey. They do not prove database contents, enrollment security or production behavior.

### 17.2 Current source implementation — Genome versus illustrative sessions

Direct inspection of `public/sjn-courses.js` (blob SHA `bf028c477ff273f0a8e95e894e6ec61ae9b6cf27`) confirms:
- Three session cards are defined in the client: Genome, Early Mock, Final Sprint.
- Genome is the only session loaded from the authenticated live course-test API. Early Mock and Final Sprint have hard-coded illustrative test data.
- The UI itself labels Genome as the authenticated pilot and the other sessions illustrative; it warns “Production unchanged.”
- The Genome schedule file `public/sjn-genome-schedule.js` contains 97 planned rows (tests 04–100). The UI combines these planning rows with uploaded/published tests 01–03 to display a 100-test plan. A schedule row is not itself a published/launchable test.
- Session cards show enrollment state, progress, session details and schedule. Genome test list filters All, Available, Unattempted, Upcoming and Completed.
- Test detail view shows overview and syllabus separately, including MCQ count, duration, availability, date, subject, attempt status, latest completed result and Tutor/Timed selection.
- A saved in-progress draft resumes in its original mode; a completed test can be retaken through the existing History attempt flow.
- The test syllabus renderer shows a “Full Syllabus” state for full-syllabus tests; otherwise it groups chapter labels under subject headings. These displayed chapter labels are temporary test data per the owner's clarification, not final taxonomy.

### 17.3 Authenticated course-test API and student ownership — VERIFIED IN SERVER SOURCE, LIVE STATE NOT RECHECKED

`server.js` exposes authenticated `GET /api/course-tests`. It reads published rows from `sjn_course_tests` for session code `genome`, and reads the requesting user's attempts and drafts with explicit `user_id = authenticated user` filters. It calculates course completion from server-saved attempts, distinguishes independent History retakes from course-progress-eligible attempts, and lets a newer manual Save & Exit draft coexist with the last completed result.

The response includes stable course-test ID, test number/title, subject/chapter, duration, availability, ordered MCQ IDs, syllabus JSON, latest result and resumable draft metadata. The endpoint validates that every published test has a valid nonempty MCQ ID array of at most 200 items. It returns 503 if catalogue, attempt or draft reads cannot be verified.

The browser bridge uses the same authenticated exam engine and History APIs for start, resume, result and retake. The course test selection carries `courseTestId` and `courseProgressEligible` into the shared submission flow. This is not a separate scoring/history engine.

### 17.4 Critical access-control caveat — existing FF-008 blocker remains

The existing 8 November read-only audit documents that the staging `mcqs` table had an anon SELECT policy and that course enrollment/entitlement enforcement was not established at the table level. The current source has an authenticated course-test catalogue endpoint, but this does not by itself prove that restricted MCQ rows and answer keys cannot be fetched through other direct readers.

Therefore:
- Do not assume that the UI's “Enrolled” / “Locked” badges are security enforcement.
- Do not treat the current Genome pilot as a production-ready enrollment/paid-access model.
- The earlier FF-008 finding remains a production release blocker for restricted/premium course content until a complete current read-only API/RLS/grants audit and owner-approved access policy are completed.
- Do not revoke current public MCQ access or change RLS as part of this design audit; doing so could break existing student readers.

### 17.5 Management Panel implications

The Management Panel's eventual Courses & Sessions module must represent at least:
- session identity, title, description, type, dates/duration, enrollment/access state;
- ordered test manifests, each with stable test identity/number, title, test type, subject, schedule/availability, MCQ count and duration;
- subject/chapter syllabus mapping or a Full Syllabus designation;
- exact ordered MCQ associations and publication state;
- student attempt/progress integration using the existing courseTestId contract;
- separation between a planned schedule entry and a published/launchable test;
- distinction between the real Genome pilot and illustrative sessions in current staging.

The exact authoring workflow and future course entitlement model remain pending owner design and security verification. Temporary chapter/topic labels must not be adopted as canonical taxonomy.

### 17.6 Claude proposal assessment update

- **#1 destination-specific metadata:** Course test UI currently exposes subject and syllabus chapter groups; exact production taxonomy is temporary. Management needs a course-test manifest model, but mandatory/optional Chapter/Topic rules cannot be finalized from these test fixtures.
- **#7 empty destinations/phased rollout:** The screenshot and source confirm Early Mock/Final Sprint are illustrative and Genome is the real pilot. The proposed rollout order is reasonable as a planning option, not an owner decision.
- **#8 ordering and counts:** Strongly supported as a real requirement: the student UI shows numbered tests and question counts; server manifests carry ordered MCQ IDs; 97 schedule-only entries are not published tests. Management must distinguish planned, uploaded/published, available, completed.
- **#9 student preview:** Screenshot provides a concrete preview contract for course tests, including overview and syllabus. Exact visual parity remains a future acceptance test.
- **#11 existing model support:** Genome has an existing authenticated API and shared exam/history integration; other displayed sessions are illustrative client-side fixtures, not complete live course authoring/enrollment support.

### 17.7 Remaining verification for Courses

- Inspect actual current staging tables, constraints, RLS and grants read-only; migration/source text alone is insufficient.
- Confirm the live catalogue row count, published states, MCQ manifest order and schedule-vs-publication relationship without exposing student personal data.
- Inspect exact server-side course launch and submission validation, including entitlement enforcement and access bypasses.
- Compare Analytics and Mistake Diary treatment of course tests.
- Verify the live course API response and UI with a test account only if authorized, avoiding student PII.

**Checkpoint:** Screenshots and repository source corroborate the current Genome staging pilot. They do not establish production readiness or secure paid enrollment. No Student LMS code, database, configuration or deployment was changed.


## 18. Owner clarification — Courses & Sessions are dynamic, owner-created (24 November 2026)

The owner clarified that course sessions are **not a fixed permanent catalogue**. The owner must be able to create and launch new sessions at their discretion through the Management Panel. Examples include a March Session, February Session, Mock Session, or other future session names/types. Each new session may contain its own tests uploaded/managed through the Admin/Management Panel. The number, names, timing and launch of sessions are owner-controlled and must not be hard-coded to the current Genome / Early Mock / Final Sprint examples.

This clarification is consistent with the product direction previously discussed: the Management Panel is the control centre for academy sessions and their tests. The current Genome UI is a pilot/example of the student-facing experience, not the permanent limit or canonical list of sessions.

**Required product model (direction recorded; detailed implementation still pending):**
- Admin can create, edit, schedule, publish/launch, close/archive and manage multiple sessions over time, subject to future permission and lifecycle design.
- Session identity must be stable and separate from its display name; changing a label must not break historical attempts.
- Each session owns an ordered collection of test entries/manifests. Tests may be planned before content is uploaded; a planned schedule item must not appear launchable until the actual test is published and eligible.
- The student My Courses page should derive its session cards and enrolled/available/locked presentation from the managed session catalogue and the student's access/enrollment state, not hard-coded client fixtures.
- Session types and naming examples are illustrative, not an exhaustive fixed enum. Exact fields, lifecycle statuses, enrollment policy, and whether old sessions remain visible/archived require later design and owner review.
- Preserve existing Genome course-test IDs, attempt history and progress linkage when transitioning from pilot data to a dynamic catalogue. Do not replace IDs or rewrite student attempts.
- The owner confirms the existing visible chapter/topic labels in the pilot remain temporary test data; they are not final syllabus taxonomy.

**Status:** OWNER CLARIFICATION / PRODUCT DIRECTION RECORDED. Dynamic session authoring is a required Management Panel capability; schema and implementation details remain pending technical design and owner approval.

## 19. Results, Review, Retake and Test History — source audit checkpoint (24 November 2026)

### 19.1 Test History frontend — VERIFIED

Inspected `public/sjn-history.js` (blob SHA `8256375d234f97abca26de7107c577a903355b7d`) and `public/sjn-history.css` (blob SHA `0ff854ae12cd185eb2e94df384e4b578ce6dfbe1`).

The Test History interface:
- lists own-account tests with title/date, subjects, mode, score/accuracy and status;
- shows in-progress drafts separately with answered/total progress and Resume;
- supports search, source, mode, status and date sorting filters;
- uses 25-row pagination;
- provides Results, Review and Retake actions for completed tests;
- disables Review/Retake for summary-only historical tests whose individual questions were not recorded;
- shows a read-only question review with numbered navigation, answer filters, original selected answer/correct answer, explanations and mnemonics where present;
- preserves own-account history and does not restyle the approved live MCQ examination interface.

### 19.2 Historical question fidelity — VERIFIED IN SOURCE AND DESIGN RECORD

For detailed attempts, History retrieves the saved attempt and its question items/revision snapshots. Review renders the saved question/answer data, not the current mutable MCQ as a replacement. This is essential: Management Panel edits must not alter what a student sees when reviewing an older attempt.

Older summary-only attempts remain visible with their original score/date, but individual-question Review and Retake are unavailable. The UI explicitly explains that those questions were not recorded. Do not fabricate question history or silently remove those old attempts.

### 19.3 Retake semantics — VERIFIED IN HISTORY SOURCE / HISTORICAL OWNER-APPROVED DESIGN

History only launches Retake if the attempt is question-level detailed and the server payload marks retake available. It sends the saved ordered question identity payload through the existing retake launch bridge. The Stage 3B owner-approved design states that Retake creates an independent new attempt with the same MCQ IDs in exactly the same order; the original result remains untouched.

Retake must remain an independent attempt, not an overwrite or reset of the original attempt. Course-test progress eligibility and independent History retakes must remain distinguishable as established in the Genome course flow.

### 19.4 Results and review integration — VERIFIED IN SOURCE / HISTORICAL ACCEPTANCE RECORD

The Results screen's Review Answers and Retake Test actions are gated until a saved attempt is verified. Test History can reopen a detailed saved result through the existing Results renderer; otherwise it displays a historical detail view. A previously documented Results → Review → Results disabled-button regression was fixed and owner-confirmed in the historical Stage 3C record. This audit does not claim a fresh browser regression run on the current branch.

### 19.5 Critical compatibility requirements for Management Panel

- Editing a published MCQ must create a new immutable revision; never rewrite revisions already referenced by attempt items.
- Preserve stable MCQ IDs, revision IDs, ordered attempt items, selected answers, correctness and elapsed-time facts.
- Do not hard-delete a question/revision referenced by attempts or bookmarks; retirement/archival needs a separate lifecycle and verified referential safeguards.
- A new revision must not change historical Results, Review, Retake source content or Mistake Diary records for older attempts.
- For Retake, the existing original ordered item set must remain reproducible even if the current question has since been edited or retired.
- Course test identity and progress eligibility must remain intact; an independent Retake must not silently count as a scheduled course completion unless existing server rules explicitly say so.
- Management Panel should show reference impact (“used in” tests/papers/courses/attempts) before destructive or scope-changing operations, but exact UI/permissions remain proposed pending owner approval.

### 19.6 Remaining verification limits and screenshot request

This checkpoint is based on current repository source and historical implementation/acceptance records. It is not a fresh live two-account security test, not a current live database schema verification, and not a new browser regression run.

To verify the real visual flow against source, owner screenshots are still useful for:
1. Results screen after completing a test (including the action buttons and performance insights);
2. Review Answers screen with one correct, one incorrect and one skipped question if available;
3. Test History list and one opened historical review;
4. Retake launch screen or first question after starting a retake.

Screenshots should avoid exposing email addresses or other personal information. They are optional if the owner prefers the audit to remain source-only.

### 19.7 Claude proposal assessment update

- **#4 retire instead of delete:** Strongly supported as a safety direction by immutable revision and attempt references, but no complete owner-approved retirement feature is verified.
- **#8 ordering and counts:** Attempt item position and saved course manifests make order a strict invariant, not a cosmetic preference.
- **#9 student preview:** Must reflect the versioned question shown at the time of the attempt, as well as current destination-specific rendering; preview acceptance should be checked separately.
- **#11 model support:** Results/Review/Retake/History have an established question-level version contract. The Management Panel must integrate with it rather than create a competing history or scoring pipeline.

**Checkpoint:** Source-level Results/Review/Retake/History compatibility requirements recorded. No Student LMS code, database, student records, Management Panel application or deployment was changed.


## 20. My Analytics — source and regression-test audit (24 November 2026)

### 20.1 Student-facing information architecture — VERIFIED

Inspected `public/sjn-analytics.js` (blob SHA `b7221ee3e6f45049095f7ba210f549ef69d72abc`) and `public/sjn-analytics.css`. Four top-level sections are implemented:
- Overview
- Question Banks
- Courses
- Past Papers

The source catalog distinguishes SJN Question Bank, Past Papers Question Bank, My Courses and Full-Length Past Papers. This is an important distinction: Past Papers Question Bank is a practice bank with subject/chapter/topic drill-down, while Full-Length Past Papers is an exam/paper-level destination.

Date filters include All Time, Last 24 Hours, Last 7 Days, Last 15 Days, Last 30 Days, Last 90 Days, Previous Month and Custom Range. The client validates date range input, passes timezone offset, caches up to five period results in memory for 90 seconds, and clears cache/state on account change. It does not use localStorage/sessionStorage for Analytics data.

### 20.2 Metrics and hierarchy — VERIFIED IN SOURCE

- Overview distinguishes total answered instances from unique answered MCQs; skipped items remain separate. Unique answered counts distinct MCQ IDs with an actual selected answer, not skipped-only appearances.
- Bank views support Subject → Chapter → Topic, with available question-bank catalog counts and distinct coverage information.
- The strength classification requires at least 15 answered items before labelling performance Strong / Developing / Needs attention; smaller samples are treated as More practice needed. This is a display evidence threshold, not an exam readiness prediction.
- Course analytics are separated by individual course test/attempt and provide subject/chapter breakdowns. Independent retakes are not merged into a single managed course result.
- Full-Length Past Papers are presented at paper level with region/year/catalog identity, not as question-bank topic drill-down.
- Daily trends aggregate counts into date buckets; they are not predictive readiness estimates.

### 20.3 Backend and data integrity — VERIFIED IN SOURCE

`server.js` exposes authenticated, read-only `GET /api/student-analytics`, sets private/no-store response caching, validates date/time inputs and invokes `sjn_student_analytics`. The response is tagged with the authenticated user ID; the client rejects a mismatched identity or incomplete summary.

The inspected SQL migration defines an authenticated SECURITY INVOKER function scoped to `auth.uid()`, using detailed attempts (`details_version=1`), attempt items and immutable MCQ revisions for historical outcomes. It returns aggregated results rather than student attempt rows. Summary-only legacy attempts are counted separately and are not assigned invented question-level answers.

Important limitation: migrations and source describe the intended database function/policies, but this audit did not execute a fresh live read-only schema/RLS/grants check. The Analytics handover documents earlier staging-only application and a staging QA sample; that is historical evidence, not proof of the current live state.

### 20.4 Test coverage — VERIFIED IN REPOSITORY

`tests/student-analytics.test.js` and `tests/student-analytics-render.test.js` cover source separation, date periods, 15-answer evidence threshold, account isolation/cache reset, authenticated read-only API, SECURITY INVOKER/auth.uid SQL, total-vs-unique semantics, mobile layout and runtime rendering/navigation. Test files were inspected; this audit did not run the CI suite or perform a new browser/device test.

### 20.5 Management Panel implications

- Keep the two Past Paper destinations distinct in editor and analytics metadata.
- Do not force topic-level analytics for courses; current contract is course test → subject/chapter breakdown.
- Do not treat current pilot chapter/topic strings as final syllabus taxonomy. They are temporary test data per owner clarification.
- Preserve stable MCQ identity and immutable revision history for all analytics outcomes.
- Course session/test analytics must resolve from the owner-managed dynamic session/test catalogue in future, rather than assuming Genome is the only session.
- Any future taxonomy rename/merge must be evaluated for historical grouping effects. The analytics implementation groups historical records using revision metadata and catalog/coverage joins; live database behavior and version handling require a dedicated schema check before implementation.
- Do not add extra counts, filters or analytics dimensions beyond approved existing behavior without owner approval.

### 20.6 Claude proposal assessment update

- **#1 metadata rules:** Analytics supports distinct bank and course/paper source semantics, but it does not justify finalizing required/optional Chapter/Topic rules for all destinations. Existing pilot labels remain temporary.
- **#2 missing chapter/topic:** The UI/source treats blank grouping values distinctly in several contexts; no universal “General Topic” canonical taxonomy rule should be adopted without checking all renderers and current data. Keep as pending assessment.
- **#3 strict taxonomy:** The need for a centrally managed taxonomy is consistent with the product direction, but duplicate detection/merge rules and impact workflow are not implemented or owner-approved by this audit.
- **#8 ordering/counts:** Analytics uses ordered attempt items and separate per-test breakdowns; preserve these identities and metrics.
- **#11 existing support:** Existing analytics covers the four destinations and the above metrics, but dynamic future session authoring and final taxonomy management are not established by the Analytics module.

## 21. Mistake Diary — source, schema and regression-test audit (24 November 2026)

### 21.1 Owner-accepted student experience — VERIFIED AGAINST SOURCE AND HISTORICAL OWNER ACCEPTANCE RECORD

Inspected `public/sjn-mistakes.js` (blob SHA `b98ae24f70de830faf0519a737b282546e1c2e8f`), `lib/mistake-diary.js`, `public/sjn-mistakes.css`, `tests/mistake-diary.test.js` and `docs/SJN-MISTAKE-DIARY-V1-HANDOVER-2026-11-05.md`.

The V1.2 handover records explicit owner acceptance (“Mistake Diary finalize / done”) on 6 November 2026. Preserve this as a finalized existing Student LMS feature; this audit is not permission to redesign it.

Current supported source navigation:
- Question Banks: Subject → Chapter
- My Courses: Course → Test
- Full-Length Past Papers: original paper identity (not repeated per subject/chapter)

The diary automatically derives genuinely incorrect saved answers (selected answer exists and is incorrect) from detailed attempts. It presents the latest incorrect occurrence for each unique MCQ and records the number of wrong submissions. It does not manufacture individual question history for summary-only legacy attempts.

Question detail includes the original A–D options, highlights the correct answer and student's incorrect selection, and displays the explanation and mnemonic from the saved revision. Students can manually assign one of four categories:
- Information Gap
- Conceptual Mistake
- Silly Mistake
- Retention Gap

The diary also supports Need Review, In Progress and Mastered; optional learning notes (maximum 1,200 characters); Previous/Next navigation; and explicit Save Changes. No autosave. Navigation guards warn before discarding unsaved edits.

### 21.2 Data and security model — VERIFIED IN SOURCE; LIVE STATE NOT RECHECKED

The inspected V1 migration defines student-owned annotations keyed by `(user_id, mcq_id)`, with RLS and SECURITY INVOKER view/function access. Insert/update policies require a genuinely incorrect saved attempt item for the authenticated student. The diary view joins the saved `mcq_revision_id`, derives the latest wrong response and includes original question/options/explanation/mnemonic. It does not update attempts, attempt items, revisions or scores.

The API validates source grouping, category/status values, pagination and note length, scopes reads/writes by authenticated user ID, and upserts annotations on `user_id,mcq_id`. After saving an annotation, the client refreshes the authoritative catalog summary.

The migration includes `ON DELETE CASCADE` from annotation rows to both auth user and MCQ. The latter means deleting an MCQ would remove its annotation row; combined with historical attempt references, this reinforces the need to avoid hard-delete and to verify the full live FK graph before any retirement/deletion workflow.

A later V1.1 catalog grouping migration changes how the navigation catalog groups Course Tests and Full-Length Papers; it does not alter underlying attempts, answers or annotations. V1.2 desktop layout aligns category chips on the left and Review Status on the right, while retaining mobile dropdown behavior.

### 21.3 Test coverage — VERIFIED IN REPOSITORY

`tests/mistake-diary.test.js` asserts:
- only genuinely incorrect, selected saved answers are derived;
- immutable revisions and student ownership are respected;
- the view is SECURITY INVOKER and RLS enabled;
- no attempt/revision updates or destructive attempt-table operations;
- all four categories and three review statuses;
- original A–D answer highlighting;
- validated source groupings, paging, note length and user-scoped upsert;
- desktop category-chip alignment and mobile controls.

The tests were inspected but not executed in this audit. No fresh browser test or live RLS/grants check was performed.

### 21.4 Management Panel implications

- Mistake Diary is a student-facing downstream consumer of immutable question revisions. Admin edits must never rewrite historical revision content.
- Preserve stable MCQ IDs; annotation identity is keyed to MCQ ID, while displayed question/answer content comes from the latest wrong attempt's revision.
- Retiring a question must preserve historical attempts and existing student annotations; do not hard-delete.
- The Management Panel may eventually receive student issue reports and route them to content correction workflows, but Mistake Diary categories are the student's learning classification and must not be reused as issue-report categories.
- Preserve manual Save Changes and no-autosave in the student Mistake Diary. This is separate from any accepted Management Content Studio draft-editing autosave/Undo direction.
- Preserve the owner-accepted V1.2 interface unless the owner explicitly approves a separate future change.

### 21.5 Claude proposal assessment update

- **#4 retire instead of delete:** Strongly supported as a safety requirement; the MCQ FK cascade on annotations makes hard deletion especially risky. A full retirement feature is not verified.
- **#9 student preview:** The diary demonstrates that historical student display depends on saved revision content, original options, explanation and mnemonic. Management preview must distinguish current draft preview from historical attempt rendering.
- **#10 Student Reports:** Mistake Diary's category and annotation model is not a student reporting workflow. Do not treat the two as equivalent or infer report persistence from Mistake Diary.
- **#11 existing support:** Mistake Diary V1.2 is implemented and historically owner-accepted on staging; this does not establish a connected Student Reports workflow.

**Checkpoint:** Analytics and Mistake Diary source-level audit completed. The audit distinguishes code/test evidence from live database and browser verification. No Student LMS code, database, student records, Management Panel application or deployment was changed.

## 22. Full-Length Past Papers Analytics — corrected exact hierarchy (24 November 2026)

Reinspection of public/sjn-analytics.js confirms the earlier short summary saying Full-Length Past Papers were presented only at paper level was incomplete. The paperView(data) implementation provides a complete drill-down:
1. Papers catalogue cards show paper title, region, year, accuracy, recorded attempt count and paper question count.
2. Selecting a paper opens its individual analytics.
3. Subject Breakdown lists subjects for that selected paper.
4. Expanding a subject reveals chapter breakdown.
5. Expanding a chapter reveals topic rows.
6. Topic rows show answered count, correctness/incorrect/skipped statistics and accuracy.

Paper analytics are grouped from data.nodes where source_type is papers and group_key is the selected paper title, then grouped successively by subject, chapter and topic. Empty chapter/topic labels render as Not classified in this paper-specific view. This differs from Question Banks analytics, which has its own bank → subject → chapter → topic navigation and catalog coverage.

**Correction:** The earlier summary was incomplete. This section is the corrected source-backed description. Management Panel must preserve this full hierarchy and must not confuse Full-Length Past Papers with Past Papers Question Bank.

## 23. Student Past Papers browsing and exam-launch contract

Inspected public/sjn-pastpapers.js (blob SHA b444b5a1d897a3855736c7dd28451137c190c11a) and tests/pastpapers-browser-ui.test.js.

The student-facing Full-Length Past Papers library has six fixed top-level category IDs in this source: Sindh, Punjab, KPK, Balochistan, Federal and NUMS. It shows region/category cards, then year-wise published paper cards. Each published card displays year, title, description, question count and Published status, then lets the student choose an attempt mode. The module is a pre-attempt browser only; it delegates the actual exam to the existing authenticated exam renderer. It does not own a separate quiz/scoring/history engine. The source filters catalogue entries to recognized region IDs, numeric IDs, nonempty ordered MCQ IDs (maximum 200) and string titles.

The browser tests cover regional browsing, safe escaped rendering, no embedded PDF/iframe/duplicate quiz engine, and connection to the shared paper attempt launch. The region list is currently hard-coded in this student browsing component; Management Panel's future paper catalogue should respect the existing region identity contract while any expansion/change requires an explicit owner decision.

## 24. Report an Issue — source audit finding

A repository-wide inspection of the current public/index.html, server.js, API route modules and tracked file tree found no implemented student-facing Report an Issue module, submission endpoint, persistence table, staff queue or report lifecycle in the current branch source inspected.

The earlier description of a Report an Issue UI is not confirmed by the current source snapshot. It may have been a proposal, screenshot/temporary experiment, or code outside the inspected branch; do not assume it is implemented. There is no verified report-to-Management workflow in this audit.

**Management Panel implication:** Claude proposal #10 remains a proposed future workflow only. Do not implement its categories, statuses, Has a problem tags or Open in Editor behavior as if they were existing Student LMS contracts. A future Student Reports feature requires separate owner approval and a student UI/API/data model, authenticated ownership, attempt/question context, abuse/rate limits, staff permissions, immutable reported revision, retention/privacy policy and audit trail. No report persistence was discovered by source inspection.

## 25. Academy Resources — detailed source and handover audit

Inspected public/sjn-academy-resources.js (blob SHA ce6f13b2ed78a7d537d276b02dfabed3396b3623), lib/academy-resources.js (blob SHA c8408b2412c5040e8488ceaae5ab18e7a200fdbc), tests/academy-resources.test.js, and docs/ACADEMY-RESOURCES-HANDOVER-2026-11-03.md.

Verified behavior:
- Authenticated catalogue API returns only published folders and files, ordered by sort order and title, with private/no-store caching.
- Folder hierarchy is parent-child and browsed progressively; published PDFs appear within collections.
- Opening a file validates UUID, publication state and published parent folder; only PDF MIME type and safe PDF object-key paths are allowed.
- PDF bytes are not proxied through Vercel. The backend creates a short-lived (180-second) signed Cloudflare R2 GET URL for the dedicated sjn-mednest-academy-resources bucket.
- Browser PDF.js reader supports page navigation, page number, zoom, fit-width, expand/restore, close, continuous page scroll, cancellation of previous loads, render scheduling and focus/keyboard accessibility.
- Small PDFs up to 256 KiB may be held in a bounded in-memory cache (max four files); cache is cleared on account reset. No browser localStorage/sessionStorage cache is used.
- Diagnostics record timing only, scoped to Academy Resources.
- Existing regression tests cover authenticated routes, publication checks, signed URL safety, private PDF handling, reader interactions and layout.
- The handover records the owner's decision on 5 November to stop speculative PDF speed experiments and prioritize Admin Panel. The feature is functionally stable but not guaranteed fast; loading is network-dependent. Hybrid range/stream optimization was not approved as default; do not restart without explicit owner prioritization.

**Management Panel implication:** Future resource management needs folder hierarchy, PDF metadata, upload/replace/publication controls and secure R2 object handling. This audit does not establish a current Admin upload module or live bucket/database state. Preserve private access and published-parent checks. Do not change PDF storage or reader performance as part of Content Studio work without separate approval.

## 26. SJN AI Tutor — detailed source and handover audit

Inspected public/sjn-ai-tutor.js (blob SHA 2097720bc4920c2be80db5ef70cbad4edf51e6fb), lib/ai-tutor.js (blob SHA b3ff5dd05b76c0f6d1e4cf6319a275b62232725d), tests/ai-tutor.test.js, tests/ai-tutor-reliability.test.js, tests/ai-tutor-format.test.js and the AI Tutor handover.

Verified source contract:
- AI Tutor is a standalone authenticated optional API at /api/ai/status and /api/ai/tutor, isolated from exam, History, Results and MCQ engine dependencies.
- Provider is Google Gemini through server-side REST; API key is read from server environment, not browser code.
- Prompt limit is 2,200 characters; conversation context is validated and bounded; dynamic response token budget is selected by prompt intent.
- One bounded retry is permitted for transient network/5xx errors; 429 is not retried. Provider errors are mapped to user-safe messages. Requests time out after 30 seconds; incomplete/MAX_TOKENS responses are explicitly flagged.
- Per-user request controls are in-memory per warm server instance, not a durable global quota. Provider quota/availability cannot be guaranteed.
- Frontend has safe structured answer formatting, including Markdown and math support through lazy KaTeX loading; AI-generated HTML is not trusted. User messages remain text.
- Privacy notice warns that questions may be processed by Google and students should not enter private information.
- Historical handover says preserve the existing tutor personality and do not alter the purple UI as part of reliability work; actual visual redesign was not accepted as final.
- Existing tests cover isolation from exam modules, formatting and reliability/error paths. They were inspected, not executed in this audit.

**Management Panel implication:** AI Tutor settings/availability, model/provider configuration and usage controls are separate from Question Content Studio. No Management Panel AI Tutor configuration workflow was verified. Do not add provider keys, billing controls or AI content generation to Content Studio scope without separate approval.

## 27. Remaining global audit gaps and limits

This repository audit is detailed source-and-test inspection, not a live production or staging penetration test. The following remain open:
- Live read-only database schema, foreign-key graph, grants, RLS and storage policy verification for Student LMS.
- Verify actual current staging data/region catalog and analytics output without exposing student personal data.
- Fresh browser walkthrough for Results, Review, Retake, History, Analytics, Mistake Diary, Past Papers, Academy Resources and AI Tutor; screenshots requested where needed.
- Execute relevant regression test suites and record actual results/commit.
- Full-length paper metadata, region taxonomy and question-to-paper ordering must be compared against live rows and actual student attempt examples.
- Complete security audit of every MCQ read path and course entitlement; FF-008 remains a release blocker for restricted course content until proven fixed.
- Current branch source does not show Report an Issue persistence or management queue; owner confirmation is needed before adding it to scope.
- Existing static legacy admin forms/localStorage in public/index.html are not evidence of a secure production Management Panel and must not be reused as a privileged admin backend.

**Checkpoint:** Source inspection now covers Past Papers browser, exact Full-Length Past Papers Analytics hierarchy, Report an Issue presence/absence, Academy Resources and AI Tutor. No Student LMS code, database, configuration, records or deployment was changed.

## 28. Live Supabase database audit — read-only inspection (24 November 2026)

### 28.1 Scope and project identity

Connected directly to the two known Supabase projects and confirmed both report ACTIVE_HEALTHY:
- Student LMS Staging: `aozknkrwafowsrehdwlr`, PostgreSQL 17.11.0.003.
- Management Auth: `tdqbjhrmfluiinntmjfh`, PostgreSQL 17.11.0.018.

This was read-only inspection: project metadata, table/column/FK catalog, migrations, RLS policies, triggers, function metadata, storage policy metadata and Supabase security/performance advisors. No DDL, DML, auth setting, storage object or deployment was changed. No student-level personal records were queried.

### 28.2 Student LMS live schema — VERIFIED

Live public tables include:
`mcqs`, `mcq_revisions`, `attempts`, `attempt_items`, `past_papers`, `courses`, `sjn_course_tests`, `sjn_mistake_annotations`, `academy_resource_folders`, `academy_resource_files`, plus Management integration support tables.

Important contracts:
- `mcqs` has stable bigint ID, bank, subject, nullable chapter/topic, question/options/correct answer, explanation/mnemonic/source and `current_revision_id`.
- `mcq_revisions` stores immutable historical question content, revision number and classification/source metadata.
- `attempt_items` stores attempt ID, user ID, position, MCQ ID, immutable revision ID, selected index and correctness.
- Composite FK ownership links attempt items to their own attempt/user; revision references use RESTRICT.
- Trigger `sjn_mcq_revisions_immutable` blocks UPDATE and DELETE of revisions.
- `past_papers` stores title, year, description, ordered MCQ IDs as JSON, PDF URL and region. This confirms the existing paper catalogue does not currently have a normalized paper-question join table in the inspected live schema.
- `sjn_course_tests` stores session_code, test_number, title, subject, nullable chapter, duration, availability, MCQ IDs JSON, syllabus JSON and published flag. No normalized session parent table or test-to-question FK was found in the inspected public schema; session identity is currently encoded in test rows by session_code.
- `courses` is a separate table with title/description/chapters_json/body; do not confuse it with dynamic session/test records.
- Mistake annotations are keyed by student and MCQ. Live FK to `mcqs` uses ON DELETE CASCADE, so a hard delete can remove annotations; immutable revision/attempt FK restrictions further reinforce retirement over deletion.
- Resource folder/file tables have self-referencing folder hierarchy and RESTRICT delete rules.

### 28.3 Student LMS live RLS and security posture — VERIFIED WITH OPEN QUESTIONS

All inspected public Student LMS base tables have RLS enabled. Key observed policies:
- Attempts and attempt_items: authenticated owner-only SELECT.
- Historical revisions: SELECT only when the authenticated user has an attempt item referencing that revision.
- Mistake annotations: owner-only SELECT; INSERT/UPDATE requires a matching genuinely incorrect selected answer by the same user.
- Academy resource folders/files: authenticated SELECT only for published records; files additionally require a published parent folder.
- Course test catalogue: authenticated SELECT where published=true.
- Courses, MCQs, Past Papers and generic resources currently have broad SELECT policies for anon and authenticated roles with `USING (true)`.

The broad public content SELECT policies are a significant exposure-design question: this database-level policy does not itself filter unpublished rows. It may be intentional if all rows in those tables are public/published or if other data paths constrain access, but this has not been proven. Before any admin publishing workflow is released, determine whether draft/unpublished MCQs or papers can exist in these tables and inspect all direct Data API paths. This audit did not query question contents or attempt to infer publication state from student records.

RLS is enabled but FORCE ROW LEVEL SECURITY is false on the inspected public tables; this is common for table owners/service roles but must be considered alongside actual runtime roles. Storage policy catalog query returned no rows from the current query; bucket policy state therefore remains unverified, not assumed open or closed.

### 28.4 Student LMS live foreign-key and deletion integrity — VERIFIED

- Attempt items reference attempts with CASCADE and revision history with RESTRICT.
- MCQ revisions reference MCQs with RESTRICT.
- MCQ current revision uses a composite FK to the matching MCQ revision with RESTRICT.
- Bookmarks reference MCQs with CASCADE.
- Mistake annotations reference MCQs with CASCADE.
- Past paper MCQ associations and course test MCQ associations are JSON arrays rather than normalized FK rows in the live schema. This means database FK constraints do not protect those JSON references; application-level validation and audit are required before MCQ retirement or paper/test editing.
- Folder parent and resource file folder references use RESTRICT.

### 28.5 Management Auth live schema — VERIFIED

The Management Auth project has 12 public tables, all with RLS enabled. It includes staff membership, invitations, audit, step-up authentication, content batches/rows, MCQ edit drafts, syllabus nodes, academic-review submissions and review policy.

The live schema confirms:
- MCQ edit drafts preserve source MCQ ID, source bank, original revision ID, original fields, edited fields, optional syllabus topic, draft/discarded state and optimistic version.
- Academic-review submissions snapshot submitted fields, source MCQ/revision, draft version, author, reviewers, review policy mode and states pending/needs_changes/approved_for_release/withdrawn.
- Review submission references draft and staff identities with RESTRICT.
- Content batches/rows use parent batch and owner identity with RESTRICT.
- Syllabus nodes have parent hierarchy, kind, name/name_key, state, display order, revision and created/updated staff references; parent guard triggers run on insert/update.
- This confirms the Management Auth database is a separate authoring/review domain; it does not itself prove live MCQ publication is complete.

### 28.6 Management Auth RLS advisor findings — IMPORTANT, NEEDS SECURITY REVIEW

Supabase Security Advisor reported 12 public Management Auth tables with RLS enabled but no policies:
`mednest_academic_review_policies`, `mednest_academic_review_submissions`, `mednest_content_draft_batches`, `mednest_content_draft_rows`, `mednest_mcq_edit_drafts`, `mednest_staff_audit`, `mednest_staff_bootstrap`, `mednest_staff_invitations`, `mednest_staff_members`, `mednest_staff_stepup`, `mednest_staff_stepup_daily_quota`, `mednest_syllabus_nodes`.

The live `pg_policies` query also returned no public-schema policies for this project. This is not automatically proof of a vulnerability: the application may intentionally access these tables only through trusted server-side service-role operations and tightly guarded RPCs. However, it is a high-priority architecture/security verification item. Before release, inspect every API route, client initialization, grants, RPC EXECUTE privileges and service-role boundary to prove that browser clients cannot directly access or mutate these tables. Do not “fix” this by adding generic authenticated policies; that could expose privileged management data. Do not change policies without a separate reviewed implementation plan.

Security Advisor also reports leaked-password protection disabled. This is an Auth hardening recommendation requiring owner/security prioritization, not changed during this audit.

Performance Advisor reports nine unindexed foreign keys across review, staff and syllabus tables. It also reports eight indexes unused at the advisor observation time. These are recommendations only; do not drop or add indexes blindly. Confirm workload and query plans before any change.

### 28.7 Live migrations and functions

- Student LMS migration history is present and includes the analytics, Mistake Diary, paper/course and Management integration schema work; complete migration list should be retained in the evidence attachment/next handover.
- Management Auth has migrations through `restrict_content_batch_audit_trigger_rpc_20261117` (11 migrations listed).
- Student project includes server-side `sjn_student_analytics`, `sjn_mistake_diary_catalog`, and attempt submission RPCs; inspected metadata identifies them as SECURITY INVOKER except submission RPC `sjn_submit_practice_attempt`, which is SECURITY DEFINER.
- Management Auth has SECURITY INVOKER academic-review and MCQ-draft/syllabus functions plus SECURITY DEFINER staff auth/step-up/invitation functions. These require source-body and EXECUTE-grant review; function names/metadata alone do not prove their authorization checks.
- Student project contains Management integration support tables/functions, including publish receipts and `mednest_publish_mcq_batch`. Existence of the RPC and receipt table is not proof that the entire frontend → Management authorization → Student staging publishing workflow is safely wired and verified.

### 28.8 Supabase security/performance advisor summary

Student LMS advisor output was retrieved, but the large response was truncated in the tool transcript; findings must be re-fetched in a focused pass before recording a complete Student LMS advisor inventory. Do not claim no findings.
Management Auth advisor output explicitly included the 12 RLS-no-policy notices, leaked-password protection warning, nine unindexed FK notices and eight unused-index notices described above.

### 28.9 Required next verification before integration approval

1. Inspect Management Panel API routes and browser bundle to trace exactly how service-role credentials are kept server-side and how every route authenticates/authorizes each action.
2. Inspect SQL bodies and EXECUTE grants for all SECURITY DEFINER functions, especially staff bootstrap, invitation, step-up, review and batch publish.
3. Re-fetch Student LMS security/performance advisors in focused output; inspect storage bucket policies and bucket privacy settings.
4. Verify published/unpublished content semantics and public Data API access for MCQs, past papers, courses and resources.
5. Inspect exact current publication RPC body, receipt idempotency, cross-project credentials and source revision/version checks.
6. Validate JSON MCQ associations for papers/course tests and historical attempt retention, without modifying data.
7. Only after the above, write a reviewed compatibility/release-risk decision record. No schema policy change is authorized by this audit.

**Checkpoint:** Live read-only Supabase catalog, RLS policy, FK, trigger, function metadata, migration and advisor inspection completed for both Student LMS Staging and Management Auth. The Management Auth RLS-without-policies finding is flagged for careful server-boundary review, not changed. No rows containing student personal content were queried. No database or application state was modified.
