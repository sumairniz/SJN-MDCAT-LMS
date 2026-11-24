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
