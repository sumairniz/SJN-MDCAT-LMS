# SJN MDCAT LMS Pro — Future Question Banks, Create Test & Product Direction

**As-of:** 2026-10-17 (Pakistan time)  
**Status:** LIVING PRODUCT PLAN / future backlog. **NOT a mandate to implement this now.**  
**Source basis:** Owner's recovered 22-page MCQ interface discussion, Phase 4 Blueprint v1.3 and subsequent owner clarifications through 2026-10-17. Distinguish confirmed owner decisions from earlier assistant recommendations. Later explicit owner decisions override older suggestions.

## Planning rule — owner confirmed 2026-10-17

This is the owner's **current direction, not a frozen specification**. The owner may add, remove, revise or defer requirements as they gain experience and evaluate the LMS. Whenever the plan changes, document: old requirement, new requirement, reason when given, explicit owner approval, implementation status, affected code/database, and test/release consequences. Never claim proposals are final without confirmation. Future AI/developer handovers must read the newest decisions.

## Confirmed direction — not current-phase tasks

### Two question banks

1. **Past Papers Question Bank** — MCQs associated with past examination source/year and subject/chapter/topic where known.
2. **SJN Question Bank** — academy-curated and organized practice MCQs with relevant educational metadata.

Both names are recovered from the owner-approved MCQ planning discussion. The owner expects potentially **30,000–50,000+ MCQs** across bank(s) in the longer term. **OWNER CORRECTION 2026-10-17: The same MCQ must not appear in both Past Papers and SJN question banks.** This overrides the assistant's earlier dual-bank sharing recommendation. One ordinary-bank classification per question is the current design direction; define exactly how to detect duplicates later. A shared physical `mcqs` table with one bank field does NOT imply sharing questions across both banks. The exact import/review policy may evolve.

### Planned Create Test experience (future phase)

- **Keep and enhance the existing wizard** (bank → All Subjects / One Subject / Custom Mix / Topic Drill → subjects/chapters/topics → MCQ count → Tutor/Timed mode). Do not redesign it in the present MCQ Database Foundation phase.
- **Owner-confirmed future Create Practice Quiz filters (2026-10-17):** **Unused is selected by default**. Students may additionally select **Used, Incorrect and Marked/Bookmarked**, including combinations and selecting **all four at once**. Filters are multi-select, not mutually exclusive. **Only this product direction is confirmed**; detailed user interface and precise combined-selection semantics will be decided when the Create Test wizard phase begins. Earlier Correct and Omitted/Skipped suggestions remain proposals, not approved additional filters.
- **Open questions for later:** Does a multi-selection use union, priority or other logic? What is Used (seen vs attempted)? How do incorrect retakes affect eligibility? Incorrect and Marked overlap Used. Do not implement an accidental all-filter AND intersection. Do not build these filters before verified question-level student history.
- **Needed before those filters work:** persistent student- and question-level history under RLS, with stable question identity. Do not derive Used/Incorrect solely from aggregate test scores.
- **Open filter semantics requiring explicit owner confirmation:** what counts as Used (seen vs selected answer vs completed test); how Unused treats abandoned drafts; whether Incorrect means ever wrong vs latest attempt wrong vs currently unresolved; how retakes affect status and filtered pool; priority/order when combining filters; how many marks are shown and how to handle too-few matches.
- **Direction discussed, detail not finalized:** available MCQ counts beside banks, subjects, chapters and topics; readable final wizard summary. Per-chapter custom MCQ allocation is **optional future proposal**, not approved implementation. Avoid loading 50k answers or all records to every browser to calculate counts.
- Only **published, permitted** questions should be served through normal student practice. Test different user roles, bank memberships and course entitlements as these features are specified.

### One unified Mark for Review / Bookmark — owner confirmed

