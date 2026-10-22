# Create Practice Test — Stage 4 Verification & Acceptance Register

**Audit date:** 2026-10-23 (Asia/Karachi)  
**Owner authorization:** The owner explicitly answered `yes` to beginning **Stage 4 verification-first QA**, with working code left unchanged unless a separately scoped correction is authorized.  
**Project:** SJN MDCAT LMS Pro  
**Environment:** `sjn-phase1a-foundation` staging only; `main`, production Vercel, production Supabase and draft PR #1 are **OUT OF SCOPE**.  
**Overall stage status:** **AUTOMATED + READ-ONLY DATA AUDIT PASS; REAL BROWSER / OWNER FINAL QA PENDING.** Not a production release approval.

## A. Source and deployment baseline

- Latest owner-accepted Stage 1–3 implementation and 2026-10-23 refinements: reset the next practice test to Unused; reorder Custom Quiz, Topic Drill, One or Multiple Subjects, All Subjects; small selected semantic chip accents while keeping all original card dimensions, internal mode IDs and distinctive hover/selection colors.
- Feature commit: `59248dc01a4cad375537fc7da0d6d35328923cde`, feature regression test: `0dca4f52f375f50661b10c309185e1362da8adbf`. Legacy assertion was updated by test-only commit `bdffe22a35d8f5e9c1be7bd455e740ad546d045a`; earlier failed workflow `39837508954` and corrected workflow `39837757893` are recorded in the Master Development Plan.
- **Current audited HEAD before this documentation:** `d1a3453d3c0d12aadf5dae471c60977b65a6bb86`, verified staging alias `https://sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app` **READY**, Vercel deployment `dpl_Wj6H6oQ6hpzUShsGL3qZiEVdid27`, exact GitHub SHA `d1a3453d3c0d12aadf5dae471c60977b65a6bb86`. Any later documentation-only commits will advance HEAD without changing the application. Verify exact HEAD/deployment SHA again at Stage 4 handoff.
- GitHub Actions **Foundation checks run `39837897002` (run 376) SUCCESS** on the exact audited SHA. All **120 Node tests passed**, zero failures/skips. The workflow also passed backend syntax verification, locked `npm ci`, Tailwind CSS build, critical CSS assertions, byte-for-byte reproducible CSS rebuild and `npm run check:release`. GitHub Actions emitted a non-blocking Node 20 deprecation warning; updating CI/runtime requires separate review and is **not** part of this verification-only stage.
- Audit basis: actual staging source for `public/index.html`, `public/sjn-phase4-preview.js`, `public/sjn-phase4-results.js`, `server.js`, `lib/practice-question-status.js`; existing Stage 2/3, History, Results and account-isolation tests; permanent Master Development Plan, Temporary Change Register and release-hygiene checker.
- Test coverage is **not** a full external mobile end-to-end test or load benchmark. Several tests check source contracts and sandboxed JavaScript; independent owner browser testing is still required.

## B. Read-only staging database integrity verification

These queries were **SELECT only** against the existing staging database. No data, policies, grants, migrations or account records were changed or copied to documents. No student identities, emails or question contents are stored here.

| Measure / check | Verified snapshot | Interpretation |
| --- | ---: | --- |
| Existing MCQ rows | 74 | Staging test bank; deferred public MCQ count badges remain OFF by owner decision |
| Completed attempt rows | 87 | Includes earlier score-only attempts |
| Attempts with complete question-level rows | 48 | Every one had its expected question count |
| Historic score-only attempts | 39 | Expected legacy history without per-question data; **not** considered corrupt or used to invent per-question filter classifications |
| Attempts with partial (nonzero but incomplete) question-level rows | **0** | PASS |
| Complete per-question history rows | 254 | Existing test history only |
| Existing manual-save drafts | 35 | Preserved, not autosaved or rewritten |
| Saved bookmarks | 2 | Preserved |
| Duplicate question positions in an attempt | **0** | PASS |
| Question rows assigned to a different student from their attempt | **0** | PASS |
| Question rows pointing to missing MCQs | **0** | PASS |
| Bookmarks pointing to missing MCQs | **0** | PASS |
| MCQs with invalid/missing current question revision links | **0** | PASS |

