# SJN MDCAT LMS Pro — Temporary Changes & Pre-Merge Cleanup Register

**Created:** 2026-10-16 (Pakistan time)  
**Status:** PERMANENT PROJECT PROCESS — requested by the owner. Open items below are **not** release-approved.  
**Scope:** All future short-lived code, preview-only paths, placeholders, temporary feature flags, diagnostic instrumentation, testing workarounds, links/configuration and incomplete staging integrations, wherever they live.  
**Repository / branch at initial audit:** `sumairniz/SJN-MDCAT-LMS` / `sjn-phase1a-foundation`, inspected at `981b8a2103ad190c9203e13dc3a12e74a1539b44`.  
**Release gate:** This register must be reconciled against the actual release diff and all entries explicitly disposed of **before any merge to main**. This document itself does not authorize code/database changes, a merge or deployment.

## 1. Non-negotiable lifecycle for EVERY new temporary change

1. **Before adding it:** Explain to the owner why a temporary change is necessary, the cleaner permanent alternative, impact on the eventual LMS, and obtain scoped approval. Prefer no temporary code. Instrumentation/measurement belongs on a **separately approved diagnostic branch** and must never be cherry-picked into the development branch.
2. **In the SAME commit as any approved temporary change:** Add/update a row in this register with a unique `TEMP-...` ID, introduced date, commit/PR, exact filenames and entry points, environment, owner approval, purpose, risks/affected student flows, dependencies, and a concrete removal-or-replacement plan and trigger. Add an in-code comment referencing its ID where appropriate. **Do not introduce undocumented temporary code**, even for a quick test.
3. **Track its status:** `OPEN`, `REPLACEMENT IN PROGRESS`, `READY FOR OWNER VERIFICATION`, or `RESOLVED`. Record actual test and review evidence, not a guessed PASS. Review this document on every handoff/new chat.
4. **Before proposing a production merge:** Audit the full diff against `main` and search for undocumented experiments, placeholders, test credentials, debug assets, branches, flags, and temporary environment configuration. Every runtime `OPEN` item **blocks promotion**; remove it or replace it with the owner-approved, tested permanent behavior. If the owner wants a limited/inactive feature intentionally shipped, record a specific **separate release-scope decision** after security/UX review; do not silently treat an unfinished preview as production-ready.
5. **Close with evidence:** For each `RESOLVED` item add the resolving commit, tests, manual device/auth review where applicable, owner acceptance and a link to release decision. Delete only disposable scaffolding; **preserve approved interface work and all original MCQs/student data** when replacing preview mechanisms.
6. **Maintain a release gate:** Check [Release Safety Checklist](RELEASE-SAFETY-CHECKLIST.md), [Master Development Plan](SJN-LMS-MASTER-DEVELOPMENT-PLAN.md), and [PR template](../.github/PULL_REQUEST_TEMPLATE.md). The existing `npm run check:release` catches **known diagnostic markers and paths**, not the whole register. Documentation plus human review are currently **not a machine-enforced block**; branch protection/rulesets require separate approval.

**Classification:** `REMOVE` means delete disposable scaffolding; `REPLACE` means implement a real, tested feature then remove its placeholder; `REVIEW CONFIG` means verify/reset external testing-only configuration. A feature developed on staging is **not automatically temporary**: do not erase legitimate, owner-approved final LMS functionality just because a preview flag or placeholder around it is temporary.

### 2026-10-21 — TEMP-P4-006 incremental integration (Results Screen actions)

- Owner authorized making **Results Screen → Review Answers** reopen the existing Phase 4 exam as a **read-only saved attempt**, with Tutor-style feedback even after Timed practice, while leaving **Test History → Review** unchanged. Results Screen → Retake uses the existing immutable-revision exact-order retake path. These are intended **permanent features within the staging preview**, not a new temporary alternate UI.
- `public/sjn-phase4-preview.js` reuses the exam DOM; `public/sjn-phase4-results.js` enables both controls only when authenticated `/api/practice/submit` is confirmed and rechecks the saved attempt through `/api/history/:attemptId`. Review does not call save and locks question options; Retake creates a separate test and submission. Regression source checks in `tests/results-actions.test.js`. No browser storage or database mutation and no alteration to Test History's existing review.
- TEMP-P4-001 (preview gate) and TEMP-P4-006 (result bridge / pre-production cleanup) **remain OPEN**, pending standard-route integration, CI, real owner Tutor/Timed browser acceptance, temporary code diff reconciliation, and separate release authorization. Do not close temp issues just because the staging Results buttons are functional.

## 2. Current known open items — audited 2026-10-16

