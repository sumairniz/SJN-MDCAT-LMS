# SJN MDCAT LMS Pro — Master Development Plan

**Document type:** Living project decision log, roadmap, acceptance criteria and risk register  
**Established:** 2026-10-13 (Pakistan time)  
**Owner:** Academy project owner; changes to application, database, environments and production always require scoped permission  
**Latest verified feature-code baseline:** `95770f739844cac3683317872537d5993146a063` on `sjn-phase1a-foundation` (Stage 3C Review/History refinements; staging READY; Foundation checks SUCCESS). Documentation-only updates may advance the branch head without changing the feature code.  
**Production code baseline:** `de519ae01ef4093dea04e92970b27e595f0cf56e` on `main`  
**Pull request:** [PR #1](https://github.com/sumairniz/SJN-MDCAT-LMS/pull/1), **DRAFT — DO NOT MERGE without separate authorization**

## 2026-10-20 — Owner accepts latest Stage 3C staging interface; next planning checkpoint

- **OWNER-REPORTED VISUAL ACCEPTANCE:** In the new continuity chat, after opening the latest staging preview, the owner reported that everything checked looked correct. This accepts the latest Test History/Review appearance and October 20 refinement pass from the owner's review; it does **not** independently prove unreported browser E2E scenarios or security penetration tests.
- **Verified technical evidence:** Stage 3C refinement code commit `95770f739844cac3683317872537d5993146a063`; Foundation checks run `39325601496` completed successfully; Vercel preview `dpl_84CQU9aW9aUE9KYXQuWxZfydzCLT` READY and assigned to the development-branch preview alias. Read-only staging Supabase query during continuity review returned 74 MCQs, 74 immutable revisions, 62 attempt summaries (23 detailed and 39 legacy summary-only), 165 ordered answer rows and 3 bookmarks. This is a point-in-time count and may increase with testing.
- **STILL OPEN:** Real authenticated Student A/B denial of foreign `GET /api/history/:attemptId` detailed reads, plus any untested browser refresh, account-switch/session edge cases, timed/tutor Retake end-to-end and mobile behavior. Owner's broad statement that the UI looks correct must not be mislabeled as independent completion of all release/security gates.
- **NEXT DEVELOPMENT AREA (design/approval before implementation):** Durable **Save & Exit, autosave, In Progress in Test History, and Resume**, consistent with Blueprint v1.3. Preserve exact MCQ identities and order, options/locked Tutor states, current question, marks, mode, test configuration, and Timed Practice's remaining countdown; isolate student drafts securely. This is the next proposed scoped feature, **not authorization** to modify application code or staging SQL.
- **DOCUMENTATION POLICY — OWNER RECONFIRMED:** Maintain the master plan and relevant feature/decision/release/temporary-change records as work progresses; log actual outcomes, approvals, failures, pending checks, and relevant commits. Do not churn unrelated historical documents or mistake a preview deployment for production approval.
- **NO RELEASE AUTHORIZATION:** Draft PR #1 remains draft; `main`, production Vercel, and production Supabase remain untouched. The separately deferred Results navigation delay remains deferred.

## 2026-10-20 — Owner-approved Review/History refinements

- Owner approved: rename Source filter **Past Papers Question Bank** (not generic Past Papers); preserve distinction from future full-length Past Papers; show multi-subject names on desktop and compact “N Subjects” on mobile from saved selection metadata; add visible-by-default **Show/Hide Question Navigator** on Review on desktop and mobile; fill Correct green / Incorrect red / Skipped amber number tiles; overlay a small violet bookmark icon **and subtle violet border** on any marked number, without replacing its result color; display saved Time Taken in both Tutor and Timed Review, only when actually recorded.
- Restrict these adjustments to **Test History and Review**. Owner confirmed the working Retake/examination UI must not change. No added 3D/glow. Source integrations for courses, full papers and mocks remain future tasks, not fictional filter results.
- Implementation and tests: exact source label/search classification, account-saved `selection_json.subjects` for multi-subject history, immutable revision item subjects in detailed Review, faithful `elapsed_seconds` formatting, navigator toggle and independent marked badge state, scoped styling and updated regressions. No DB/schema/data change.

## 2026-10-19 — Stage 3C history staging build READY (owner browser validation pending)

- Dev commit a3fe5e0 implemented responsive Test History cards/table, 2 verified completed counters, source/mode/status/date search filters, account-scoped immutable historical Results/Review, version-safe exact-order Retake. All changes restricted to Stage 3C History presentation/authenticated historical read/retake launch; no visual change to the exam question interface.
- **Both GitHub Actions PASSED:** 39300392518, 39300381158. Vercel staging preview host READY at a3fe5e0. Read-only Supabase preserves 74 MCQs, 74 revisions, 55 attempts (39 original summary-only), 80 detailed answer items and 3 bookmarks.
- **Owner visual and functional acceptance still PENDING**, especially mobile zero-horizontal-scrolling, actual saved Results/Review/Retake in browser, and independent two-account foreign-detail denial. Documented in [Stage 3C Implementation](SJN-PHASE4-STAGE3C-TEST-HISTORY-IMPLEMENTATION.md). No staging SQL or production changes.

## 2026-10-19 — Stage 3C owner-approved unified Test History implementation

- Owner approves two counters, Source/Mode/Status/Date search and filtering, tight desktop table, scroll-free mobile test cards, unified future assessment history, and three actions: neutral Results (only red chart bars), solid-red Review, subtle dark-red Retake. Owner explicitly declined extra 3D/glow enhancement. Keep the exam MCQ interface visually unchanged.
- Security implementation: authenticated per-user historical detail route using immutable revision snapshots, accurate Results, per-question Review, safe exact-order retake through the existing verified scoring path. Summary-only old tests retain real Results but no invented Review/Retake. Source metadata is identified conservatively until real Courses/Mock builders supply their types.
- [Implementation plan and release gates](SJN-PHASE4-STAGE3C-TEST-HISTORY-IMPLEMENTATION.md). CI/staging and owner browser acceptance remain necessary. No production merge or database/schema migration in this UI stage.

## 2026-10-19 — OWNER ACCEPTANCE: two-account Test History separation confirmed in browser

- **Owner personally tested both staged login accounts:** First account shows **only its own Test History**; second account also shows **only its own Test History**. This is the explicit real-browser bidirectional privacy check requested after test #55 (first account) and #56/#57 (second account). Mark **Student A/B summary Test History visibility — OWNER-CONFIRMED PASS**.
- Existing read-only database inspection independently verified that #56 (Tutor) and #57 (Timed) each belong to the second student's user identity, distinct from #55's owner; each has 5 correct-ownership item rows, no revision/score mismatch. Database totals were 74 MCQs, 74 revisions, 54 attempt summaries (39 old summary-only, 15 detailed), 75 attempt-items, 0 incomplete detailed attempts.
- **Scope of this acceptance:** real UI Test History **summary listing** across two accounts. It does **not** by itself constitute adversarial API tests with guessed foreign `attempt_id`, cross-account access to completed question detail endpoints (not yet built), or session expiry/account-switch browser regression. Enforce these separately when implementing the secure historical Review Answers API; do not conflate visible history isolation with complete backend penetration testing.
- **Engineering milestone:** Stage 3B-2 new secure submissions passed owner-real Tutor+Timed flows on both accounts, verified DB persistence, old client-score POST 410 retirement and student direct-DML lockdown, two-account summary isolation verified by owner. The next activity is **discussion/approval of Review Answers and Retake Test visual interface**, using the already-approved blueprint v1.3 feature rules. Do **not** implement UI prematurely.
- **Documentation only** in this commit; no new source, Supabase, production, history or deferred-feature changes.

## 2026-10-19 — Second staging account: Tutor and Timed independently verified; read-isolation pending

- Owner reports completing two 5-question tests signed into a **second staging account**: Tutor Mode followed by Timed Mode. Direct read-only staging Supabase inspection confirms **attempt #56 (tutor)** and **#57 (timed)**, both `details_version=1`, **3 correct / 1 incorrect / 1 skipped** (60%), exactly 5 answer rows in positions 1–5 with no duplicates, **0 ownership-link mismatches, 0 revision mismatches, and 0 authoritative grade mismatches**.
- Compared these two attempts to the previously confirmed first-account #55 using a database boolean comparison **without recording student UUIDs/emails/passwords in GitHub**: both new attempts have `user_id` DISTINCT from #55. Ownership of the two detailed test histories is correctly assigned to a separate account.
- Current staging totals: **74 mcqs, 74 revisions, 54 attempt summaries** (**39 summary-only, 15 detailed**), **75 per-question attempt items**, **3 bookmarks**, **0 incomplete detailed attempts**. No historical data deleted or mutated during read-only review.
- Existing table permissions: `authenticated` **SELECT=true** on `attempts` and `attempt_items`; **INSERT/UPDATE/DELETE=false** on `attempts`; **INSERT=false** on `attempt_items`; authenticated-only scoring RPC remains executable. The app's historical summary endpoint is authenticated and scopes by `req.user.id`.
- **Still not proven:** a direct live signed-in Student A/B attempt to view the *other* account's records and answer details was NOT performed. The earlier query-tool attempt to simulate JWT-bearing student DB roles was safety-blocked; do not bypass or claim success. For the final real-world privacy acceptance, owner/testers should sign into each account separately and confirm that Test History only shows that account's tests; once a secure question-detail endpoint is built, also test foreign `attemptId` access via the normal app route with no sharing of credentials. For now no question-detail reader endpoint exists.
- **Next functional stage:** Owner requested agreeing on Review Answers / Retake Test visual layout **before** implementing it, after completing practical security checks. Approved blueprint v1.3 contains feature behaviors (filters, per-question navigator, exact retake order), not final visual styling.
- No changes to Results delay feature or runtime/DB/production during verification; this entry is documentation-only.

## 2026-10-19 — POST-LOCKDOWN Timed Mode accepted and verified in staging DB

- **Owner report:** completed the requested real-browser Timed Mode practice test after the permanent `/api/attempts` legacy score writer retirement and `attempts` direct DML lockdown.
- **READ-ONLY Supabase verification:** latest attempt **#55** (`2026-10-19 17:04:35 UTC`) is `mode='timed'`, `details_version=1`, `total=5`, `correct=3`, `accuracy=60%`. Precisely **5** owned answer items are saved in positions 1–5 (5 distinct positions): 3 correct, 1 incorrect, 1 skipped, **0 revision mismatches, 0 authoritative grading mismatches**. These are database facts, not merely a frontend screenshot.
- Previously tested Tutor after lockdown: attempts #53 and #54, each 5/5 responses, 3 correct / 1 wrong / 1 skipped, matching SQL scoring. **Both modes now passed** post-lockdown real-browser submission + DB verification; no UI mode-selection bug.
- **Preservation totals:** 74 original MCQs, 74 revisions; **52** attempt summaries, of which the original **39** remain legacy summary-only and **13** are detailed; **65** individual answer records; 3 bookmarks; **0 incomplete detailed attempts**.
- **Security privileges remain restricted:** `authenticated` may SELECT their `attempts` rows but cannot directly INSERT, UPDATE or DELETE; secure `sjn_submit_practice_attempt` RPC EXECUTE remains available to authenticated only. Frontend continues to use the new endpoint; legacy `POST /api/attempts` returns 410.
- **Remaining release gate:** independent authenticated **Student A / Student B RLS isolation** and invalid identity/session checks after these changes; do not claim them tested solely from policies or read-only aggregate SQL. Further release work includes preview-only flags retirements, historical Review/Retake feature implementation and separately authorized production merge. Results-screen delay and fallback messages remain explicitly DEFERRED.
- Documentation-only update: NO code/schema/data edits, user account resets or production changes.

## 2026-10-19 — Post-lockdown owner browser submission verified; Timed Mode confirmation pending

- Verified recent owner-reported post-lockdown browser attempts **#53 and #54** in staging Supabase, each **5/5 item records**, score **3 correct, 1 wrong, 1 skipped (60%)**, with 0 revision/answer-score mismatches. 51 total attempts: 39 preserved aggregate-only and 12 detailed, 60 ordered answer rows, no incomplete detailed records. Direct authenticated attempts DML remains revoked.
- Both latest records are explicitly labeled **Tutor** by the database, so do **not** infer post-lockdown Timed acceptance from them. Previous known Timed records were saved before lockdown. Next ask owner for confirmation/one Timed 5-MCQ submission, then verify `mode=timed`. Student A/B live RLS privacy tests remain an additional release gate.
- Documentation only; no production change, data deletion, schema change or Results Screen-delay work.

## 2026-10-19 — Stage 3B old score-only writer RETIRED on staging (verified)

- **Code:** `f06e369` replaces historical browser-score writer `POST /api/attempts` with non-writing HTTP **410 Gone** reload response. Normal Tutor and Timed use authenticated `/api/practice/submit` and postgres `sjn_submit_practice_attempt`. Updated account-switch, legacy route, source preservation tests; **both GitHub Actions workflows PASSED**, dedicated Vercel preview alias READY at `f06e369`.
- **Staging SQL:** Versioned forward-only `database/migrations/20261019_stage3b_restrict_legacy_attempt_writes.sql` successfully applied to staging ref `aozknkrwafowsrehdwlr` as Supabase migration **`20261019164649_stage3b_restrict_legacy_attempt_writes`**. Replaced broad authenticated own-row `ALL` policy on `attempts` with own-row `SELECT` policy `sjn_attempts_read_own_history`. Authenticated now has `SELECT=true`; `INSERT/UPDATE/DELETE=false`; anonymous has no attempts table access. Secure SECURITY DEFINER grading RPC remains `EXECUTE=true` for authenticated and false for anonymous.
- **Post-migration database smoke test:** A disposable three-question submission under an authenticated JWT-claim context passed: **1 correct, 1 incorrect, 1 skipped**; exactly three ordered attempt item records and one detailed parent during transaction; second submit with same key returned the same attempt with `already_saved=true`. Test subtransaction deliberately rolled back. No synthetic test attempt persisted.
- **Post-migration read-only count/parity checks:** MCQs **74**, revisions **74**, original content/revision mismatches **0**, attempts **49** (39 legacy summary-only, 10 detailed), attempt items **50**, bookmarks **3**, rollback fixture persisted rows **0**. No database data resets/deletions.
- **Remaining before production merge:** Real signed-in end-to-end browser submission **after** lockdown, with normal Tutor + Timed modes; Student A/B authentication/RLS isolation test and invalid-session retry; full acceptance under restricted student role, not just grants/metadata. Existing Phase 4 preview-only features still require release cleanup and owner-approved production plan. Results navigation delay stays **DEFERRED**, unchanged.
- **No change** to `main`, production Supabase `yapvnevvjfewvafbjcgc`, original 74 question text, staging student history, or approved MCQ/Results UI. Stage 3B detailed Review Answers and Retake Test remain later development.

## 2026-10-19 — Stage 3B old score writer cleanup authorized

- **Owner approved** returning to Phase 4 Stage 3B legacy-writer retirement, scoped to development branch and staging only. The separate results-delay/performance item remains DEFERRED; no fast-UI changes.
- **Observed baseline before cutoff:** 74 MCQs, 74 revisions, 49 test summaries (39 legacy summary-only, 10 detailed), 50 ordered attempt item records. `authenticated` had SELECT, INSERT, UPDATE and DELETE direct table privileges and one own-user ALL RLS policy, permitting browser-reported score tampering. `sjn_submit_practice_attempt` remains authenticated-only SECURITY DEFINER RPC owned by postgres, and the frontend exclusively calls `/api/practice/submit`.
- **Long-term controlled replacement:** Change old `POST /api/attempts` into non-writing HTTP 410 Gone compatibility response; replace broad attempts RLS with per-user SELECT-only and revoke direct authenticated INSERT/UPDATE/DELETE in an audited forward-only staged migration. Maintain all existing History and score/answer data unchanged and verify secure RPC still inserts after privilege lockdown.
- **Procedure, migration, tests and outcome record:** [Stage 3B Legacy Score Writer Retirement](SJN-PHASE4-STAGE3B-LEGACY-WRITER-RETIREMENT.md). GitHub CI, Vercel READY, signed-in Student A/B isolation and database rollback-only tests must pass before declaring staging security checkpoint completed. No production merge or original question deletion.

## 2026-10-19 — DEFERRED results navigation delay; return to Stage 3B legacy-writer cleanup

- **Owner explicitly deferred** work on the ~4-second Results Screen button delay. Although yellow/green normal-save messages were removed successfully in commit `59d5acd`, **Return to Dashboard** and **Create New Test** remain disabled until `finishQuiz()` finishes verified saving and post-save stats/history refresh. Precise per-operation timing has NOT been measured. Owner values long-term security and correctness over short-term perceived speed. **No UI/server changes are authorized for this delay now.**
- **Remember on demand:** see [DEFERRED-RESULTS-001 in Deferred Work & Owner Decisions](SJN-DEFERRED-WORK-AND-OWNER-DECISIONS.md). Later, first investigate whether navigation can be enabled immediately after secure DB commit without unnecessary stats/history refresh blocking. **If shortening it safely is not feasible,** retain the wait and show a concise “Saving…” followed by “Saved in History” confirmation in the **same original result-message position**; show clear failure notice if save fails. Do not restore those messages now. Owner will finalize exact wording when revisiting.
- **Return to current phase:** Phase 4 Stage 3B-2, secure submission switchover and legacy write cleanup. Owner reports Create Quiz, Tutor and Timed worked. Staging read-only inspection today verified **74 MCQs, 74 revisions, 49 total attempts (39 original summary-only + 10 detailed), 50 ordered saved item records, 3 marks**. Recent Tutor and Timed rows contain the expected five item records. The old `POST /api/attempts` score-only writer and broad direct authenticated `attempts` write permissions remain the next production-blocking issue, followed by read-scoped Review/Retake.
- Both GitHub workflows for last Results UI commit `59d5acd` PASSED. **Documentation-only commit** here: no database writes, rollback, deletion, admin changes or production deployment.

## 2026-10-19 — Stage 3B results UI: owner requests silent normal save feedback

- **OWNER REQUIREMENT:** On the approved Results Screen, remove the transient yellow “Saving your completed test…” message and green “Saved with database-verified answers…” confirmation **completely**. The result (accuracy ring, 0/5, correct/incorrect/skipped/time cards, controls, Performance Insights) must render immediately, without a status row or blank reserved space. Owner provided screenshots of both states. Fast-feeling UI is required, **but a database network operation cannot honestly be guaranteed to complete in milliseconds**.
- **Implementation scope:** remove only the `sjn-results-save` DOM node/styles/pending/success text. Keep the current `/api/practice/submit` trusted PostgreSQL grading, correct/incorrect/skipped persistence, account-bound validation and idempotency exactly as before. Results continue rendering synchronously before the save Promise resolves; navigation stays protected while a save is in flight. Verified score still replaces provisional score on mismatch and hides unreliable insights. Authenticated saver still alerts users on save failure; an unexpected rejected Promise is warned via alert as a fallback, never silently swallowed.
- **Testing:** extend Stage 3 Results regression to assert no Saving/Saved labels or CSS, immediate result-before-Promise display, server-confirmation/grade correction and failure feedback remain. Update stale Stage 3B source assertions that expected the removed green text. Run GitHub test and release checks and verify the staged Vercel commit. No Supabase/MCQ/history data deletion, no changes to production or approved result layout apart from removing this status line. Record actual CI/deployment and owner browser acceptance subsequently.

## 2026-10-18 — Create Quiz scope fix CI test contract updated

- GitHub commit `a48d16f` fixed an actual frontend scope crash and the separate stale-result cache. New executable launcher tests for Tutor/Timed, absent/unversioned question banks, and saved-result reset all passed, as did original 74-MCQ checksum verification.
- First CI run `39138057406` reported **72 passed, 1 failed** solely because a preservation test still demanded the removed `!remoteContentLoaded` global cross-scope reference. Replaced that obsolete source assertion with verification of `!mcqQuestionBank.length` and revisionId preflight. Retain loader reset and retry checks; rerun all GitHub workflows and staging deployment before owner browser acceptance.
- Previous failure/attempt and correction are retained in permanent development history; do not declare fixed until latest CI passes and owner confirms Start MCQs Practice works.

## 2026-10-18 — User-reported Create Practice Test launch failure after DB-only loader fix

- **Observed by owner:** clicking Start MCQs Practice at the last Create Practice Test step did nothing. No Timed Mode test had been completed after the DB-only bank migration.
- **Root cause traced to JavaScript scope (not Supabase):** global `launchGeneratedQuiz()` (first `<script>`) was modified in commit `a697873b` to read `remoteContentLoaded`; that `let` exists only within the later authenticated IIFE (second `<script>`), so the click threw a `ReferenceError` before switching to the quiz. The existing validated loader already empties the active question list while unavailable; checking `mcqQuestionBank.length` and each `revisionId` is sufficient without reaching across scopes.
- **Second scope bug discovered during inspection:** global quiz launcher assigns `savedAttemptOutcome=null` while the new authenticated saver had declared a separate `let savedAttemptOutcome` inside its IIFE. Repeated tests could have reused an old confirmed result. Move this variable to the shared main script and remove the duplicate private declaration so both launcher and saver read/write the same state.
- **Fix (staging branch only):** remove invalid loader-flag access, keep safe DB-only preflight, unify the saved attempt state and preserve original 74 Biology source exactly. Add executable Node VM test `tests/phase4-quiz-launch.test.js` to launch both Tutor and Timed tests **without** any auth-private state and assert mode, timer, question selection and state reset; ensure missing/unversioned banks fail safely.
- **Scope:** no Supabase schema/data, legacy attempts or production changes. Require two CI workflows and Vercel READY before asking owner to retest. User confirmation of the actual browser workflow remains outstanding.

## 2026-10-18 — Stage 3B-2 before Timed Mode: prevent unsavable HTML fallback (staging source hardening)

- Owner confirmed actual 5-MCQ Tutor test #42 (3 correct, 1 incorrect, 1 skipped). Read-only Supabase integrity check verified exactly **5 ordered attempt_items**, 5 matching immutable MCQ revision references and **0 scoring mismatches**, with 39 older summaries intact. Owner asked assistant to prepare the next test and gradually retire obsolete code without sacrificing any long-term LMS features.
- Read-only code review identified a real behavior gap: `public/index.html` still initializes practice from embedded original 74 questions; `loadContent()` previously replaced it **only** on nonempty response, otherwise continued silently with HTML content. Those inline questions have **no revisionId** and cannot be submitted through the new Stage 3B-2 RPC. Also, the old developer-only form could append locally stored MCQs with no database revisions, creating unsavable tests.
- Proposed production-quality correction on development branch: **preserve the original 74 source literal byte-for-byte**, but initialize live `mcqQuestionBank` empty, accept only validated DB records with stable IDs/revision IDs and 4 answer options, block launch of any Tutor/Timed test while content is unavailable and show retry controls on both Dashboard/Create Test. Remove the old browser-memory MCQ publisher behavior (future Admin Panel is server/database-authorized). Server `/api/content` must fail closed on a Supabase MCQ read error or missing `current_revision_id`, instead of returning a misleading empty bank. No schema/data changes and no modification of original 74 text.
- This is a **permanent** reliability/security fix, not temporary staging scaffolding. Original 74 inline source is intentionally retained solely as a protected reference asset until the future separately reviewed removal/extraction phase; tests must maintain checksum `a2e57e72716394e8`. Do not confuse source preservation with a runtime fallback.
- **Required quality gates:** GitHub CI, staging deployment, fresh-login and returning-visit Create Test, Timed and Tutor with live DB, simulated DB-empty/error and retry, failed/invalid IDs, approved Results layout, account switch and safe history recording. The separate legacy score-only endpoint and direct `attempts` DML are **still outstanding** and may be retired only after Timed Mode acceptance.
- No SQL writes or user-data deletion; production and main are excluded.

## 2026-10-18 — Stage 3B-2 new graded submission verified in rollback-only SQL test

- **Live staging migrations:** `20261018133942_stage3b_atomic_practice_submission` (SECURITY DEFINER grading/save RPC), plus `20261018135309_stage3b_submission_attempt_id_qualification` (corrective forward migration). The first rollback-only synthetic attempt test exposed ambiguous unqualified `attempt_id` in PL/pgSQL `SELECT count(*)` subquery (PostgreSQL `42702`). It aborted without saving. Corrected with `public.attempt_items AS i WHERE i.attempt_id = v_attempt_id` in version-controlled commit `638b1e5`, retaining the previous applied migration in history.
- **Rollback-only database retest completed successfully** using an existing staging test identity, three original MCQs, and a new UUID. Checked the authoritative grade **1 correct / 1 incorrect / 1 skipped**, exactly **3** ordered response records associated with the new parent, and same-key retry returned the **same attempt** with `already_saved=true`. An explicit nested PL/pgSQL exception rolled back the entire test subtransaction. Follow-up catalog/count inspection showed **39 attempts, 0 attempt_items, 74 MCQs, 74 revisions and 0 persistent verified submissions**, unchanged by the test. The number of bookmarks is **3** at latest inspection, previously 2; this can change through tester activity and the submission migration/test did not modify bookmarks.
- Supabase catalog confirms the RPC exists as `SECURITY DEFINER`, callable by `authenticated` but **not anon**. Development branch `638b1e5` was **READY on Vercel**; its two GitHub workflows both **PASSED**.
- **Still pending for owner acceptance:** actual signed-in browser test of a newly completed 3-question normal practice (both Tutor and Timed as available), confirmed saved History and per-question counts/selected answers, mobile, account switch and 24-hour session. SQL simulator is not a substitute for real browser E2E or a separate authenticated Student A/B RLS test.
- **Security limitation to resolve before production:** the old score-only `POST /api/attempts` remains and authenticated students still have direct `attempts` table DML under old policy. Do not claim all scores are tamper-proof until these are retired/tightened through a separate approved, tested compatibility migration. Ordinary `/api/content` continues to include answer keys, so strict premium mocks need a separate protected architecture.
- No student attempts/bookmarks were deleted or reset; production and `main` remain untouched. Next: owner verifies new staging quiz saving, then inspect live student attempt_items and approve follow-on legacy-route lockdown.

## 2026-10-18 — Stage 3B-2 rollback-only integration test caught a PostgreSQL ambiguity

- CI on feature code `4d9cc67` initially failed **three old contract assertions** tied to `window.finishQuiz()` and the old summary-only return; no runtime question-loss issue was identified. Updated tests in commit `39fe964`; both GitHub workflows passed. New staging deployment READY.
- **Rollback-only test of newly installed RPC** using an existing staging test identity and 3 original MCQs failed with PostgreSQL `42702`: unqualified `attempt_id` in an `INSERT INTO attempt_items ... SELECT count(*)` subquery conflicts with the `RETURNS TABLE attempt_id` PL/pgSQL output argument. The function call rolled back completely; read-only counts immediately after showed **39 attempts, 0 attempt items, 74 MCQs, 74 MCQ revisions**, unchanged.
- Corrective SQL is a **new forward migration** `database/migrations/20261018_stage3b_submission_attempt_id_qualification.sql`, keeping the original historical applied migration intact; it changes the subquery to `FROM public.attempt_items AS i WHERE i.attempt_id = v_attempt_id`. Revalidate in rollback-only database test after applying the correction; do not declare historical submission active until verified.
- No production modifications, student-history deletions, temporary workarounds or original question edits. This entry documents the failure so future developers do not repeat it.

## 2026-10-18 — Stage 3B-2 implementation and RPC staging deployment (owner authorized)

- Owner approved Stage 3B-2: permanent question-level submission and authoritative scoring on the development branch / staging Supabase only; no production, history reset or untracked temporary features.
- Supabase migration `stage3b_atomic_practice_submission` was applied to staging `aozknkrwafowsrehdwlr`; migration registry version `20261018133942`. Routine `public.sjn_submit_practice_attempt` is SECURITY DEFINER with explicit `search_path`, authenticated-only EXECUTE, owner-scoped claims, immutable revision lookup, validated selected options, unique stable submission key/fingerprint, per-user advisory transaction locking, server-computed score and atomic writes to `attempts` + `attempt_items`. No user attempts were inserted during migration; no production effect. Ordinary practice /api/content still contains answer keys; premium mocks are not secured by this workflow.
- Version-controlled `lib/practice-submission.js`, authenticated `POST /api/practice/submit` endpoint, current revision IDs in ordinary content response, and the unified old + Phase 4 `finishQuiz()` handler now send the same per-question payload rather than browser-supplied score. Stage 3A Results layout remains; database grade replaces provisional counts if different, and provisional topic insights are hidden on mismatch.
- **Incomplete release gates:** legacy `/api/attempts` endpoint and direct authenticated `attempts` DML are still available for compatibility. Until those are locked down, a hostile client could forge legacy aggregate results; do NOT claim full score immutability. Before production, test authenticated student A/B RLS, validated revision failures, timebox/account switch, same-key idempotency, double submit, old + Phase 4 browser UI, saved history and mobile; then deprecate the legacy writer and tighten grants behind separate reviewed staging migration. Retake and Review UI remain disabled.
- No ephemeral workaround added for this feature. Existing staging-only TEMP-P4-001/007 and disabled Review/Retake TEMP-P4-006 still block production merge until properly integrated or removed. Actual CI/deployment and owner acceptance will be recorded only after observed results.

## 2026-10-18 — Stage 3B-2 authorized: atomic server-graded submission rollout

- Owner authorized starting secure Stage 3B-2 on development branch, retaining the approved exam/results UI, 74 MCQs, 39 legacy summaries and 2 marks; production untouched. Designed a **staging-first additive** `SECURITY DEFINER` RPC `public.sjn_submit_practice_attempt` in [versioned migration](../database/migrations/20261018_stage3b_atomic_practice_submission.sql), using the authenticated JWT, validation, immutable current revision keys, single-transaction summary+ordered item inserts, server-grade score, rate limits and idempotency key/fingerprint with same-student serialization.
- **Security limits retained as explicit blockers:** Current `/api/attempts` and direct authenticated `attempts` DML remain possible until the new client is deployed and tested. The public ordinary practice `/api/content` still serves answer keys, so this is score-authority work, **not** anti-cheating protection for future premium mocks. RPC accepts a valid Supabase JWT independently of the application's 24-hour signed cookie; the app HTTP endpoint checks both. Further hardened database privilege and session policy needs separate review.
- **Rollout protocol:** add the RPC first in staging; verify its catalog grants without writing synthetic student attempts; then commit and test backend/quiz UI against the RPC and staging. Tighten legacy route and direct attempts grants only after acceptance with a separately audited compatibility migration. Avoid temporary shadow writers or dual saving.
- Document actual SQL result, CI and user acceptance with factual evidence, not presumptions.

## 2026-10-18 — Stage 3B-1 executed on staging and VERIFIED

- Owner explicitly authorized executing the reviewed additive Stage 3B-1 SQL against staging `aozknkrwafowsrehdwlr` only. Disposable testing accounts/history remain untouched; the owner requires a professional, production-ready design and requested confirmation before any resets.
- **Attempt 1 — FAILED, no partial changes:** Supabase `apply_migration` reported PostgreSQL syntax error `42601` from an extra closing parenthesis in the original `DO $preflight# SJN MDCAT LMS Pro — Master Development Plan

**Document type:** Living project decision log, roadmap, acceptance criteria and risk register  
**Established:** 2026-10-13 (Pakistan time)  
**Owner:** Academy project owner; changes to application, database, environments and production always require scoped permission  
**Current active code baseline:** `c31033331af9069ad60cb648c7d60cde97a6b625` on `sjn-phase1a-foundation` (cross-tab authentication synchronization; CI passed, staging READY)  
**Production code baseline:** `de519ae01ef4093dea04e92970b27e595f0cf56e` on `main`  
**Pull request:** [PR #1](https://github.com/sumairniz/SJN-MDCAT-LMS/pull/1), **DRAFT — DO NOT MERGE without separate authorization**

 condition. Subsequent read-only table/migration listing showed the original 7 tables, no history tables, and no new migration record. Corrected exact SQL parenthesis in Git commit `26c158ee52d7a5c0411794de835b723be5c1bdf8`, and added a static regression test. Two GitHub workflows on that correction passed.
- **Attempt 2 — SUCCEEDED:** Executed the exact corrected, version-controlled SQL via Supabase `apply_migration` in **staging** only with name `stage3b_question_history_foundation`; tool returned `success:true`. Supabase recorded migration **`20261018122510_stage3b_question_history_foundation`**.
- **Read-only post-migration evidence:** 74 source MCQs + **74 immutable revision-1 records**; full field-by-field MCQ/revision parity check **0 mismatches**; every source MCQ linked to current revision (0 missing); **39 old attempt summaries preserved** with `details_version=0` (0 unexpectedly changed); **0 attempt_items** as expected before wiring submissions; **2 bookmarks** and **4 profiles** preserved. Both new tables report RLS enabled. Catalog verified `attempt_items` and `mcq_revisions` authenticated **SELECT-only grants**, their owner-scoped SELECT policies, matching student-parent and MCQ-revision foreign keys, and uniqueness/answer-index constraints. Prior `attempts` ALL RLS/grants remain intentionally unchanged for legacy compatibility.
- **Security and scope disclaimer:** Catalog inspection proves the policies/grants exist; *independent signed-in Student A/B/anonymous access tests and transactional score submission are NOT yet complete*. Current `POST /api/attempts` still trusts browser totals. The database foundation is **implemented**, but **Stage 3B feature is NOT complete**. Do not activate Review/Retake or promise permanent server-grade score integrity yet.
- **Next approved-work boundary:** Design and review server-graded atomic submission/RPC + compatibility with old and Phase 4 quiz flows, then new frontend implementation and RLS tightening behind separate stage approvals. No production, main merge, staging history deletion, or source 74 changes.

## 2026-10-18 — Stage 3B-1 staging execution: SQL preflight syntax correction

- **OWNER AUTHORIZED** applying the Stage 3B-1 additive migration to staging project `aozknkrwafowsrehdwlr` only; expressly preserve durable production-quality design and ask before deleting disposable testing data.
- First `apply_migration` call was rejected with PostgreSQL syntax error `42601` due to an extra closing parenthesis in the original MCQ preflight condition. A post-error check showed the original **7 public tables, 74 MCQs, 39 attempts and 2 bookmarks**, with no new tables or recorded migration. No reset or destructive operation occurred.
- Corrected the exact extra parenthesis in version-controlled SQL, added a static regression assertion, and will retry **the same approved, staging-only operation** after the correction is committed. Record actual result separately; never claim migration success until checked.

## 2026-10-18 — Owner-approved Stage 3B architecture, SQL prepared but NOT applied

- **Owner APPROVED** the long-term Stage 3B architecture of immutable `mcq_revisions` and ordered, per-user `attempt_items`; this is **not** separate permission to run SQL or update application code. Existing owner goal: robust permanent LMS that never ships temporary scaffolding into production.
- Re-audited staging schema/grants/migrations read-only: **74 `mcqs`**, **39 `attempts`**, **2 `bookmarks`** at review; student `attempts` currently has authenticated INSERT/UPDATE/DELETE/SELECT grants and an own-row ALL RLS policy. Keep the legacy writer working until later secure cutover. The question bank source remains unchanged.
- Prepared **review-only, UNAPPLIED** versioned SQL [Stage 3B foundation migration](../database/migrations/20261018_stage3b_question_history_foundation.sql), static proposal safety tests [Stage 3B schema-plan tests](../tests/phase4-stage3b-schema-plan.test.js), and [SQL Review & Validation Checklist](SJN-PHASE4-STAGE3B-SQL-REVIEW-AND-VALIDATION.md). SQL would snapshot 74 immutable revision-1 records and add new owner-scoped attempt-item structure, indexes and compatibility columns; it does **not** yet grade tests, introduce submission RPC, or revoke legacy attempts grants.
- **Next explicit gate:** owner reviews and separately authorizes applying that precise SQL to **staging** `aozknkrwafowsrehdwlr`. Confirm SQL compile/security/PostgREST behavior and live owner-account testing before any frontend cutover. Do not touch `main`, production Supabase `yapvnevvjfewvafbjcgc`, test-account history, or permanent approved exam/results design.

## 2026-10-18 — Phase 4 Stage 3B Question-Level History: read-only architecture review

- Owner requested to start the next stage after verification of 74 original database MCQs, owner-accepted preview login correction and Stage 3A Results Screen. Reviewed staging Supabase tables, RLS policies, constraints, indexes, existing `/api/attempts` and `/api/history` routes, current exam/results, and blueprint v1.3 **READ-ONLY**.
- Current staging inspection: **74 MCQs, 39 aggregate-only attempts, 2 bookmarks, 4 profiles**. These counts are a snapshot and may change through ongoing student testing. Old 39 attempts contain no question-level answers, so preserve them as summary-only; do not reconstruct fictional history.
- **Critical finding:** legacy `POST /api/attempts` trusts browser-supplied `correct` count, and an existing authenticated per-owner `ALL` RLS policy permits attempts DML. This is a historical-result integrity gap. Do not revoke grants before replacing all legacy submission paths.
- **Design PROPOSED, NOT YET APPROVED FOR DATABASE/APP WRITES:** [Stage 3B Question-Level History Design](SJN-PHASE4-STAGE3B-QUESTION-HISTORY-DESIGN.md). Recommends immutable MCQ revisions, ordered student-scoped attempt items, atomic server-side verified grading with idempotent retries, account isolation, authenticated read-only Review, independent Retake, and additive migrations with RLS and rollback gates. Clarifies limited anti-cheating while ordinary `/api/content` publicly includes answer keys.
- **Next owner decision:** Review the proposed revision/item architecture, then authorize separately scoped staging-only SQL design/application and subsequent code gates. No Supabase write, test-history deletion, production change, draft-PR merge or UI enablement occurred during this documentation review.

## 2026-10-18 — Final corrective direction: server-side staging Phase 4 default

- The owner's repeated screenshot proved query-string preservation through individual JavaScript auth redirects was not sufficient. The same staging deployment showed LEGACY EXAM MODE at `/index.html` but PHASE 4 PREVIEW with 74 MCQs when explicitly flagged.
- Added a **staging-alias-only HTTP redirect** in `server.js`: unflagged `/index.html` on the canonical development branch hostname redirects to the explicitly opted-in Phase 4 URL, whether login dropped the flag or not. Other hosts, production and authenticated user state are unchanged. Real HTTP regression tests and TEMP-P4-001 documentation accompany the code. Do not assert the browser issue is resolved until the owner tests it.
- Existing staging question content remains the verified 74/74; no SQL migrations or production changes. Future production integration must retire the temporary preview flag safely.

## 2026-10-18 — Owner-provided screenshots: guest preview still old; further correction

- Owner screenshot after logout/login shows plain `/index.html` (no preview opt-in), legacy mode; reopening while already signed in shows `/index.html?sjnPhase4Preview=1` with **staging commit `5118f055` and 74 MCQs**. Thus Vercel was on the right build but the guest auth flow still dropped preview mode, and prior "fix passed" claim was not substantiated by a real guest check.
- Follow-up owner-approved scope: preserve Phase 4 flag in **all 14** authentication redirect paths via allowlisted `public/sjn-preview-auth-route.js`, apply same helper in `public/landing.html`, label legacy vs preview so backend/visual testers can tell their mode, and add regression tests. The flag is opt-in, not permission/authentication.
- **Mandatory gate:** GitHub tests and Vercel branch deployment must pass; owner retests signed-out and signed-in flows. Supabase staging 74/74 original MCQ content verified; no new import or production modification.

## 2026-10-17 — 74-MCQ staging parity VERIFIED; approved import unnecessary

- Owner approved the atomic migration of 74 original Biology MCQs to **staging only**. The preflight found that staging `public.mcqs` already had 74 rows with IDs 1–74, unlike the previous read-only snapshot reporting 0. **The actor/method responsible for this pre-existing import is unknown and no new insert was attempted.**
- Source bank fingerprint `a2e57e72716394e8` verified; each of 74 existing staging records matched original source on **all 11 fields** including options and answer key. **No mismatch, missing record or extra record.** Identity sequence at 74, test attempts still 37, marks 0. No source, database, environment or production modifications during verification.
- Deployment at the documentation-before-verification branch head `ab037208ae340c5bf73f2630758a55df2f621786` was checked as READY; this is **not** a substitute for owner/browser validation of Create Test, Tutor/Timed and Phase 4 opt-in. [Detailed Staging Verification Report](SJN-74-MCQ-STAGING-MIGRATION-PLAN.md). Stop: do not import duplicate 74. Next ask the owner to test the existing bank-backed staging quiz or separately authorize further technical implementation.

## 2026-10-17 — Future filter choices and 74-question staging import checkpoint

- Owner's **future** Create Practice Quiz direction: Unused selected by default, Used/Incorrect/Marked selectable together, including all four. Exact filter algebra/UX deferred until after per-student question history. No wizard change now.
- Owner clarification: manually publishing selected premium course questions into an ordinary bank is for the **owner/authorized Admin Panel team only**, never students. Require API/DB permissions; future phase only.
- The read-only review has produced [74-MCQ Staging Migration Plan](SJN-74-MCQ-STAGING-MIGRATION-PLAN.md). Database already has required original question fields. **The first nonempty DB content response triggers the existing frontend switch**: import all 74 atomically, verify parity and preserve old bank/source. No code or DB writes in this documentation step; obtain separate permission before any staging import.

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