RLS is **enabled** on the six relevant tables (`attempts`, `attempt_items`, `bookmarks`, `practice_drafts`, `mcqs`, `mcq_revisions`). Verified actual student-data policy expressions: `attempts` and `attempt_items` `SELECT` use `user_id = auth.uid()`; bookmarks allow a student's own records with ownership `USING` and `WITH CHECK`; draft read/write policies likewise scope rows to the authenticated student. The API itself requires authenticated session + student ID and handles unverified filter history with a retry/fail-closed response. This is **source/policy verification, not a substitute for cross-account adversarial browser testing**.

**Initial query corrections:** A first read-only MCQ-count query attempted a nonexistent `mcqs.status` column and returned a column-not-found error; the replacement simply counted existing `mcqs` rows. An initial aggregate flagged 39 attempts with a difference between total and question-row count; follow-up read-only grouping verified **all 39 are historical score-only (zero item rows), while 0 are partially recorded modern attempts**. No corrective code or database change was needed.

## C. Scope-by-scope Stage 4 QA matrix

| Area | Automated/source evidence | Real-browser acceptance (owner) |
| --- | --- | --- |
| Original four practice card order, descriptions, intact dimensions and accent classes | PASS — Stage 3 refinements tests | Owner previously replied all looked good; Stage 4 full recheck optional |
| All Subjects full available syllabus, One or Multiple Subjects | PASS — Stage 2 regression tests and unchanged handlers | Recheck one-/multi-subject selection, Tutor/Timed |
| Custom Quiz optional chapters: none = all selected subjects; specific chapters remain scoped | PASS — actual wizard function tests | Recheck chapter choice and Back/Forward |
| Topic Drill Subjects → required Chapters → matching Topics → Settings | PASS — executed route/selection tests | Recheck no-chapter block and choosing/rechoosing topics |
| Number of MCQs blank on new wizard, valid presets/typing, pool-too-small safeguard | PASS — Stage 2 and launch test contracts | Recheck invalid input and insufficient pool messages |
| Five compact filters, Unused default, reset on new practice mode / confirmed Submit | PASS — executable filter-state tests | Recheck Topic Drill Incorrect → next All Subjects Unused; Results → Create New Test / Dashboard path |
| OR combination and no duplicate IDs, latest Correct/Incorrect/Skipped status, independent Marked | PASS — pure + sandbox tests and authenticated two-student mock API tests | Manually check marked/incorrect mixtures and different accounts as desired |
| Empty/filter verification failures and retry | PASS — sandbox tests, fail-closed source inspection | Check offline/reconnect when safe and practical |
| Results / Review / Retake; Tutor / Timed; Quick 5 | Existing dedicated tests passed; filter bypass source reviewed | End-to-end real browser test recommended before final Stage 4 owner acceptance |
| Manual Save & Exit / Resume / Exit Without Saving / refresh recovery | Existing automated tests passed; cancelled Autosave policy preserved | Confirm latest manual checkpoint, discard-unsaved, refresh and History unaffected |
| Test History 25/page, cached navigation, account separation | Existing tests passed, prior owner acceptance | Quick end-to-end account A/B confirmation before production |
| Mobile layout and performance | Scoped header/card CSS preserved; CSS checks PASS | Human phone review and perceived speed checks **OPEN** |
| Temporary-code register & production readiness | `npm run check:release` passed the **known-marker/path** guard | **NOT a production signoff**: temporary entries remain OPEN; release review separately authorized only |

## D. Pre-release items that Stage 4 does NOT silently resolve

The Temporary Change Register still lists preview-only routing/host redirect (`TEMP-P4-001`), visual-only Report Issue (`TEMP-P4-002`), review of old preview/draft/recovery/result bridges and comments (`TEMP-P4-003/004/005/006`), preview-status diagnostic endpoint (`TEMP-P4-007`), staging-versus-production Auth configuration (`TEMP-CONFIG-001`), and temporary share/deployment-access configuration (`TEMP-ACCESS-001`). Several former provisional feature descriptions are outdated and superseded by already accepted permanent implementations; **do not remove Save & Exit, Resume, bookmarks, Results/Review/Retake, refresh recovery, approved MCQ interface or question data while retiring preview wrappers**.