| ID / state | Exact location and reason | Before production merge (not yet authorized) |
| --- | --- | --- |
| **TEMP-P4-001 — OPEN / REMOVE or integrate** | `public/sjn-phase4-preview.js` checks `?sjnPhase4Preview=1`, maintains preview-specific URLs and mounts the opt-in exam workspace; `public/index.html` imports the preview JS/CSS; `public/sjn-phase4-preview.css` supplies scoped design. This flag deliberately keeps the unfinished Phase 4 exam off the default student route. | After Phase 4 functionality and migration are approved, integrate the **approved exam interface** into the ordinary SPA flow; retire the preview-only URL gate, preview-only copy and stale scripts/conditions, but **do not remove the actual accepted interface**. Regression-test dashboard, wizard, exam, sign-in, logout, account-switching and previous 74 MCQs. A controlled feature rollout requires its own explicit design and approval. |
| **TEMP-P4-002 — OPEN / REPLACE** | `public/sjn-phase4-preview.js`: Report Issue dialog is visual-only; its submit handler says nothing was sent or saved. No authenticated reporting persistence/API was implemented in this stage. | Build reviewed student-scoped report storage/API and future admin-access design, with appropriate authorization, validation, quotas, auditing and tests, **or** remove/disable the unfinished action with truthful UX under a separately approved release scope. Never claim a report was sent unless stored. Do not leak one student's reports to others. |
| **TEMP-P4-003 — OPEN / REPLACE** | `public/sjn-phase4-preview.js`: Exit Without Saving warning and `leaveUnsaved()` discard unfinished work; Save & Exit and autosave are not real. | Implement authorized, account-isolated durable drafts, stable question order/IDs, answers, marks, timer and Resume from history, with refresh/failure tests. Remove the transitional preview-only loss warning after feature acceptance; don't falsely claim data was saved. |
| **TEMP-P4-004 — OPEN / REPLACE** | `public/sjn-phase4-preview.js` delegates Mark for Review to the existing bookmark call. Original 74 inline Biology MCQs lack rows in staging `public.mcqs` (zero at last read-only inspection); `public.bookmarks.mcq_id` has a foreign key to `public.mcqs.id`. | Independently approve and verify stable MCQ identity/migration and per-user mark persistence before enabling this as real. Keep all original MCQ content/explanations/mnemonics and current accounts/history intact. Do not 'fix' by bypassing FK/RLS or using global localStorage. |
| **TEMP-P4-005 — OPEN / REPLACE** | `public/sjn-phase4-preview.js` direct-entry/refresh guard for `/quiz/session` redirects to wizard with a 'cannot restore' note. It intentionally avoids inventing a recovered in-progress test. | After durable draft recovery, implement safe direct entry, refresh and Back/Forward for SPA routes. Remove the temporary fallback message only when actual recovery is verified under the authenticated student's identity and 24-hour deadline. |
| **TEMP-P4-006 — OPEN / INTEGRATE** | `public/sjn-phase4-preview.js` final completion calls existing `window.finishQuiz()`, reusing the old authenticated save and results pipeline; approved complete Phase 4 Results, Review, Retake and detailed attempt history are not yet ready. | Preserve authenticated saving and old records while implementing the approved results/review/retake/history experience. Review the bridge for removal or clean integration; test exact question set/order and immutable historical results. Do not simply delete the current functioning save path. |
| **TEMP-CONFIG-001 — OPEN / REVIEW CONFIG** | Staging Supabase Auth signup/email-confirmation setting was adjusted for convenient test-account creation, per the Master Plan. This is **external configuration**, not proof the production policy is decided. | Audit actual staging and production Auth policies and choose the production email verification, account recovery and anti-abuse design by separate owner approval. **Never copy a staging Auth setting by assumption.** |
| **TEMP-ACCESS-001 — OPEN / REVIEW CONFIG** | Vercel preview share links and their access parameters are temporary external testing access, **not application code**. Trusted friends may use these to access the preview; link access does not bypass LMS student authentication. | Review/revoke unnecessary share permissions at release and verify staging/production deployment protection. Never copy share secrets, tokens, student logins or complete bypass URLs into GitHub, logs or screenshots. |

### 2026-10-16 Stage 3A update — scoped to existing TEMP-P4-001/006

