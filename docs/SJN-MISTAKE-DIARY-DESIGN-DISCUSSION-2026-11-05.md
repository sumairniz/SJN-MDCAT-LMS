# Mistake Diary — Chat 8 Product Design Discussion (2026-11-05)

**Status: PARTIALLY AGREED PRODUCT REQUIREMENTS; overall UI/data design NOT yet approved for implementation.**
**Scope:** Documentation-only, no source changes, no database migration or student records changed, no deployment, no production/main/PR merge.

## 1. Owner-stated requirements (preserve verbatim in intent; do not silently change)

1. **Automatically include every incorrectly answered MCQ** from every successfully submitted test in Mistake Diary. Students do not have to add each wrong question manually. **Do not automatically assign a mistake reason/category.** Students will choose a category for themselves.
2. Exactly **four user-selected categories**, pending any future explicit owner revision:
   - **Information Gap**
   - **Conceptual Mistake**
   - **Silly Mistake** (owner expressly replaces former "Careless Mistake")
   - **Retention Gap**
3. Keep the proposed **Need Review, In Progress, Mastered** review-status approach and optional editable student learning note. Owner responded positively to the brief question preview line displayed in the card.
4. Mistakes have **three distinct primary navigation groups**, determined by the source of the submitted test:
   - **Question Banks (combined):** SJN Question Bank and Past Papers Question Bank in a single group. Navigate **Subject → Chapter → mistakes (MCQ list)**. **Do not impose Topic as an extra navigation step.** Each MCQ shows its **topic label** when available and its exact bank/source badge (**SJN Question Bank** or **Past Papers Question Bank**).
   - **My Courses:** navigate **Course → Test → mistakes**, since some course tests have chapter metadata and others do not. Show chapter/topic metadata on individual MCQs when available, without requiring it for listing.
   - **Full-Length Past Papers:** primarily **Paper → mistakes**, preserving exact region/source, paper name/year/code; optionally a region/paper picker when needed. The owner explicitly questioned whether chapter/topic grouping is worth extra student navigation. Do not impose chapter/topic drilldowns before the owner decides; show known chapter/topic on MCQ cards.
5. **Few taps and low confusion**: easy discovery, relevant MCQs visible immediately once chapter/test/paper is selected, no excessive back-and-forth, mobile-friendly.
6. Header visual style should match the **My Analytics / Performance Center** hierarchy, with a small, differently accented upper label (kicker) above the large **Mistake Diary** heading; consistent with LMS theme, not a global redesign.
7. **No Mistake Diary implementation changes are authorized yet**. Discuss and finalize first.

## 2. Engineering/product suggestions ONLY — not approved decisions

- **Suggested small heading:** `LEARNING JOURNAL` above `Mistake Diary`, using a restrained distinguishable accent and existing academy theme.
- Top-level compact segments/tabs for the three sources, each with verified count; within each, direct subject/chapter, course/test, or paper selection. Keep global Search/Status/Reason filters and 1-click accordion cards with full question details, saved answer, correct answer, explanation, editable note, and status/category without navigating to unrelated sections.
- All automatically identified incorrect MCQs start **Uncategorized + Need Review**, unless an earlier student classification already exists. Category and status are personal annotations, never automatic judgments.
- Default for V1: include only **incorrect** answers, not skipped or correctly answered guesses (the owner explicitly requested all incorrect, but has not yet approved whether to include other types).
- Base the automatic population on **server-verified, successfully submitted, student-owned attempt_items**, not drafts, browser scores or legacy summary-only attempts without question details. Prefer a secure read-derived inventory plus a small RLS-protected annotation table, avoiding extra synchronous writes during fast submit. The exact persistence design is pending review/approval.
- Prevent duplicates within a student/question/source context on retakes while preserving the original test provenance, historical wrong attempts and continued visibility after a later correct answer unless a separately approved rule changes that. **Deduplication key and how multiple paper/course occurrences display are OPEN decisions**.
- Keep Course/Past Paper questions subject to verified entitlement and publication rules; having a Mistake Diary entry must not bypass premium/question permissions. Student notes remain private. No scoring, Results, Test History, Analytics or question-bank filter mutation.
- Pagination, indexed queries, current student-only RLS, cache invalidation and account-switch guarding; lazily fetch a selected chapter/test/paper to support scale. No preload of all question texts or added calls on login/dashboard/quiz overview.
- Changing a student's categorization does not affect test score or alter the original question/answer key.

## 3. Questions pending owner discussion

1. **Full-Length Past Papers primary grouping**: Paper/year with region as optional outer selector, versus another variant. Recommendation: Paper/year with region picker if many.
2. Should mistakes remain visible after a later correct retake, and does marking `Mastered` hide them by default or leave them filterable? Recommendation: retain; change view only by explicit status/filter.
3. Same MCQ across different course tests or full-length paper attempts: one shared note versus separate context entries, and how to preserve origin and review history.
4. Should student be able to classify/add **skipped** or **correct-but-guessed** items manually in V1? No permission yet.
5. Exact status behavior (who changes status, default tab), header accent, summary card count, in-card controls and optional review action without creating a duplicate exam engine.

## 4. Non-negotiable architecture and release gates

Follow Master Development Plan, Developer Handover, Temporary Change Register, Release Safety Checklist and Dashboard handover. Preserve 24-hour authenticated session, per-student Supabase RLS, immutable MCQ revisions and authoritative saved answer/score source. No autosave, no speculative background writes, no false success. First complete product decision and minimal data/API design; obtain separate owner approval before code, SQL, staging deploy. No production without independent review and permission.
