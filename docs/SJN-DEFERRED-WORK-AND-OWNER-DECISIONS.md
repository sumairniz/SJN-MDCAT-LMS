# SJN MDCAT LMS Pro — Deferred Work & Owner Decisions

**Purpose:** Permanent, easily searchable list of tasks the Academy owner explicitly deferred, so a future developer or ChatGPT conversation can answer: **“What do we still need to do?”**  
**Updated:** 2026-10-20 (Pakistan time)  
**Branch:** `sjn-phase1a-foundation` (staging development only); production unaffected.

## DEFERRED-RESULTS-001 — Reduce Results Screen navigation delay (Owner deferred 2026-10-19)

**Status:** DEFERRED — DO NOT IMPLEMENT NOW. Resume only after owner requests this task or while reviewing pending work at the appropriate future phase.

**Observed by owner:** On the visually approved Stage 3A Results Screen, **Return to Dashboard** and **Create New Test** remain visible but temporarily disabled for approximately **4 seconds** following Submit. The transient yellow “Saving…” and green “Saved…” messages were removed in development commit `59d5acd` (both CI workflows passed), but removing them did **not** remove the navigation wait. The owner measured this informally, not with network instrumentation; do not claim a verified 4.000-second latency.

**Observed in current code:** `public/sjn-phase4-results.js` sets `pendingSave=true` and disables those two actions until `savePromise` settles. In `public/index.html`, authenticated `window.finishQuiz()` awaits the server-verified `POST /api/practice/submit` and then awaits `refreshAuthenticatedStats()` and `loadStudentHistory()` before returning. This may extend the button delay after the database has confirmed storage, but individual network timings **have not been measured**.

**Owner's precise preference and conditional fallback:**
1. **First option, only if permanently safe:** Investigate latency and, if feasible, enable navigation once the *authoritative atomic database save* is confirmed, without waiting for independent dashboard/history refresh. Keep durable error handling, correct navigation/account identity, accurate dashboard state on next visit, idempotency, and all test/history data. No optimistic “saved” claim or fire-and-forget submission; do not bypass security for speed.
2. **If the delay cannot be reduced safely:** Keep the wait and restore lightweight, straightforward feedback **in the same position below the result action buttons where the old messages appeared**: first a “Saving…” message, then “Saved in History” after confirmed success. A genuine failure must still show a suitable warning; never show green saved without actual confirmation. The owner referred to wording such as “Hello, I'm saving” followed by “Saved in history”; confirm exact copy with the owner when implementing.
3. **Do not introduce short-term hacks:** Owner explicitly prioritizes a professional, maintainable, reliable long-term LMS over shaving a few seconds from the screen. No temporary redirect, local fake save, bypass of database score verification, or deactivation of security checks.
4. **No work on this item now.** Both normal save status messages are currently intentionally hidden. Their reintroduction is **conditional** on later engineering review and owner confirmation. This deferred request must be mentioned when the owner asks for pending tasks.

**Future acceptance:** Measure stage-by-stage timings (server scoring transaction, HTTP, post-save stats/history refresh), propose minimal correct refactoring only if supported, test Tutor/Timed, stalled/failed network, double submission, account switch, refresh/back, mobile, score corrections, and persisted History. Keep navigation guarded until a secure save has completed. Follow normal staging → tests → owner acceptance → eventual production release. No production changes without separate permission.

## Current checkpoint — Phase 4 Stage 3C accepted visually; security gate and future Save & Exit design next

**2026-10-20 owner update:** Latest Stage 3C Test History/Review refinements were accepted visually by the owner on the development preview, with CI and Vercel READY verified. The detailed cross-account history-access gate and unverified edge cases remain pending before production readiness. Next separately scoped design area is Save & Exit/autosave/Resume (not yet authorized for implementation). **DEFERRED-RESULTS-001 remains deferred** and is not the next task.

## Historical checkpoint — Stage 3B (recorded 2026-10-19; preserved for audit; superseded by Stage 3C)

**Stage 3B-2:** Owner completed real Tutor and Timed mode tests; database verification on 2026-10-19 confirms 74 MCQs + 74 revisions, **39 original summary-only attempts preserved**, **10 new detailed attempts**, and **50 saved attempt item records**. Recent tests include both `tutor` and `timed` with each new attempt having the expected five item records. Current `/api/practice/submit` writes score+items atomically; earlier original five-item score example was 3 correct, 1 incorrect, 1 skipped.

**NEXT WORK — finish replacing old submission infrastructure:**
- Examine and replace/retire the old score-only `POST /api/attempts` endpoint without breaking normal/Phase 4 clients or previously saved History. Confirm no remaining caller; use a safe incompatibility response or unexposed endpoint as justified by owner-approved API design.
- Remove direct `authenticated` INSERT/UPDATE/DELETE permissions and broad own-row ALL policy on `public.attempts` only after verifying the transactional RPC remains authorized, isolated by student, and works for both modes. Apply **versioned additive/forward-compatible SQL on staging only after separately scoped permission** and with rollback/compatibility tests; do not alter production now.
- Test account A/B privacy and forbidden cross-user access; verify legacy 39 summaries still display (without fabricated question details). Validate network retry, errors, and session/account switches; preserve 74 source MCQs.
- Next after stable/secure submission: owner-approved Stage 3B Review Answers and Retake Test integration, while keeping the approved MCQ and Results UI.

**Documentation pointers:** [Master Development Plan](SJN-LMS-MASTER-DEVELOPMENT-PLAN.md) · [Stage 3B Submission Release Gates](SJN-PHASE4-STAGE3B-SUBMISSION-RELEASE-GATES.md) · [Temporary Change Register](SJN-TEMPORARY-CHANGE-REGISTER.md).

**No scheduled reminder:** This is a permanent documented backlog item to recall on demand, not an unattended notification. No source, database, or production changes were required merely to record it.
