# SJN MDCAT LMS Pro — Master Development Plan

**Document type:** Living project decision log, roadmap, acceptance criteria and risk register  
**Established:** 2026-10-13 (Pakistan time)  
**Owner:** Academy project owner; changes to application, database, environments and production always require scoped permission  
**Current active code baseline:** `c31033331af9069ad60cb648c7d60cde97a6b625` on `sjn-phase1a-foundation` (cross-tab authentication synchronization; CI passed, staging READY)  
**Production code baseline:** `de519ae01ef4093dea04e92970b27e595f0cf56e` on `main`  
**Pull request:** [PR #1](https://github.com/sumairniz/SJN-MDCAT-LMS/pull/1), **DRAFT — DO NOT MERGE without separate authorization**

## 2026-10-17 — Owner's bank separation correction and future product ideas

- **CONFIRMED OWNER CORRECTION:** The same MCQ should **not** appear in both ordinary banks. Previous assistant suggestion to share a question across both banks was rejected. One ordinary bank per question is the present design premise for the 74-question migration.
- **PRELIMINARY OWNER IDEAS (NOT FINAL REQUIREMENTS):** Course chapter/multi-chapter/mock tests contain separately authored/managed premium MCQs, not regular bank questions. Chapter/topic names should not be visible during course tests. Owner may manually publish selected premium MCQs into one bank after a course ends; no automatic release or anonymous answer-key exposure. Future overall Analytics may have separate Question Bank (total/correct/incorrect/skipped; subject/chapter/topic) and Courses/Tests (subject and test-score trajectory) sections. Future Mistake Diary may let students classify errors manually (information, concept, silly, retention), with exact categories deferred.
- **CURRENT PRIORITY UNCHANGED:** Phase 4 MCQ Database Foundation, then safe staging migration of 74 original Past Papers Biology MCQs after a separately reviewed SQL/import plan and owner approval. Later review/retake, reporting, marking and Create Test revisions each require separate scope. See [Future Question Banks & Create Test](SJN-FUTURE-QUESTION-BANKS-AND-CREATE-TEST.md) and [Database Foundation Review](SJN-MCQ-DATABASE-FOUNDATION-REVIEW-2026-10-17.md).
- **Documentation-only:** No new app feature, database migration/data change, hosting configuration change or production release is authorized or performed with this update.

## 2026-10-17 — Documentation-first handover and current MCQ Database Foundation (OWNER REQUESTED)

- **Current checkpoint:** Phase 4 **MCQ Database Foundation, read-only architecture review**, before moving/copying any of the original 74 Biology MCQs or implementing Question-Level Test History/Review/Retake. The current accepted opt-in Results Screen source baseline is development commit `656f97de1ca8e00d3bd7f831286565c0bc060792`; documentation-only updates may move HEAD beyond this baseline.
- Owner's changeable long-term direction—including **Past Papers Question Bank** and **SJN Question Bank**, future Used/Unused/Incorrect/Marked filters, one persistent Mark for Review/Bookmark, History actions, later Analytics, future Admin Panel and possible Light appearance—is recorded with CONFIRMED vs PROPOSED distinctions in [Future Question Banks & Create Test](SJN-FUTURE-QUESTION-BANKS-AND-CREATE-TEST.md). **Not permission to implement future features now.**
- Live read-only staging Supabase and current source audit: [MCQ Database Foundation Review](SJN-MCQ-DATABASE-FOUNDATION-REVIEW-2026-10-17.md). Snapshot: **0** database MCQs, **74** inline questions, **37** testing attempts, **0** bookmarks, **4** testing profiles; current `mcqs` schema can represent original question fields but current `attempts` has no question-level answers. RLS checked. Staging and production remain separate.
- Owner confirms no official students yet and is **open to deletion of testing attempt history if required**, not a blanket instruction to delete. Backup/effect summary and **separate explicit approval** required before data reset.
- The permanent non-secret [Developer / AI Handover & Access Guide](SJN-DEVELOPER-HANDOVER-AND-ACCESS.md) defines how future ChatGPT/Gemini/human developers recover project access, current baseline, service locations and context. **GitHub branches have no passwords. Never put provider credentials, tokens, database passwords or student-identifying data in repository documentation.** Use provider role invitations, password manager and separate owner-approved secret access.
- Owner approves concise **significant architectural decision / experiments / outcome / tests** documentation tied to Git history, not verbose descriptions of every small edit. Every temporary runtime change remains tracked under [Temporary Change Register](SJN-TEMPORARY-CHANGE-REGISTER.md). No application, database, hosting or production configuration modification is authorized by this docs commit.
- **Next action:** Review precise schema/migration plan for 74-question import and future two-bank representation; ask the owner before any SQL DDL/DML, staging data reset, code source-switch or production action.

> **Source-of-truth rule:** Mark a decision **CONFIRMED** only when the owner actually approved it. Label findings from source code **OBSERVED IN CODE**, test results **VERIFIED**, and design proposals **PROPOSED**. Do not fill gaps in previously agreed MCQ requirements from memory. Preserve the complete original chat discussion when available and obtain confirmation for any missing detail.

## 2026-10-16 — Permanent temporary-change inventory — OWNER REQUESTED

- The owner explicitly requires **every** future temporary preview feature, workaround, diagnostic, placeholder and staging-only configuration to be documented **when introduced** with exact locations and a safe remove/replace plan for production. No reliance on ChatGPT conversation memory.
- The persistent source of truth is [SJN Temporary Changes & Pre-Merge Cleanup Register](SJN-TEMPORARY-CHANGE-REGISTER.md). It inventories current Phase 4 preview-only paths, incomplete Report Issue/Save & Exit/Mark for Review integrations, preview route fallback, legacy submission bridge, staging signup settings and external preview-share access.
- Before **any** merge into `main`, reconcile that register with the diff, resolve/review each open item, preserve approved permanent features, run required tests and obtain separate owner authorizations. The existing `npm run check:release` only detects known diagnostics; it does not automatically enforce this new register.
- Documentation process only in this change: **no application code, Supabase data/config, Vercel settings or production release authorized**.

## Permanent release-safety process — OWNER APPROVED 2026-10-14

- The owner explicitly approved repository-persistent safeguards so no future assistant or developer must rely on chat memory to remove temporary diagnostics.
- The permanent checklist is [RELEASE-SAFETY-CHECKLIST.md](RELEASE-SAFETY-CHECKLIST.md). Experimental measurement code belongs on a separately approved, short-lived diagnostic branch with independently verified staging-only configuration, **never** as a casually merged change into the primary development branch.
- GitHub CI runs `npm run check:release` as well as `npm test`, checking known temporary instrumentation markers, paths and tracked private environment files. A [pull-request template](../.github/PULL_REQUEST_TEMPLATE.md) prompts manual full-diff review, account/MCQ regression testing, environment checks and rollback planning.
- **Limit:** these checks do not prove an arbitrary diff is safe or enforce permissions. No GitHub branch protection/rulesets have been configured in this step; that would require separate approval and access. PR #1 remains draft. The owner must separately approve a future production merge and deployment.
- **Staging-only implementation commit:** `058a9e008e6b7f900cbe0c40378666c1a5c4a001` (release-safety documentation and CI); automated verification to be assessed independently.
- The black-screen issue remains open. No temporary performance instrumentation or production changes were made as part of these guardrails.

## 2026-10-14 — Tailwind initial-render performance change (STAGING ONLY)

- **Owner approved** a permanent build-time CSS optimization, separate from temporary diagnostics. Dashboard browser Tailwind CDN compiler and inline `tailwind.config` were replaced with a locally served `/dashboard.css` and equivalent pinned Tailwind v3.4.17 configuration. `npm install` generates and checks CSS using the `postinstall` step; GitHub CI also runs explicit build and selector checks.
- Code commit `1ba6ce925aedb675080ea0980bdd34ab64fbe12e`: both GitHub workflows PASSED and Vercel branch staging preview READY at that commit. No production merge or database change.
- **Owner browser verification PASSED (2026-10-14):** the owner explicitly reported "Everything works and the design looks correct" on staging after the Tailwind migration. This confirms the owner's overall functional/visual check; it is not evidence of exhaustive device-specific or 24-hour session regression testing. Keep detailed responsive/edge-case checks on the broader release checklist. **Measured speed improvement PENDING:** request a new Chrome Network waterfall (same conditions as earlier) and compare page rendering/auth response timing. Automated selector checks alone do **not** prove visual parity.
- Existing source shows the server authentication bootstrap still includes Supabase refresh and student-summary queries. Browser screenshot previously measured ~1.19 s refresh response waiting, which this CSS migration cannot directly shorten. No performance-speed guarantee or backend change is implied.

## 2026-10-14 — Tailwind before/after review and Supabase read-only timing investigation

- **Owner feedback:** after successful visual/functionality verification, the owner reports that the *black/skeleton screen delay feels unchanged*. Owner suggested reverting the Tailwind conversion if it was worse. The recommendation is **retain the compiled CSS for now**: screenshots show DOMContentLoaded 1.40 s → 1.08 s, Load 1.80 s → 1.21 s, Network Finish 3.92 s → 3.37 s, though these are different single navigations and not a controlled benchmark. Tailwind is not the direct solution to the remaining auth/summary wait. Revert if controlled measurements, visual regressions, or maintenance evidence warrant it; do not preserve a change out of sunk cost.
- **Browser auth request:** `refresh?bootstrap=1` was ~1.19 s before and ~1.13–1.81 s in two subsequent requests; insufficient to claim auth improvement or regression. The backend refresh does Supabase Auth refresh *followed by* three parallel, RLS-scoped student-summary requests (profile, attempts and bookmarks) before responding and revealing the dashboard.
- **Read-only staging Supabase log aggregation (last 24 h at inspection):** edge `response.origin_time` field median (raw numeric value; not independently established as equivalent to full client latency) token POST 228 across 177 calls, GET profiles 621 across 179, GET attempts 612 across 235, GET bookmarks 617.5 across 158. Auth service `/token` `refresh_token` requests had median raw `duration` 11,403,544 across 124 calls; raw field units were not verified. These are aggregate signals, not traces correlated to a single Chrome refresh. No identities, tokens, or student-specific data retrieved.
- **Safety gate:** Vercel's environment and project metadata API requests returned 403 (scope authorization unavailable), so the staging-only Supabase configuration of a *new* diagnostic branch cannot be independently verified. **Do not push or deploy diagnostic instrumentation** until environment isolation can be established. No diagnostic code/branch deployed. This read-only investigation yielded actionable information without modifying application/backend behavior.
- **Next design question (not authorized for implementation):** whether to separate mandatory verified-identity bootstrap from deferred personal summary rendering with a neutral, per-user loading state, preserving no stale student data, RLS, multi-tab coordination, failure behavior, original MCQs and 24-hour session deadline. Require a separately approved exact patch and automated/browser tests; do not optimize away required authentication checks.

## 2026-10-14 — Returning signed-in student initial black-screen remediation (STAGING ONLY)

- **Owner clarification:** the black screen occurs when a student closes the browser tab, then opens the site's root URL in a new tab during an existing valid 24-hour session. It does *not* occur on direct login or on ordinary dashboard refresh. Gemini's recording review reported ~2.8 s black before the existing dashboard skeleton; this duration is third-party/user-reported, not independently captured.
- **Root cause supported by code:** the root route serves `landing.html`, which deliberately hid both the guest landing and the normal session-check logo/message while waiting. The saved-session path performed Supabase refresh, then a separate `/api/me` verification, redirected to `index.html`, and dashboard independently performed `/api/auth/refresh?bootstrap=1`.
- **Owner approved staging-only permanent change:** render the existing landing `#session-check` as a zero-dependency branded "Restoring your session…" status with inline CSS and accessible reduced-motion spinner. For the normal cookie-backed return, stop issuing redundant `/api/me`: the server's refresh endpoint validates Supabase identity, signed-cookie user, and original 24-hour deadline. Dashboard `loadAccount()` still requires its own verified auth and RLS-scope summary before uncovering student data. The legacy localStorage-token migration branch still verifies through `/api/me`; expired/revoked cookies still show the public landing; failures show retry, and `authSubmitting` blocks redirects.
- **Owner returning-student browser acceptance PASSED (reported 2026-10-14):** owner shared a second video analysis that reports the pitch-black blank period is eliminated, a branded `SJN` / “Restoring your session…” indicator appears within ~0.5 seconds after Enter, and total navigation-to-dashboard time decreased from approximately 4.5 s to 3.5 s (~1 s, ~22%). The owner described the splash-to-skeleton transition as seamless. These are owner-supplied, recording-based estimates, **not independently timed or controlled browser measurements**. Retain this UX improvement; do not conflate immediate visual feedback with an instant authenticated dashboard.
- **Automated/deployment acceptance:** both GitHub workflows at fix/test commit `0ff848c918c79d86109cf88e54d3edcfb3412090` PASSED. The staging preview was verified READY on the same commit. The earlier first-attempt commit failed tests due to missing mocked UI handlers in the new test harness; corrected in the subsequent test-only commit, with no unaddressed CI failures at the accepted HEAD.
- **Owner manual regression PASS (2026-10-14):** following the specific four-point staging test request, owner responded **“all are working fine.”** Record as owner-confirmed PASS for (1) log out, close tab, reopen root URL → public landing; (2) regular login → dashboard; (3) switch Student A → Student B without mixed personal data; (4) start an MCQ, switch to a Google tab and return → quiz preserved. Returning-session visual regression was separately PASS above. No independent browser replay was captured by the assistant; owner is the test source.
- **Remaining release gate:** exact 24-hour hard expiry, broader browser/device coverage, simultaneous-tab logout/account-switch edge cases, and full security/data acceptance remain subject to dedicated release testing; do not infer these are exhaustively verified from this four-case PASS. Normal returning-student landing `/api/me` was removed; mandatory Supabase refresh and dashboard verification remain. Do not change `main` or production without separate explicit owner authorization.

## 2026-10-14 — Reproducible CSS build and npm dependency maintenance (STAGING ONLY)

- **Owner approval:** proceed with dependency lockfile and CSS reproducibility checks after owner confirmed all four auth/MCQ return regression scenarios PASS.
- **Implementation:** npm-generated and committed `package-lock.json` (lockfile v3, 164 package entries) from the repository's existing `package.json`; pinned existing Tailwind v3.4.17. CI installs with `npm ci --ignore-scripts --no-audit --no-fund`, builds stylesheet twice, compares bytes using `cmp`, verifies required selectors, and retains authentication/RLS and release-safety tests. Added lockfile consistency and Tailwind integrity assertions.
- **Scope:** no changes to CSS design rules, HTML, JavaScript application behavior, authentication, Supabase settings, student data, original MCQs, or Vercel production configuration. Generated CSS still produced by the existing `postinstall` path on deployment. No paid service.
- **Validation PASS (2026-10-14):** both GitHub CI workflows completed successfully for code commit `280985e6929c8f8385bbd00b7c2f1f5e22df22b8`, including locked `npm ci`, existing authentication/student isolation tests, twice-built byte-identical CSS comparison, critical CSS selector checks, and release-safety guard. Vercel development-branch staging preview verified READY on the same code commit. Production remained READY at original `de519ae01ef4093dea04e92970b27e595f0cf56e`; `main` unchanged. No additional manual browser styling recheck was reported for this strictly maintenance-only change. Never merge or deploy production without separate owner approval.

## 1. Mission and non-negotiables — CONFIRMED

Build a long-term, professional, secure and maintainable MDCAT learning business, rather than a temporary demonstration. Optimize the existing architecture before adding a new one. Do not sacrifice security, correctness, scalability or maintainability to achieve a superficial loading-time target. Explain realistic limits plainly.

- **Budget:** Free services and free tiers only unless the owner separately approves a charge.
- **Production safety:** No production code, Vercel settings, Supabase schema, real student data or `main` modifications without separate explicit authorization. Never merge PR #1 automatically.
- **Student preservation:** Never delete or overwrite original student data or original **74 hardcoded Biology MCQs**. Verify preservation before any MCQ migration or redesign.
- **Development isolation:** GitHub branch `sjn-phase1a-foundation` deploys to a branch-restricted Vercel Preview connected only to staging Supabase.
- **Change quality:** Test, inspect diffs, seek approval for scoped changes, preserve a recovery path and report failures without disguising them.
- **Communication:** Give simple, clear status; don't promise guarantees that weren't measured.

## 2. System map — VERIFIED / OBSERVED

| Component | Location | Current meaning |
|---|---|---|
| Production site | https://sjn-mdcat-lms.vercel.app/ | `main`, production Supabase; do not alter |
| Staging preview | https://sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app/ | Preview development testing only |
| GitHub repository | https://github.com/sumairniz/SJN-MDCAT-LMS | Version-controlled source |
| Development branch | `sjn-phase1a-foundation` | Working baseline and this plan |
| Production Supabase | `yapvnevvjfewvafbjcgc` | Real data, untouched |
| Staging Supabase | `aozknkrwafowsrehdwlr` | Testing only |
| Main application | `server.js`, `public/index.html`, `public/landing.html` | Express APIs and dashboard/landing pages |
| Automated tests | `tests/foundation.test.js` | Mock-based auth / session / UI source assertions |

Staging has seven public tables with RLS: `profiles`, `mcqs`, `courses`, `past_papers`, `resources`, `attempts`, `bookmarks`. New users get profiles through an Auth signup trigger. Original 74 Biology questions are currently hardcoded; staging `mcqs` remains empty. Do not infer that an empty database table means the hardcoded bank has disappeared.

## 3. Explicitly decided authentication behavior — CONFIRMED

- Public landing page provides **Register** and **Login**. The authenticated dashboard provides **Sign Out**.
- Desired easy student onboarding: name + email + password, immediate signup, without mandatory email confirmation. **Staging-only** confirmation-setting workaround was approved for testing; production authentication policy and anti-abuse/recovery arrangements require separate decision before launch.
- **Fixed 24-hour session** from successful login. Active use, refresh or token rotation must **not** move the original deadline. The server must deny protected requests when expired; the browser should return to login. New login starts a new deadline.
- Refresh tokens stay in signed/HttpOnly cookie-based server session flow. Student access must be isolated by Auth and Supabase RLS.
- Unauthorized dashboard access must not reveal personalized content.
- A temporary network failure must not expose private content or falsely report a verified session.

**OBSERVED IN CODE:** Staging `server.js` enforces a 24-hour timebox, cookie signatures, refresh-token rotation and Auth user matching. Frontend has an expiry timer and multi-tab logout broadcast for explicit logout. Mock-based tests cover the boundary, but real 24-hour browser behavior and multi-tab failure cases remain to be tested.

## 4. Phase status and acceptance gates

### Phase 1 — Loading UX and speed: **FUNCTIONAL BASELINE ACCEPTED; UX REVIEW OPEN**

**Verified by owner:** login and dashboard refresh both felt **under 2 seconds** in recent manual staging checks, compared with previously observed ~3–4 seconds. This is not a formal benchmark or a universal guaranteed load time.

**Observed:** The previous `Verifying your student session…` text is no longer in the latest source. A black/skeleton transition can still appear while the server checks auth and loads personalized data. Dashboard currently imports browser Tailwind CDN, external icons and fonts. Landing-page session routing can cause an extra redirect for already authenticated visitors.

**Decision:** Do not rebuild the layout or remove security checks simply to eliminate a visual transition. Capture browser timings first if the UX remains objectionable (Network request waterfall; navigation, first paint, auth refresh/bootstrapping); make targeted improvements only if benefit outweighs risk. Tailwind local compilation is a **proposal, not an approved mandatory change**. Any code change requires scoped owner approval.

**Exit gate:** Core navigation performs acceptably, no blocker to security/MCQ development, and the remaining transient loading state is recorded as an open UX item rather than falsely marked fixed.

### Phase 2 — Authentication and student isolation: **CORE STUDENT PRIVACY AND CROSS-TAB MANUAL TESTS PASS; EDGE CHECKS OPEN**

**Verified 2026-10-13 in staging, read-only:**
- **2 Auth users, 2 matching profiles**.
- **6 saved attempts across 2 distinct students**: two attempts belong to one, four to the other. No individual identities or emails recorded in this document.
- Owner reported the second account started at zero history before attempting MCQs.
- RLS is enabled on all seven public staging tables. Attempts/bookmarks policies scope rows to `auth.uid() = user_id`; profiles to `auth.uid() = id`.
- Anonymous cannot read student attempts/profiles; authenticated users do not have permission to update the `profiles.role` column. The privileged signup-trigger function is not directly executable by `anon`.
- Supabase Security Advisor has one warning: built-in leaked-password protection disabled; official built-in feature needs a paid plan. **Do not upgrade.** Prefer no-cost password requirements and anti-abuse mitigations during a separately approved security task.
- The latest GitHub CI checks passed on the current development baseline.

**Verified after the 2026-10-13 frontend history isolation fix:**
- The owner switched between two staging accounts and confirmed both now display **only their own saved test history**; no cross-account mixing was visible.
- The source of the bug was unscoped browser `sjn_student_profile` state (including a delayed restore). The fix uses the authenticated `/api/history` endpoint and server-derived totals; the endpoint checks the signed-in user and responds with the corresponding user ID. Older browser storage was left untouched and is no longer used for personal history.
- GitHub CI **2 successful runs** and staging Preview **READY** for fix commit `659e375924a542e48e4fdf33c88c20d5c6e84891`.
- Read-only DB verification after owner testing: **2 Auth users, 2 profiles, 6 saved test rows, 35 attempted MCQs, 2 different students with records, 0 staged MCQ rows**. The original 74 Biology questions remain hardcoded in the app; no database migration was performed.
- Owner previously reported manual checks passed for logout propagating across two tabs, navigating away from protected dashboard after logout, and a brief network interruption. These are limited manual observations, not complete browser integration coverage.

**Multi-tab behavior CONFIRMED AND IMPLEMENTED ON STAGING (manual verification pending):**
- **One currently active student account per browser profile**, shared securely among tabs.
- Logging into Student B replaces Student A's account across ordinary tabs. Logging out in one tab logs out all tabs. A tab must never continue displaying Student A's protected information after account B becomes active; verify session identity and clear the old workspace.
- Two independent students should use separate browser profiles or an Incognito window rather than two conflicting accounts in ordinary tabs.
- Preserve the original fixed 24-hour login deadline; avoid racing refresh-token rotations between tabs.
- The owner gave explicit scoped staging/development-branch approval. The feature is implemented at `c31033331af9069ad60cb648c7d60cde97a6b625`; two GitHub CI checks passed and staging was READY. It uses browser storage events carrying **no credentials**, a same-origin Web Lock for cookie-changing requests where available, and a read-only signed-cookie `GET /api/auth/session` status check for resumed tabs. Browsers without Web Locks retain server identity validation, but simultaneous-refresh handling may be weaker and needs testing.

**Owner browser verification of all four basic multi-tab scenarios — PASSED (2026-10-13):** same Student A in two tabs; logout propagates; after switching to Student B, tabs use B without displaying A's history; refreshing tabs retains B and B's history. These are owner-reported manual observations, not independently instrumented browser logs. Supabase privacy fix was also separately owner-verified.

**Still pending — do not claim full Phase 2 complete:**
1. Background/suspended tab recovery and high-concurrency refresh under overlapping requests; verify no old student information can reappear.
2. Test simultaneous token refresh rotation across tabs and browsers without Web Locks while preserving the fixed 24-hour session boundary.
3. Verify exact 24-hour expiry in a real browser where practical; automated simulated expiry checks have passed.
4. Broader intermittent/slow network, retry, failed-save and multi-device account-change behavior, keeping student data isolated.
5. Before production: signup without email verification needs bot protection, password recovery and account-ownership risk review.

### Phase 3 — Foundation freeze and handoff: **BASELINE DOCUMENTED; FINAL ACCEPTANCE PENDING EDGE CHECKS**

- Record active **application baseline** `c31033331af9069ad60cb648c7d60cde97a6b625`. Keep PR #1 **DRAFT** and `main` unchanged.
- Save decisions and outstanding questions in this living file; future updates should add dated, attributable decision-log entries with explicit owner approval.
- Preserve existing UI, original 74 Biology questions, test history, schema and RLS. No speculative redesigns.
- Audit result: no immediate need for another speed-focused architecture change; prioritize privacy/session edge cases.
- Handoff to MCQ planning can proceed after the owner accepts the foundation baseline with documented non-blocking issues. Do **not** imply a production launch is approved.

## 5. MCQ interface — after foundation gates are accepted

**Confirmed constraints:** Focus on previously agreed MCQ interface design; protect all 74 original Biology MCQs and existing quiz functionality. Do not start implementing until the current student-session and account-switching foundation issues have passed their staging checks. Review the original discussion/specification before making changes.

**Existing features OBSERVED IN SOURCE, not a reconstruction of every approved design choice:** Subject/chapter/topic selection wizard, practice question and answer choices, previous/next navigation, Tutor-style feedback and explanations, mnemonic/tip content, timer/test modes, bookmarking controls, and results/history.

**MCQ design details requiring verification at the start of that phase:** Exact layout, user interactions, modes, timer rules, navigation rules, answer review, progress/results views, mobile breakpoints and desired upload/admin workflow as agreed in the original chat. If not verifiable, ask **only for missing details**, not a fresh design from scratch.

**Proposed MCQ work sequence (subject to approval):**
1. Recover original design decisions from chat, project uploads and code; build confirmed checklist.
2. Compare desired interface with current behavior and preserve already-correct parts.
3. Make a focused implementation plan and get approval for dev-branch changes.
4. Implement and test interface against all 74 questions and mobile/desktop.
5. Separately prepare database-backed question migration and bookmarks; staging first and **no loss**.
6. Check student attempt persistence and cross-student isolation before release.

## 6. After MCQ interface

- MCQ data storage/migration, production-ready bookmarks, course resources and test results.
- Free-plan quota/performance assessment for expected enrollment and concurrency (account count is not the same as active-user capacity).
- Account recovery, user verification decision, signup abuse prevention, rate limiting and final public Auth email policy.
- Mobile/accessibility testing, error handling, functional QA, load testing and monitored rollout.
- Production-only changes and PR merge **only after a separate explicit owner go-ahead**.

## 7. Action queue

| Priority | Action | Responsible | Status |
|---|---|---|---|
| P0 | Preserve current staging source and baseline; do not merge | Assistant | DONE |
| P0 | Record verified foundation decisions in this plan | Assistant | DONE |
| P0 | Read-only staging account/attempt counts and RLS policies | Assistant | DONE |
| P1 | Owner checks both students' actual history screens after each has attempts | Owner + assistant | DONE — owner confirmed isolated histories on staging |
| P1 | Owner checks logout across two tabs | Owner + assistant | DONE — manual check, broader cases pending |
| P1 | Validate 24-hour expiry and network interruption cases | Owner + assistant | PARTIAL — brief network interruption passed; real expiry pending |
| P1 | Implement safe, synchronized cross-tab login/account switching after scoped approval | Assistant | DONE — implemented; CI PASS; owner confirms all four basic manual tests PASS |
| P2 | Diagnose remaining blank/skeleton loading delay with browser measurements | Owner + assistant | OPEN, NONBLOCKING |
| P2 | Decide whether remaining brief loader is acceptable or needs measured optimization | Owner | OPEN, NONBLOCKING |
| P2 | Reconfirm exact previously agreed MCQ interface specifications | Owner + assistant | NEXT SESSION |
| P2 | Design and implement MCQ interface on dev branch only, once approved | Assistant | NOT STARTED |
| P3 | Consider local compiled CSS after measurement and visual regression plan | Owner + assistant | DEFERRED |
| P3 | Production go-live checklist, pricing limits and auth safeguards | Owner + assistant | LATER |


### 2026-10-13 — Ordinary tab-return loading fix (staging only)

- **Owner report:** leaving an in-progress MCQ to visit another browser tab and returning caused a 1–2-second skeleton/black loading overlay, although the MCQ remained at the same position.
- **Confirmed in code:** `visibilitychange` covered the workspace on tab hide, and `focus`/tab activation invoked `verifyReturnedTab()`, which performed a network status check and kept the overlay visible until it returned. This is distinct from initial login or full-refresh loading.
- **Scoped owner approval:** remove unnecessary overlay/network verification on ordinary tab switching while maintaining account change, logout, and fixed 24-hour expiry protection. No production changes authorized.
- **Implemented:** commit `5f752e88ff3df0095282450d4bab8df770a27cfe` on `sjn-phase1a-foundation`: ordinary hide/focus no longer covers the MCQ or contacts the server; synchronous comparison with cross-tab authentication change signals protects sleeping tabs; real account change broadcasts still conceal the old account; BFCache restoration continues to verify the session.
- **Checks:** both GitHub workflows passed, staging preview READY. **Real-browser UX and multi-tab regressions still require owner validation**. These changes do not solve the separate initial-login/page-refresh black-screen concern.
- **Next:** ask owner to leave an MCQ in progress, visit another tab and return, then re-check synchronized logout/account switching. After successful checks, investigate first-load black screen with timing evidence before proposing another fix.


### 2026-10-13 — Two already-open LMS tabs: background login regression (staging)

- **User-confirmed regression:** after the ordinary Google/LMS tab-switch loading fix, one previously opened logged-out LMS tab could remain behind its session guard when another existing tab signed in. Freshly opened tabs after login worked; synchronous sign-out still worked. This did **not** occur in the earlier successful multi-tab test.
- **Code cause:** authenticated `loadAccount()` only removed the guard if `!document.hidden`; a second dashboard loading in a background tab left the guard visible after successful verification. The prior tab-switch fix deliberately removed the focus-time recheck that had inadvertently cleared it.
- **Owner approved** development/staging-only correction. Commit `e55aa60d70addb7e49f3573eb8b43ce92e7a2318` now removes the guard unconditionally **after successful authentication**, plus a pending-account-change check before rendering personal data.
- **Verification:** two GitHub workflows PASSED and branch staging preview READY at the code commit. Automated tests execute actual `loadAccount` for visible and background tabs and ensure a pending account change does not uncover old data. **Browser confirmation still needed** for two already-open LMS tabs, cross-tab sign-out/account switching and a return from Google mid-MCQ.
- **Scope:** No student records, 74 hardcoded Biology MCQs, production, GitHub `main`, auth settings or database schema changed. The distinct first-load/refresh black-screen analysis remains open.

## 8. Decision log

- **2026-10-12:** Separate staging Supabase project and development-only Vercel Preview configured, migration/RLS and trigger hardening applied under scoped approval. No student records copied from production.
- **2026-10-13:** Owner confirms onboarding tests, separate second student account, current **under-2-second** subjective login/refresh results and preference for stability over risky speed shortcuts.
- **2026-10-13:** Owner instructs us to create this master plan, complete foundation Phases 1–3 as far as safely possible today, and **postpone MCQ implementation until tomorrow**.
- **2026-10-13:** Master plan created in development branch; this is **documentation only** and not approval to deploy or merge code to production.
- **2026-10-13:** Scoped owner approval led to history-isolation fix deployed at `659e375924a542e48e4fdf33c88c20d5c6e84891`. Both CI workflows passed. Owner manually confirmed the separate account histories display correctly. Supabase staging record counts remain preserved.
- **2026-10-13:** Owner accepted synchronized multi-tab login policy and explicitly approved development/staging-only implementation.
- **2026-10-13:** Cross-tab authentication update committed as `c31033331af9069ad60cb648c7d60cde97a6b625`; both GitHub CI workflows succeeded and preview was READY. No production release or PR merge.
- **2026-10-13:** Owner reports **all four basic staging multi-tab tests passed** (two tabs with same account, synchronized logout, account B switching without A's history, and two-tab refresh). Mark core tests verified by owner; long-duration expiry/refresh races and slow-network checks remain pending. Next priority is measured diagnosis of the blank/skeleton screen; do not replace it with an unmeasured cosmetic change.

## 9. How to update this document

At each session's end:
1. Enter newly confirmed decisions, date and approving party.
2. Move tests to DONE only with supporting evidence; keep unverified items PENDING.
3. Update branch commit/CI/deployment status and note whether environments changed.
4. Preserve unresolved questions rather than guessing.
5. Never record student passwords, private email addresses, tokens, secrets or personal data.

**Historical 2026-10-13 instruction (superseded by the dated current checkpoint at top):** The earlier multi-tab and initial-render diagnosis instructions were for the initial foundation stage. Do not treat them as the current priority. The current next work instruction is Phase 4 **MCQ Database Foundation**, as documented above.

## 2026-10-15 — Phase 4 development startup and SPA architecture approval

- **Owner authorized Phase 4 development** on the existing development/staging branch, subject to existing preservation/testing gates and **no production change or draft PR merge** without separate approval.
- Preservation/audit/docs baseline commit `02c0e1319a3ad83c259c71d9909ef47ddcacba4f`: original 74 MCQs fingerprint checks, staging schema audit, v1.2 confirmed interface decisions. Both GitHub CI workflows passed; Vercel staging preview READY. **No student UI or Supabase data changed** in that commit.
- **Owner then reversed the conditional `quiz.html` preference and APPROVED SPA-style dynamic quiz navigation.** A dedicated *visual* examination workspace will replace the dashboard UI during tests without full page reload. See `docs/SJN-PHASE4-INTERFACE-BLUEPRINT-v1.3.md` and `docs/SJN-PHASE4-SPA-AND-SCALE-DECISION.md`. Do not implement a disconnected `quiz.html`.
- Owner expects future question-bank scale of 20,000–50,000+ MCQs and later a separately specified full Admin Panel to manage MCQs, courses, reports, resources and academy operations. This is **architectural direction, not permission to implement the Admin Panel now**. Retain all 74 hardcoded questions; future PostgreSQL/Storage organization and import tooling must be scoped and reviewed separately.
- **Owner's engineering feedback:** proactively explain technical alternatives and their tradeoffs in plain English; recommend sound architecture for the real SJN implementation instead of making the owner discover alternatives or decide unexplained implementation details.
- **Next technical work:** SPA-focused exam workspace with regression checks for auth, Back/Forward, direct-link refresh, no data-loss, current 74-MCQ bank and the approved styling. Staging only, incremental and reversible. User acceptance and production release remain separate decisions.
