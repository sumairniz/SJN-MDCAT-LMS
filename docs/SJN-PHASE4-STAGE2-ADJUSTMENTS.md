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

## 2026-10-16 — Three owner-approved Stage 2 final refinements (staging only)

- Desktop Mark for Review and Report Issue use matching compact subtle outlined borders. Their existing bookmark/flag colors remain distinct; mobile icons stay borderless and text-free.
- Mobile exam workspace, question navigator and report-sheet scrollbars use thin scoped styling rather than the previous `width: auto` override. Native overlay/auto-hide is browser/OS-controlled; real-phone review is still required.
- On the last MCQ only, in-card **Next** becomes a **red Finish** button. It calls the same `requestSubmission()` confirmation as the unchanged header Submit button (including unanswered review); it does not submit automatically. Earlier questions retain Next, and Previous remains available.
- Original 74 MCQs, Tutor/Timed answer logic, answered-progress, authentication, student data, Supabase schema and production are unchanged.
- Automated regression checks added; **final Stage 2 owner visual acceptance remains pending**.

## 2026-10-16 — Owner-approved compact Question Navigator blocks (staging only)

- **Only** resize the numbered question tiles and allow the grid to automatically accommodate additional columns.
- Desktop: replace the fixed five-column arrangement with CSS `auto-fill` tracks sized from a compact 28px minimum, 5px gaps, and minimum tile height of 30px. `auto-fill` prevents sparse tests from stretching a few tiles into oversized blocks.
- Mobile: use at least 40px-wide/40px-high tap targets with 6px gaps where possible; the responsive grid chooses how many fit without horizontal overflow.
- Preserve the existing outer navigator's width, placement, original auto-sizing height (subject to its existing scroll limit), mobile drawer dimensions, colors, marks, statuses, click navigation, and exam interactions. **Do not change the panel's own layout or height rules.**
- No original MCQ edits, backend changes, database migrations, production changes, or PR merge. Owner visual acceptance is still pending. Bookmark/report backend functionality remains deferred.