A passing `check:release` looks only for reserved diagnostic markers and forbidden source paths. It does not certify that every preview-only code path, feature placeholder or environment setting is ready for merge. **No production merge/deployment has been authorized.**

## E. Manual Stage 4 owner acceptance steps (staging)

1. **All four modes:** Create Test → Bank → Custom Quiz, Topic Drill, One or Multiple Subjects and All Subjects. Check subjects/chapters/topics, the Back button, settings, both exam modes and the requested count.
2. **Reset behavior:** choose Incorrect in Topic Drill; start and submit; Results → Create New Test should show **Unused only** selected automatically. Results → Dashboard → Create Test should also show Unused. Switch to All Subjects; it should remain Unused. Changing chips and navigating Back/Forward **within the same test setup** should preserve the intentional selection.
3. **Filters:** select Incorrect + Marked and then other combinations; correct/incorrect/skipped outcomes should reflect the student's most recent **completed** submission and each MCQ should appear only once. A saved unfinished draft must not consume an Unused MCQ.
4. **Critical existing flows:** complete Tutor and Timed tests, inspect Results/Review/Retake/History; Save & Exit and Resume (last manual checkpoint), Exit Without Saving and Refresh Recovery; ensure no Autosave/background saving was introduced.
5. **Desktop and phone:** verify compact colored chips and original card dimensions; if practical, test a second account in a separate browser profile to confirm student-specific filters/history. Avoid changing production or exposing credentials.

**Result policy:** Owner acceptance must be explicitly reported after browser checks. Any unexpected behavior gets a named reproduction, smallest safe fix and targeted retest **with separate owner scope if an application-code change is needed**. Until then, **Stage 4 automated/read-only verification COMPLETE; full browser signoff PENDING**.

## F.1 Owner-found Retake/Resume panel visibility regression — fixed on staging; owner recheck pending

- On 2026-10-23 owner reported entire Question Filters panel disappeared from Step 4 after completing an **In Progress → Resume** attempt or a **History → Retake**, in both Tutor and Timed; changing any practice scope did not restore it, while a full reload did. This is distinct from the previously fixed post-submit verification-loading message.
- Audit confirmed direct Retake/Resume temporarily set `wizardQuestionFiltersActive=false` to keep their exact MCQs; neither successful submit nor scope change re-enabled it. Thus the panel stayed `hidden` in the same browser session.
- Narrow `public/index.html` fix commit `69d2c8fc05a6137d99fcfe5ce06db40fe2446bba`: restore `wizardQuestionFiltersActive=true` **only at confirmed Submit and at normal new scope selection**. Do not interfere with active Retake/Resume, Quiz session, manual Save & Exit, database or other flows.
- Test `tests/practice-question-filters.test.js` `e4ebe26c76bc9d2e03a948d337077ff6f88c02ab`. The first CI run `39861048340` failed a stale test's source assertion; its narrow update in `3118e4f92ce31c89becf74f6643569c5182b2fba` gave final CI run `39861168349` **SUCCESS** and staging Vercel deployment `dpl_49DXxN4t5sDxGwC7P9MQXhL5K2kH` **READY at matching tested commit**.
- **Targeted owner browser verification: PASS — owner replied "yeah its fixed"** after reviewing the staging fix for filters disappearing following completed Resume/Retake. This confirms the owner-reported issue is resolved; it does **not** assert exhaustive independent testing of each Tutor/Timed, navigation, account and device combination. The broader Stage 4 end-to-end acceptance remains **PENDING**, and no production release or merge is authorized.
- No new temporary code, database migration, release approval or production change. Stage 4 as a whole is still browser acceptance pending.

## F. Change/rollback record

This verification audit makes **documentation-only GitHub commits**. No application, API, backend, CSS, test runtime, RLS, database records, environment variables or Vercel configuration have been changed. No new preview flag or temporary code has been introduced, so no new TEMP entry is required. The Master Development Plan and Temporary Change Register remain authoritative for handoff and future pre-release decisions. Reverting this verification record would affect documentation only and would not change the accepted LMS behavior.