- Owner explicitly approved the Phase 4 Stage 3A Results Screen using the supplied reference: balanced textured accuracy ring, percent + **ACCURACY** label inside, bold white dynamic correct / total beneath, four header/body cards, mobile 2×2 layout, four action controls and subject → chapter → topic collapsed Performance Insights.
- `public/sjn-phase4-results.js` / `.css` are a permanent intended design **inside the temporary Phase 4 preview gate**. The new `/quiz/results?sjnPhase4Preview=1` URL and in-memory-only results lifetime require cleanup/integration under **TEMP-P4-001 and TEMP-P4-006**; do **not** delete accepted Results UI during cleanup.
- Transitional Stage 3A: Review Answers and Retake Test are **disabled** with an honest note until Stage 3B implements secure question-level attempt storage and historical compatibility. Do not ship them as nonfunctional live actions. Performance Insights presently use the just-finished test's in-memory question metadata, never pretend historical analytics exist.
- Existing `window.finishQuiz()` authenticated POST remains the **only** attempt writer; Stage 3A adds explicit success/failure return results for truthful saved-status UI. No database/auth/settings changes. Confirm staging CI, desktop/mobile visuals and real save isolation before closing a release gate.

### Known test blocker — not a patch to add by default

- **TEMP-P4-001 / fresh-visitor activation:** The opt-in preview query parameter is currently lost on guest landing/login/register redirect to `/index.html` (observed in `public/landing.html` and related redirects). Friends opening a preview share link while signed out may therefore see the **old** quiz after login. **No redirect workaround has been implemented or approved as of this audit.** Before changing anything, choose a minimal, future-proof way to handle testing access; if any extra staging-only code is introduced, register it as a separate `TEMP-...` entry in the same commit. Avoid storing share-link credentials in source code.

### 2026-10-18 — Owner-approved staging preview continuity and technical verification
- **TEMP-P4-001 refined — OPEN:** `public/index.html` now preserves the **exact** `sjnPhase4Preview=1` query parameter on direct redirects to `landing.html`; `public/landing.html` returns to `index.html?sjnPhase4Preview=1` only when that allowlisted opt-in is present. Ordinary visitor URLs remain unchanged; never forward other query parameters, open redirects or share-link tokens. Existing account-switch conditional redirects intentionally keep prior security semantics; once the Phase 4 preview becomes the normal interface, retire opt-in URL routing without discarding the approved UI. Owner requested fix after fresh login displayed the legacy quiz.
- **TEMP-P4-007 — OPEN / REMOVE BEFORE PRODUCTION:** `server.js` exposes `GET /api/preview-status` only when Vercel's runtime environment is `preview`, returning nonsecret deployed Git commit when available, Supabase project reference and actual count of database MCQs; `public/sjn-phase4-preview.js` displays this identity on preview Dashboard/Create Test and warns if missing or wrong project. No student/account identifiers, keys or write APIs. This **does not prove** exact question content or full LMS function; the separate verified 74/74 comparison supports question data integrity. Remove before production or replace with a separately approved release identity design. CI/owner real-browser testing still required.
- Owner reports a previous 74-MCQ import completed around an internet dropout and Retry. That explains their experience and is consistent with 74 exact existing records; tool audit provenance remains unverified independently.
- Scope: development branch only; no Supabase DB/schema mutation, Vercel config or production action.

### 2026-10-18 — Corrected follow-up after owner screenshot (TEMP-P4-001 / TEMP-P4-007)

- **Observed regression:** After signing out then signing back in, the owner still landed on `/index.html` (no preview flag), showing the older interface and no status. Opening the original `/index.html?sjnPhase4Preview=1` link while signed in showed **commit `5118f055` and 74 MCQs**; the earlier fix did not address conditional auth-event/cross-tab routes. The owner confirmed the Phase 4 examination appeared and performed as expected when opened in preview mode; do not infer that guest-login acceptance passed.
- **Correction:** all 14 `window.location.replace` auth redirects in `public/index.html` use a single allowlisted `SJNPreviewAuthRoute.to()` function from `public/sjn-preview-auth-route.js`. `public/landing.html` uses the same helper when restoring and signing in. This preserves only `sjnPhase4Preview=1` and discards other query parameters, without using localStorage or treating the preview flag as auth. Production deploy/merge still forbidden.
- **TEMP-P4-007 visibility refinement:** `public/sjn-phase4-preview.js` now labels an unflagged page as **LEGACY EXAM MODE** and an explicitly opted-in one as **PHASE 4 PREVIEW**, in addition to the existing nonsecret build/database indicator when active. A status banner cannot guarantee the MCQ payload, and manual guest/returning-account acceptance is still required.
- **Tests:** `tests/preview-continuity.test.js` covers the real guest → landing → login sequence, cross-tab redirects, URL allowlist and mode banners. Existing account-switch test `tests/foundation.test.js` uses an identity route mock so existing normal auth behavior can be checked. CI and Vercel status must be recorded **after** verification; these notes do not claim completion.
- **Removal condition:** preview-specific helper, legacy indicator and `/api/preview-status` should be removed/merged into standard release identification when the approved new exam replaces the legacy default and real question-history persistence ships. Keep all owner-approved exam/result UI.

### 2026-10-18 — Production visibility guard on staging legacy notice

