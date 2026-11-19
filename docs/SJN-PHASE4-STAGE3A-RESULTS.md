# SJN Phase 4 — Stage 3A Approved Results Screen (staging preview)

**Owner approval:** 2026-10-16, after detailed review of Blueprint v1.3 and newly re-shared visual reference.  
**Scope:** Results presentation and dynamic calculations for the opted-in Phase 4 SPA exam. No changes to original 74 MCQs, production, main, Supabase tables or Vercel settings.  
**Implementation:** public/sjn-phase4-results.js + .css, integrated into current Stage 2 preview. No new framework, third-party ring image, SVG dependency or database write path.

## Approved design
- Heading **Practice Test Completed!** and subtitle **Here is your performance summary report.**
- Centered balanced-size circular ring, percentage inside, small label **ACCURACY** below percentage inside (as in prior approved illustration), with lightweight rope/textured SVG pattern and a subtle glow. Track and progress clockwise from twelve o'clock; color at 0–49% red, 50–79% yellow, >=80% green. Do not sacrifice correctness/stability for an exact photographic texture.
- Bold white dynamic **correct / total** directly beneath ring, e.g. **40 / 50**; no "Score:" inside ring, no fixed fifty-question assumption.
- Four screenshot-based labeled header/body cards **Correct / Incorrect / Skipped / Time Taken** with green/red/yellow/neutral-white accents; desktop 4 across, mobile 2+2.
- Action row desktop 4 across/mobile 2+2: Review Answers, Retake Test, Return to Dashboard, Create New Test.
- **Performance Insights** beneath action row, native accessible collapsed-by-default details with three groups, subject → chapter → topic, horizontal bars only, correct/total/percent, displayed only where data exists.
- Preserve SJN charcoal/black background, Inter typography, red primary and accessible focus indicators.

## Data integrity / accurate labels
- Result totals are derived from the *actual selected question list and selected answers*; each unanswered answer is **Skipped**, not Incorrect, and all categories reconcile to total. Percentage is correct/total (skipped remain part of total).
- Actual elapsed time is captured from the exam's recorded start timestamp, **not** from remaining Timed countdown; display M:S or H:M:S.
- Insights derive only from this just-completed in-memory attempt. **Historical question-level analytics are not yet stored.** No question records or user answers are written into localStorage, sessionStorage or new endpoints.
- Preserve existing student-authenticated attempt-save pipeline. Results view marks "Saving…" until the old endpoint confirms the new attempt ID, then "Saved to your Test History." On unconfirmed save it gives explicit warning. This does not by itself guarantee a save on network failure.
- While saving, navigation buttons are held until save outcome to discourage leaving before confirmation. The original save failure alert remains active in the authenticated pipeline. Test history remains server-verified and account scoped.

## Deliberately deferred / tracked in temporary register
- **TEMP-P4-006**: Review Answers and Retake Test buttons are visible but **disabled and explicitly labeled as forthcoming** until independently approved persistent question identity and question-level history are complete (Stage 3B). No visual-only clickable placeholders that falsely claim functionality.
- **TEMP-P4-001**: Preview still requires ?sjnPhase4Preview=1; old default quiz and old default results UI unchanged. New /quiz/results preview route is transient and direct refresh falls back safely to wizard, not to fabricated attempt history.
- **TEMP-P4-003/004/005**: Save & Exit, durable marks, and secure draft resumption remain deferred and unchanged. Their production blockers remain open; Stage 3A does not close any entry.

## Review checklist
- [ ] GitHub npm test / release hygiene CI green at exact HEAD.
- [ ] Vercel development staging deployment READY at same commit.
- [ ] Owner visual desktop screenshot accepted (including ring texture, card sizes and font).
- [ ] Owner real mobile screen check at 360–430px completed; 2×2 cards and actions readable.
- [ ] Tutor and Timed tests with variable question counts, skipped and zero/100% scores.
- [ ] Time captured in both modes and countdown no longer dictates Time Taken.
- [ ] One completed attempt saved exactly once, reflected under the correct student.
- [ ] Simulated save failure does not falsely say saved; account-switch/24-hour expiry isolation checked.
- [ ] Original 74-question fingerprint gate and original quiz regression checks pass.
- [ ] No production merge or release without separate explicit owner approval.

**This staged visual acceptance is not a production release.**
