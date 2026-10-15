# Phase 4 — Stage 2 Owner Feedback Adjustment Pass (2026-10-15)

**Status:** Implemented in the opt-in development preview; pending owner manual visual acceptance. **No database changes.**

Owner-reported original Stage 2 tests: 14/14 passed, subject to later visual adjustment requests. The following newer decisions were explicitly confirmed by owner and take precedence where they differ from older guidance:

- Tutor: green tick at option's right edge for correct answer; red X on wrong selected answer. Checked Tutor answers stay immutable.
- Timed Practice: selected answer amber/yellow, not red; correct/incorrect never revealed before Submit.
- One desktop question-metadata row where space permits: original red subject badge, ordinary chapter/topic text, original amber source/year badge. Mark stays at top right and turns yellow if the server confirms it; Report Issue is red and adjacent.
- Show only `Question N` above the question statement; mode and `N / total` already appear in the header.
- Desktop compact header: `SJN EXAM`, mode, position `N / total`, yellow **answered-question** progress, red timer and Submit. Answered progress is `number with selected answer / total MCQs`, **not question position**, and stays unchanged when simply navigating backwards. Hide bar on cramped mobile header.
- Reduce mobile vertical whitespace without overlapping text/touch targets; keep Previous/Next in the card (not sticky). Avoid styling that forces the mobile scrollbar permanently visible; actual overlay behavior remains browser-controlled.
- Explain answers using only `Correct Answer: B. Answer text` heading, irrespective of whether selected answer was wrong. Explanation must be noticeably more readable.
- Report Issue: Owner-approved combined reference design—ten categories, single choice, optional details, compact desktop SJN modal, scrollable mobile bottom sheet, cancel/close. **Front-end preview only.** The report button is rendered and category selection/details work. Submit explains that NO report has been sent or saved. No fake success; no Supabase report table or endpoint.
- Original 74 MCQs and existing authenticated history must remain untouched. Existing bookmark storage cannot be considered fixed while staging `mcqs` is empty.

**Not yet implemented:** real report persistence/admin review, Save & Exit, autosave/Resume, permanent Mark for Review compatibility with 74 inline MCQs, redesigned results/review/retake, production launch. These remain subject to separate implementation and acceptance. Vercel Deployment Protection may require authenticated Vercel session or approved shareable testing access for actual-phone manual review; do not disable protection without owner consent.

Staging-only feature switch: `?sjnPhase4Preview=1`. Old student quiz remains default. Owner to review this latest visual version before proceeding to Stage 3.