- After CI and preview readiness were observed for the redirect fix, final review caught that a legacy-mode notice would render even on the unflagged production dashboard. Updated `public/sjn-phase4-preview.js` so the legacy notice renders **only after** the server's preview-only `/api/preview-status` confirms `environment=preview` and the expected staging project. On production (404) it quietly does nothing; no production code or deployment was modified.
- Added regression test in `tests/preview-continuity.test.js`. New CI and owner fresh-login testing are still required to close acceptance; the temporary status endpoint remains tracked under TEMP-P4-007.

### 2026-10-18 — Canonical staging hostname defaults to Phase 4 after second failed guest-login test

- **User-observed failure:** Even after commit `150ec82a`, the normal sign-in journey ended at plain `/index.html` with a LEGACY EXAM MODE warning. Reopening an explicit `?sjnPhase4Preview=1` URL showed the same deployment and 74 staging MCQs. Therefore the previous query-preservation approach did not pass real signed-out acceptance.
- **TEMP-P4-001 — server-side staging-only correction:** `server.js` intercepts GET `/index.html` **before static serving**, only when `VERCEL_ENV=preview` and the request hostname is exactly `sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app`. If the Phase 4 opt-in is missing, HTTP 302 redirects to `/index.html?sjnPhase4Preview=1`, with `Cache-Control: private, no-store`. Existing authorized preview flag continues normally. This is a staging-host rollout default, not an auth bypass, and not a change to production URLs or sessions.
- **Tests added:** `tests/foundation.test.js` real HTTP requests cover unflagged staging, already-flagged URL/no redirect loop, unknown query discarded, other hosts unchanged and production-mode unchanged. `tests/preview-continuity.test.js` verifies routing priority, alias and preview guard. CI/staging deployment and owner fresh sign-in still need verification.
- **Release cleanup:** This is temporary PREVIEW host behavior under TEMP-P4-001 and must be re-evaluated when the final Phase 4 exam becomes the ordinary LMS. Keep owner-approved exam/results code. No Supabase data/schema or production changes.

### NOT identified as temporary cleanup

- Approved desktop Finish button, compact navigator, SJN design and responsive CSS represent intended interface improvements, not code to remove solely because they were tested on staging.
- Permanent account isolation, signed-cookie security, fixed 24-hour expiry, and the locally compiled Tailwind build are intended long-term foundations; they must be preserved and regression-tested, not removed in a blanket cleanup.
- Existing original 74 hardcoded Biology MCQs must never be deleted without a separately approved **lossless** migration.
- No active `SJN_TEMP_DIAGNOSTIC` measurement implementation is reported in the reviewed project documents. **This is not an exhaustive guarantee**; inspect the entire diff and run the release guard before release. Unapproved experiments may exist outside this inventory and must be searched for.

## 3. Required entry template for each future addition

```md
### TEMP-YYYY-NNN — OPEN
- Introduced (date / commit / PR):
- Owner approval and exact scoped purpose:
- Kind: REMOVE / REPLACE / REVIEW CONFIG
- Exact files, code markers, APIs or external config (no secrets):
- Environment(s): development diagnostic branch / staging / other
- Why temporary, what it changes, and why no safer permanent solution is suitable now:
- User/data/security impact; affected login, exam, history and mobile flows:
- Planned permanent implementation or exact safe removal:
- Trigger/deadline (e.g. before main merge), prerequisites and rollback:
- Verification: automated, real browser/mobile, student data isolation:
- Status and evidence for removal/replacement:
- Owner's explicit final release decision:
```

## 4. Production candidate signoff — mandatory human review

- [ ] Inventory matched to full code diff and actual environment configuration; no unregistered temporary code or tokens.
- [ ] Every `OPEN` temporary runtime item resolved/replaced and evidence logged, or a separately approved, reviewed release-scope exception recorded before merge; never merge experimental diagnostics.
- [ ] Feature preview flag is retired/converted safely, without losing the approved examination UI or breaking registration/login.
- [ ] Incomplete Save & Exit, Mark for Review, Report Issue, Results/Review/Retake are either production-ready **or** explicitly out of scope with non-deceptive, safe UI.
- [ ] Staging-only Auth and Vercel sharing/protection settings checked, not copied blindly.
- [ ] `npm test`, `npm run check:release`, diff review, staging device/auth tests, data-preservation and rollback plan completed.
- [ ] Owner separately authorizes: (1) release scope, (2) merge into `main`, and (3) production deployment.

**Handoff instruction:** In every new ChatGPT conversation or developer handoff, open this file and the Master Development Plan *before* proposing code changes. Update this register whenever temporary code/config is introduced, changed or removed. Do not rely on previous-chat memory.
