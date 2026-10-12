# SJN MDCAT LMS Pro — Master Development Plan

**Document type:** Living project decision log, roadmap, acceptance criteria and risk register  
**Established:** 2026-10-13 (Pakistan time)  
**Owner:** Academy project owner; changes to application, database, environments and production always require scoped permission  
**Current active code baseline:** `bb25cc02f217b29a13087ffb97a1c0354a713363` on `sjn-phase1a-foundation`  
**Production code baseline:** `de519ae01ef4093dea04e92970b27e595f0cf56e` on `main`  
**Pull request:** [PR #1](https://github.com/sumairniz/SJN-MDCAT-LMS/pull/1), **DRAFT — DO NOT MERGE without separate authorization**

> **Source-of-truth rule:** Mark a decision **CONFIRMED** only when the owner actually approved it. Label findings from source code **OBSERVED IN CODE**, test results **VERIFIED**, and design proposals **PROPOSED**. Do not fill gaps in previously agreed MCQ requirements from memory. Preserve the complete original chat discussion when available and obtain confirmation for any missing detail.

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

### Phase 2 — Authentication and student isolation: **MOST BASIC CHECKS PASS; EDGE CASES OPEN**

**Verified 2026-10-13 in staging, read-only:**
- **2 Auth users, 2 matching profiles**.
- **6 saved attempts across 2 distinct students**: two attempts belong to one, four to the other. No individual identities or emails recorded in this document.
- Owner reported the second account started at zero history before attempting MCQs.
- RLS is enabled on all seven public staging tables. Attempts/bookmarks policies scope rows to `auth.uid() = user_id`; profiles to `auth.uid() = id`.
- Anonymous cannot read student attempts/profiles; authenticated users do not have permission to update the `profiles.role` column. The privileged signup-trigger function is not directly executable by `anon`.
- Supabase Security Advisor has one warning: built-in leaked-password protection disabled; official built-in feature needs a paid plan. **Do not upgrade.** Prefer no-cost password requirements and anti-abuse mitigations during a separately approved security task.
- The latest GitHub CI checks passed on the current development baseline.

**Still pending — do not claim complete:**
1. Browser A and B must independently inspect histories and confirm neither sees the other's entries after both have attempts.
2. Explicit logout in one tab -> other tab should not retain usable private access.
3. Fixed expiry at exactly 24 hours, including asleep background tab; verify with safe automated test and separate real integration validation when practical.
4. Lost network, slow network, server errors and retry behavior must not reveal private content, drop valid student history or accidentally log out.
5. Simultaneous refresh in multiple browser tabs, cookies disabled and re-login paths should be checked.
6. Signup without email verification needs bot protection, password-reset/recovery and account-ownership risk review before production rollout.

### Phase 3 — Foundation freeze and handoff: **BASELINE DOCUMENTED; FINAL ACCEPTANCE PENDING EDGE CHECKS**

- Record active **application baseline** `bb25cc02f217b29a13087ffb97a1c0354a713363`. Keep PR #1 **DRAFT** and `main` unchanged.
- Save decisions and outstanding questions in this living file; future updates should add dated, attributable decision-log entries with explicit owner approval.
- Preserve existing UI, original 74 Biology questions, test history, schema and RLS. No speculative redesigns.
- Audit result: no immediate need for another speed-focused architecture change; prioritize privacy/session edge cases.
- Handoff to MCQ planning can proceed after the owner accepts the foundation baseline with documented non-blocking issues. Do **not** imply a production launch is approved.

## 5. MCQ interface — scheduled for next working session, 2026-10-14 (not today)

**Confirmed constraints:** Focus on previously agreed MCQ interface design; protect all 74 original Biology MCQs and existing quiz functionality. Do not start implementing during today's foundation work. Review the original discussion/specification before making changes.

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
| P1 | Owner checks both students' actual history screens after each has attempts | Owner + assistant | PENDING |
| P1 | Owner checks logout across two tabs | Owner + assistant | PENDING |
| P1 | Validate 24-hour expiry and network interruption cases | Owner + assistant | PENDING |
| P2 | Decide whether remaining brief loader is acceptable or needs measured optimization | Owner | OPEN, NONBLOCKING |
| P2 | Reconfirm exact previously agreed MCQ interface specifications | Owner + assistant | NEXT SESSION |
| P2 | Design and implement MCQ interface on dev branch only, once approved | Assistant | NOT STARTED |
| P3 | Consider local compiled CSS after measurement and visual regression plan | Owner + assistant | DEFERRED |
| P3 | Production go-live checklist, pricing limits and auth safeguards | Owner + assistant | LATER |

## 8. Decision log

- **2026-10-12:** Separate staging Supabase project and development-only Vercel Preview configured, migration/RLS and trigger hardening applied under scoped approval. No student records copied from production.
- **2026-10-13:** Owner confirms onboarding tests, separate second student account, current **under-2-second** subjective login/refresh results and preference for stability over risky speed shortcuts.
- **2026-10-13:** Owner instructs us to create this master plan, complete foundation Phases 1–3 as far as safely possible today, and **postpone MCQ implementation until tomorrow**.
- **2026-10-13:** Master plan created in development branch; this is **documentation only** and not approval to deploy or merge code to production.

## 9. How to update this document

At each session's end:
1. Enter newly confirmed decisions, date and approving party.
2. Move tests to DONE only with supporting evidence; keep unverified items PENDING.
3. Update branch commit/CI/deployment status and note whether environments changed.
4. Preserve unresolved questions rather than guessing.
5. Never record student passwords, private email addresses, tokens, secrets or personal data.

**Next session starting instruction:** Read this document, inspect the existing UI/MCQ source and available chat records, then recover the previously agreed MCQ interface requirements. Do not begin redesigning or writing MCQ code until the plan is confirmed and scoped authorization is obtained.