- **One action, one persistent per-student mark** linked to the MCQ's stable ID; *not* separate bookmark and mark systems.
- Marking during a test highlights that question in the navigator and makes it available to the future **Marked Questions** Create Test filter; marking persists after completion and across devices.
- Students may **unmark** during normal review or a later test; unmark removes the mark from the navigator/current selection and future Marked Questions pool. Confirm exact controls in the Review UI during its own phase.
- **No separate Bookmarks page, menu or saved-questions collection view.**
- Current Stage 2 preview has a visual Mark control but staging \`bookmarks.mcq_id\` references empty \`mcqs\`. Persistent marking is blocked until the approved database-backed question identity migration. Track under [Temporary Change Register](SJN-TEMPORARY-CHANGE-REGISTER.md).

### Test History and ongoing practice — future implementation

- For each completed, eligible test: **View Result**, **Review Test**, **Retake Test**. Exact layout and navigation to be approved in its own phase. Review shows each answered question, chosen/correct options, explanations/mnemonics, filters and navigator without changing the finished score; retake creates a separate attempt using the **same saved questions in exactly the same order**.
- For unfinished normal practice: **Save & Exit**, automatic drafts and **Resume** from Test History; preserve selected IDs/order, answers, current position, mode and remaining Timed Practice clock. A saved unfinished test is **not** a completed score.
- Future strict/course **mock exams have separate exam rules** and should **not** inherit unlimited Save & Exit or pause/resume assumptions. Detailed mock requirements are not approved yet.
- For user-specified Review, Report Issue and History behavior consult [Blueprint v1.3](SJN-PHASE4-INTERFACE-BLUEPRINT-v1.3.md).

### Future Overall LMS Analytics (not the current per-test Results Insights)

- Entire-student analytics across eligible historical practice, per subject/chapter/topic, with question-level denominators and clear inclusion policy; future course/mock reporting under separately specified rules.
- Distinguish **one completed test's Performance Insights** (already staged) from **overall student analytics** (not built). Decide attempt versus unique-question denominators and retake impact before designing summaries.

### Future full Admin Panel — owner direction, no scope approval yet

- A separate authorized administrator workspace to curate questions and banks, import and validate batches, correct/version/archive/publish, manage academy content/courses/resources, and handle student MCQ issue reports.
- Detailed admin roles, workflow, moderation, permissions and bulk-upload rules **will be supplied later**. Do **not** implement or expose admin functionality based on these directional notes alone. Protect role elevation and privileged service access separately from normal student paths.

### Owner/admin-team-only premium question publishing — owner clarification (2026-10-17)

- Only the **owner and authorized Admin Panel management team** may review, categorize and manually publish chosen premium course-test questions to ONE ordinary bank after the permitted release stage. **Students must never move, import, transfer, publish or relabel questions.** This must be enforced by database/API authorization, not only by hiding buttons.
- This is a future Admin Panel design direction, not current implementation approval.

### Future premium Course Tests — preliminary owner idea (not final scope, 2026-10-17)

- Course chapter-based, multi-chapter and mock tests would initially use **separate premium questions**, not questions taken from the normal Past Papers or SJN practice banks.
- **Hide chapter and topic labels during ALL course tests**, even if the test covers one chapter; the goal is to avoid giving clues or distracting students. Hiding labels does not forbid storing taxonomy privately where useful.
- After a course finishes, the owner may **manually select all or some premium questions for publication to ONE regular bank**. There is no automatic conversion on course expiration and no permission to publish premium content ahead of time.
- Course questions, answer keys and restricted assessment content must never be inadvertently disclosed through the currently public practice `/api/content` route or anonymous `mcqs` SELECT. Plan authorization and bank/course content boundaries before implementing course tests.

### Future Overall Analytics — preliminary owner idea (not final scope, 2026-10-17)

- **Question Bank Analytics:** total attempted, correct, incorrect and skipped plus **Subject → Chapter → Topic** performance breakdowns.
- **Courses / Tests Analytics:** separate results for course assessments, subject-wise performance and possibly a test-by-test marks trend (e.g., score for Test 1, Test 2, etc.). Exact visualization, history view and metrics are not decided.
- A hidden chapter/topic label in exam UI does **not** technically prevent chapter/topic analytics if tagged metadata exists. The owner currently proposes **subject-wise** course-test analytics; whether to collect/use deeper internal metadata is a later decision.
- Avoid mixing bank-practice and premium-course attempt statistics without defining suitable denominators, permissions and retake rules.

### Future Mistake Diary — preliminary owner idea (not final scope, 2026-10-17)

- Students may review their wrong MCQs and **manually classify** the reason for an error. Example category candidates (not finalized): **Information-based, Concept-based, Silly Mistake, Retention-based**.
- The eventual number/names of categories, category editing UX, whether category belongs to a question or a particular attempt, and premium-test question availability remain undecided.
- Do not automatically classify mistakes or modify historical scores. Student-specific question-level history and appropriate access policies must precede this feature.

### Future Appearance setting (later, optional)

- Owner wants a simple **Dark/Light** UI preference, with legible black/white contrast and preserved meaningful answer/status colors. Technically feasible via systematic theme tokens; avoid naive whole-page color inversion. This is **not the current phase**, and precise design remains open.

## Current phase and boundaries

**NOW: Phase 4 — MCQ Database Foundation.** Review Supabase schema, stable IDs, **single ordinary-bank assignment without cross-bank duplicates**, original 74-question preservation, migration design, RLS, and compatibility with future question-level history. Premium course tests remain future separate protected content. The planned Create Test filters, Admin Panel, overall Analytics, theme switch and strict mock system all come **later**, under fresh scoped approvals. Read [Database Foundation Review](SJN-MCQ-DATABASE-FOUNDATION-REVIEW-2026-10-17.md) before designing SQL.

**Owner clarification on test data (2026-10-17):** No officially enrolled students; current accounts and previous attempts are for testing. Owner is open to removing **testing attempt history** if needed. This is **not approval to perform a deletion now**. Record the specific affected staging records, backup/rollback implications and obtain separate consent before any reset; do not alter production or remove the source 74 MCQs.

## Pending choices — do not silently assume

- The final taxonomy, **duplicate-detection criteria with NO cross-bank duplication**, and origin/source/year metadata constraints.
- Which historical attempts are included in Used/Incorrect and overall analytics.
- Whether Correct/Omitted become standalone Create Test filters.
- How question revisions, duplicate discovery and retakes affect existing results.
- Who may access which premium course/mock questions, and the separately controlled future owner-selected publication of some course questions into one regular bank (future policy).
- Course-test subject analytics and marks trends, and Mistake Diary category/editing details (preliminary ideas, not finalized).
- The detailed admin editor/import/reports UI and Light theme design.

## Change-log protocol

Add short dated sections when **decisions change**. Label **CONFIRMED / PROPOSED / OBSERVED IN CODE / VERIFIED**. Include related GitHub commit/PR and validation where implementation occurred, and point to the [Master Development Plan](SJN-LMS-MASTER-DEVELOPMENT-PLAN.md). Git commits contain line-by-line changes; this file explains *why* the product should work this way.
