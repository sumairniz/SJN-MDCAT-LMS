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

Initial implementation committed; CI and Vercel READY verified. Owner live-browser UI/feature acceptance remains pending; do not claim it is verified before actual owner tests.

## 2026-10-19 — Staging build verification

- **Commit:** a3fe5e092c648d69ec32d9aa07ada9d360e0e46e, Stage 3C responsive History and saved-result actions, with no Supabase migration.
- **GitHub CI:** runs 39300392518 and 39300381158 both completed successfully, including Node tests, student-scoped mock request isolation, quiz-launch exact-order retake regression, original 74 preservation, CSS build reproducibility and release guardrails.
- **Vercel Preview:** dedicated branch host READY at the exact same commit.
- **Read-only staging DB preservation:** mcqs 74, revisions 74, attempts 55 (39 old summary-only, 16 detailed), attempt_items 80, bookmarks 3. User activity can change totals independently of this deployment; these are a timestamped post-deploy snapshot.
- **Still requires owner browser approval:** mobile ~375 px history without horizontal scroll; desktop action sizes/colors; search and Source/Mode/Status/Date filters; saved Results from History; Review filters, correct key and explanations; marked toggle; Tutor/Timed Retake with exact question order, newly saved independent score and earlier history unchanged; a second student cannot request the first student's detailed attempt (live, not only mocked).
- **Important limitation:** Existing old score-only attempts cannot offer Review/Retake; they remain accessible for honest summary Results. A change in active MCQ revision blocks Retake to avoid silently substituting different historical questions. Future Courses/Mocks and In Progress have no active data/source integration yet and must be connected with real source metadata and draft persistence before advertising them as active.

## 2026-10-20 — Latest Stage 3C refinement acceptance and remaining release gates

- **Owner visual acceptance reported:** The owner opened the current staging build and confirmed that the reviewed interface looks correct. This covers the latest History/Review refinements; it does not erase older historical testing notes or prove scenarios not actually demonstrated.
- **Deployed feature code:** `95770f739844cac3683317872537d5993146a063` (source labels, saved multi-subject display, navigator toggle, correct/incorrect/skipped colors, separate violet mark icon/border, recorded Time Taken). GitHub Foundation checks run `39325601496` succeeded; Vercel staging preview `dpl_84CQU9aW9aUE9KYXQuWxZfydzCLT` READY at this exact commit.
- **Read-only staging snapshot:** 74 MCQs; 74 revisions; 62 attempts (23 detailed; original 39 summary-only intact); 165 attempt items; 3 bookmarks. No data edits from the continuity check.
- **Outstanding production gate:** Explicit signed-in account A/B foreign detailed-history request denial and other unverified auth/session/refresh/Retake/mobile regressions remain to be validated where not already evidenced. An owner-approved visual review is not a substitute for these security checks.
- **Next design discussion:** Save & Exit, durable autosave and Resume via In Progress history according to approved Blueprint v1.3; separate scoped approval required before implementing SQL or app changes. Do not change the accepted MCQ/Results/Review/Retake interface unnecessarily or merge the development PR.
