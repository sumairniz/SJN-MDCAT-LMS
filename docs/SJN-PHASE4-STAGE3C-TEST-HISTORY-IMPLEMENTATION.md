# SJN MDCAT LMS Pro — Stage 3C Test History Implementation

**Owner-approved scope:** The owner provided Saeed MDCAT and SJN desktop/mobile screenshots, approved the distinct SJN layout and functional features, then requested implementation. No 3D or glow enhancements; preserve the current MCQ exam interface completely.

## Approved design

1. Two top counters: Total Tests and Completed Tests. Currently all persisted test rows represent submitted attempts; the counters correctly match until draft functionality is actually implemented.
2. Search over title, bank, subject, chapter, topic; Source / Mode / Status / Date filters. In Progress stays unavailable until real Save & Exit storage is built.
3. Unified student-owned history for Past Papers, SJN Bank, future Courses and Mock Tests. The original saved test title is the primary label. Existing title-based source recognition is only a conservative fallback. Explicit source metadata in selection_json.sourceKind must come from future approved builders; no fabricated course/mock tests.
4. Tight six-column desktop table; mobile cards replace overflowing tables and avoid horizontal scrolling.
5. Three actions: neutral Results with red mini-chart bars ONLY, solid-red Review, soft dark-red Retake. No visual redesign of examination UI.

## Security and behavior

- GET /api/history still requires authentication and account-scopes summaries. It includes attempt id and details_version. New GET /api/history/:attemptId checks student identity before reading detailed attempt items and immutable revisions; foreign and absent attempts return 404.
- Old summary-only tests show their genuine saved score. Review and Retake are disabled when the original questions were not preserved. No made-up question snapshots or time/skipped counts.
- Detailed Results opens the previously approved Results Screen from immutable saved questions and student selections WITHOUT submitting another attempt.
- Review is a separate Test History question-by-question workspace with the approved filters All/Correct/Incorrect/Unanswered/Marked, marked questions, key/explanation/mnemonic. It does not modify the student's original test score.
- Retake reuses the approved quiz launcher and the same saved question IDs/order with fresh answers and a new submission key. If a historical revision is not identical to today's active bank revision, it refuses to retake rather than silently changing questions.
- Authenticated bookmarks remain the canonical mark state; secure grader and DB ownership restrictions remain unchanged.

## Release gates

GitHub CI and staging Vercel READY; original 74 preserved; no stale-bearer or cross-student History access; both Tutor and Timed retake, duplicate request and browser refresh safeguards; owner desktop/mobile acceptance; read-only DB inspection. Existing original 39 historical summaries are preserved. Production requires separate permission. The separately documented Results delay stays deferred.

## Outcome

Initial implementation prepared; CI, staging browser and owner acceptance pending. Do not claim completion of those gates until verified.
