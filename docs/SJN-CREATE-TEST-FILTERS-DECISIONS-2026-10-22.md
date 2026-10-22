# Create Practice Test — Confirmed Decisions (2026-10-22)

**Status:** Seven product decisions agreed by owner; DISCUSSION COMPLETE for the seven topics below. **Not approved for implementation or deployment.** Later explicitly approved revisions take precedence. Source of truth for implementation remains the latest branch code and master plan.

## Five filters
- Unused — selected by default.
- Incorrect.
- Skipped.
- Marked (the student's persistent bookmark/mark).
- Correct.
- **No Used filter.** Filters are multi-select.

## Seven confirmed rules
1. **Unused:** An MCQ stops being Unused when it appears in a *submitted/completed* test, even if skipped. Merely being in a manually saved unfinished test does not change Unused classification.
2. **Correct / Incorrect:** Classify each MCQ from that student's **latest completed attempt** at that MCQ, rather than any older outcome. A later submitted attempt supersedes the older status.
3. **Skipped:** An MCQ is Skipped if its **latest completed attempt** left it unanswered. Unanswered draft questions do not count as Skipped.
4. **Combining filters — OR logic, expressly owner-approved:** Include MCQs matching **any** selected filter. Deduplicate by stable MCQ identity: a question matching Incorrect and Marked, for example, appears only once. With Unused + Incorrect, include unused OR incorrect; do not require both.
5. **Too few eligible MCQs:** Clearly explain zero matches or a requested test size exceeding the eligible pool. Do not start an invalid test.
6. **Chapter selection:** Custom Mix is renamed **Custom Quiz**. It allows multiple subjects and a chapter step. If no chapters are selected, include all chapters of the selected subjects. **Topic Drill** must go through Subjects → Chapters → Topics → Settings, requiring at least one chapter and then selecting topics from those chapters. All Subjects proceeds to Settings; One Subject proceeds from selecting a subject to Settings.
7. **Interface:** Preserve the existing Question Bank card and the four existing practice-mode colors/selected border accents. Use compact, subtly raised, full-card-clickable subject/chapter/topic choices instead of oversized checkbox strips. Put five **small**, not oversized, selectable filter chips in Step 4 Settings. Preserve the SJN theme, Back/progress flow, responsive design, test modes and existing exam behavior.

## Additional already agreed directions
- The **Number of MCQs input starts empty**, neither 5 nor 0; retain presets 5, 10, 20, 50, 100 and allow valid manually typed counts. This is proposed application behavior pending code approval.
- **New displayed MCQ-count badges are DEFERRED:** do not add visible bank/subject/chapter/topic totals or per-filter category counts now. In the future, upon owner's separate go-ahead, bank/subject/chapter/topic counts show *total published eligible MCQs in that scope*, and filters show *student-specific category counts*. Do not auto-activate at an assumed bank size. Existing test-length and availability validation are distinct and are not authorized to be removed.
- Existing and older score-only test records must **not be given invented question-level classifications**. Use only verified account-scoped question-level history, stable IDs, and published permitted content. Marked membership is independent of latest attempt status.
- Avoid unintended network requests on per-question actions, do not implement Autosave (owner cancelled), and keep production, `main`, PR merge and production database outside scope.

## Still to review before implementation permission
Exact responsive card sizes and final visual acceptance; valid/empty filter-selection behavior; oldest score-only attempt coverage; count feedback under limited available content; scoped implementation plan and tests. **No change to application code, database, RLS, hosting configuration or production was authorized by these decisions.**

**Record:** The owner approved 1, 2, 3, 5, 6, 7 together and subsequently explicitly approved **#4 (OR logic without duplicate MCQs)** on 2026-10-22.
