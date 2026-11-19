# SJN Phase 4 Stage 3B — Retire browser-scored attempts safely

**Owner approval:** “do it” after reviewing the Phase 4 Stage 3B legacy score-only cleanup.  
**Scope:** development branch and **staging Supabase only**. Do not touch production/main or reset data.  
**Design:** permanent score-history security fix, not a temporary workaround or Results Screen timing change.

## Safe cutover order

1. Confirm current website creates detailed History exclusively with `POST /api/practice/submit`, including Tutor and Timed. Already verified: 10 detailed attempts / 50 items, 39 older summary-only rows, 74 MCQs and 74 exact revisions as of 2026-10-19.
2. Remove the legacy `POST /api/attempts` **writer** and replace it with an HTTP **410 Gone** tombstone with a reload instruction, so old cached tabs receive a clear error rather than successfully forging a browser score or receiving the generic SPA HTML. The permanent 410 API response contains **no database write or account data**. Future removal of the tombstone itself is optional after old clients are retired; it is not an active alternate save path.
3. Keep `GET /api/history` and per-user dashboard aggregation **read-only**. Keep `/api/practice/submit` with strict account binding and PostgreSQL transactional grading for Tutor and Timed. Do not alter the approved MCQ interface/Results Screen or the deferred saving-delay behavior.
4. Run the complete Node CI/release checks, confirm new Vercel branch build is READY, **then** apply versioned staging SQL `database/migrations/20261019_stage3b_restrict_legacy_attempt_writes.sql`.
5. The SQL replaces the authenticated `ALL` attempts RLS policy with student-scoped `SELECT`, removes `authenticated` INSERT/UPDATE/DELETE and all direct DML grants on `attempts`, leaving `SELECT`. The `SECURITY DEFINER` practice grader (postgres-owned and authenticated EXECUTE-only) still writes verified results. Neither `attempt_items`, `mcq_revisions` nor `bookmarks` are weakened or changed.
6. Verify grants/policies, attempt counts, original 74/74 parity, prior 39 summaries, 10+ detailed attempts and all linked items. Execute a rollback-only authenticated-token-context insertion via the RPC to verify secure saving after direct DML restriction; attempt forbidden direct write under the authenticated role. Confirm account A/B history separation via RLS behavior where feasible, not just catalog inspection. Record results honestly.
7. Ask the owner to complete one final small Tutor/Timed browser submission after rollout before declaring production readiness. Historical Review/Retake UI belongs to later Stage 3B; unresolved preview flags and deferred Results delay remain separate.

## Future rollback or breakage

Do **not** restore browser-scored saving as an emergency workaround: it would reintroduce score forgery. On an unexpected regression, stop and inspect verified transactional RPC, PostgREST schema/grants and session. Preserve every saved row. Use a reviewed forward repair on staging; any temporary change requires a registered owner-reviewed exit plan. No production SQL, merge or public rollout is authorized by this staging gate.

## Outcome log

- Prepared: versioned server tombstone, tests, RLS/grant migration and rollback-only verification protocol.
- Applied SQL and checked: **SUCCEEDED ON STAGING**, migration `20261019164649_stage3b_restrict_legacy_attempt_writes`; see verification below.
- Production/main: **UNCHANGED**.

## Verified outcome — 2026-10-19

- Development commit `f06e369`: old score-only POST route returns 410 and cannot write; automated route/security assertions passed in 2 GitHub workflows. Preview Vercel alias reports READY at the same commit.
- Versioned SQL successfully applied on **staging only** as migration `20261019164649_stage3b_restrict_legacy_attempt_writes`. The old own-user `ALL` policy on `attempts` was replaced with authenticated own-user `SELECT` only, and direct authenticated INSERT, UPDATE, DELETE grants were revoked. Anon has no attempts access. Postgres-owned `sjn_submit_practice_attempt` remains granted EXECUTE to authenticated, not anon.
- Rollback-only RPC test with synthetic 3-MCQ submission in authenticated JWT context passed: 1 correct, 1 incorrect, 1 skipped, 1 detailed parent, 3 ordered items; retry with same UUID returned existing result; synthetic parent/items rolled back.
- Post-test read-only verification: `mcqs=74`, `mcq_revisions=74`, `mcq/source mismatches=0`, `attempts=49` (39 older aggregate summaries, 10 detailed), `attempt_items=50`, `bookmarks=3`, persisted rollback test records=0. No production DB writes or main merges.
- **Open acceptance:** a real student must complete a small Tutor and Timed test **after this restriction**, then we should recheck saved item/score records and signed-in Student A/B cross-account RLS. Only then mark this permanent security cutover fully accepted. The deferred Results Screen navigation delay is unchanged.

## Post-lockdown owner browser attempt check — 2026-10-19

- Owner reported completing the requested small browser test; checked live staging Supabase **read-only**.
- Two newly saved attempt records **#53** (16:52 UTC) and **#54** (16:54 UTC) both have `details_version=1`, 5 of 5 saved ordered answer items (positions 1–5), **3 correct / 1 incorrect / 1 skipped** (60%), **0 revision mismatches and 0 server-grade mismatches**, with no missing items.
- **Important unresolved mode distinction:** The database recorded **both as `mode='tutor'`**, not Timed. Existing previous Timed test #45 was **before** the lockdown migration. Current frontend serializes the selected `wizardSelection.testMode` to the submission RPC. Do NOT mark post-lockdown Timed browser acceptance as verified yet; ask owner to confirm they selected Timed Exam Mode or do one new 5-MCQ Timed run, then inspect its saved mode.
- Current staging totals: **74 MCQs, 74 revisions, 51 attempts (39 original summary-only and 12 detailed), 60 detailed question items, 3 bookmarks; 0 incomplete detailed attempts**.
- Catalog reconfirms: `authenticated` may SELECT `attempts` but not INSERT/UPDATE/DELETE, and the trusted PostgreSQL grading RPC remains executable by authenticated users.
- **What this verifies:** A real post-lockdown browser save persisted detailed question-level history with the expected authoritative score. **What remains:** actual post-lockdown Timed submission, Student A/B account-isolation tests in authenticated client context, and owner release acceptance. No code/SQL/production changes during this read-only verification.


## 2026-10-19 — POST-LOCKDOWN Timed Mode accepted and verified in staging DB

- **Owner report:** completed the requested real-browser Timed Mode practice test after the permanent `/api/attempts` legacy score writer retirement and `attempts` direct DML lockdown.
- **READ-ONLY Supabase verification:** latest attempt **#55** (`2026-10-19 17:04:35 UTC`) is `mode='timed'`, `details_version=1`, `total=5`, `correct=3`, `accuracy=60%`. Precisely **5** owned answer items are saved in positions 1–5 (5 distinct positions): 3 correct, 1 incorrect, 1 skipped, **0 revision mismatches, 0 authoritative grading mismatches**. These are database facts, not merely a frontend screenshot.
- Previously tested Tutor after lockdown: attempts #53 and #54, each 5/5 responses, 3 correct / 1 wrong / 1 skipped, matching SQL scoring. **Both modes now passed** post-lockdown real-browser submission + DB verification; no UI mode-selection bug.
- **Preservation totals:** 74 original MCQs, 74 revisions; **52** attempt summaries, of which the original **39** remain legacy summary-only and **13** are detailed; **65** individual answer records; 3 bookmarks; **0 incomplete detailed attempts**.
- **Security privileges remain restricted:** `authenticated` may SELECT their `attempts` rows but cannot directly INSERT, UPDATE or DELETE; secure `sjn_submit_practice_attempt` RPC EXECUTE remains available to authenticated only. Frontend continues to use the new endpoint; legacy `POST /api/attempts` returns 410.
- **Remaining release gate:** independent authenticated **Student A / Student B RLS isolation** and invalid identity/session checks after these changes; do not claim them tested solely from policies or read-only aggregate SQL. Further release work includes preview-only flags retirements, historical Review/Retake feature implementation and separately authorized production merge. Results-screen delay and fallback messages remain explicitly DEFERRED.
- Documentation-only update: NO code/schema/data edits, user account resets or production changes.


## 2026-10-19 — Second staging account: Tutor and Timed independently verified; read-isolation pending

- Owner reports completing two 5-question tests signed into a **second staging account**: Tutor Mode followed by Timed Mode. Direct read-only staging Supabase inspection confirms **attempt #56 (tutor)** and **#57 (timed)**, both `details_version=1`, **3 correct / 1 incorrect / 1 skipped** (60%), exactly 5 answer rows in positions 1–5 with no duplicates, **0 ownership-link mismatches, 0 revision mismatches, and 0 authoritative grade mismatches**.
- Compared these two attempts to the previously confirmed first-account #55 using a database boolean comparison **without recording student UUIDs/emails/passwords in GitHub**: both new attempts have `user_id` DISTINCT from #55. Ownership of the two detailed test histories is correctly assigned to a separate account.
- Current staging totals: **74 mcqs, 74 revisions, 54 attempt summaries** (**39 summary-only, 15 detailed**), **75 per-question attempt items**, **3 bookmarks**, **0 incomplete detailed attempts**. No historical data deleted or mutated during read-only review.
- Existing table permissions: `authenticated` **SELECT=true** on `attempts` and `attempt_items`; **INSERT/UPDATE/DELETE=false** on `attempts`; **INSERT=false** on `attempt_items`; authenticated-only scoring RPC remains executable. The app's historical summary endpoint is authenticated and scopes by `req.user.id`.
- **Still not proven:** a direct live signed-in Student A/B attempt to view the *other* account's records and answer details was NOT performed. The earlier query-tool attempt to simulate JWT-bearing student DB roles was safety-blocked; do not bypass or claim success. For the final real-world privacy acceptance, owner/testers should sign into each account separately and confirm that Test History only shows that account's tests; once a secure question-detail endpoint is built, also test foreign `attemptId` access via the normal app route with no sharing of credentials. For now no question-detail reader endpoint exists.
- **Next functional stage:** Owner requested agreeing on Review Answers / Retake Test visual layout **before** implementing it, after completing practical security checks. Approved blueprint v1.3 contains feature behaviors (filters, per-question navigator, exact retake order), not final visual styling.
- No changes to Results delay feature or runtime/DB/production during verification; this entry is documentation-only.


## 2026-10-19 — OWNER ACCEPTANCE: two-account Test History separation confirmed in browser

- **Owner personally tested both staged login accounts:** First account shows **only its own Test History**; second account also shows **only its own Test History**. This is the explicit real-browser bidirectional privacy check requested after test #55 (first account) and #56/#57 (second account). Mark **Student A/B summary Test History visibility — OWNER-CONFIRMED PASS**.
- Existing read-only database inspection independently verified that #56 (Tutor) and #57 (Timed) each belong to the second student's user identity, distinct from #55's owner; each has 5 correct-ownership item rows, no revision/score mismatch. Database totals were 74 MCQs, 74 revisions, 54 attempt summaries (39 old summary-only, 15 detailed), 75 attempt-items, 0 incomplete detailed attempts.
- **Scope of this acceptance:** real UI Test History **summary listing** across two accounts. It does **not** by itself constitute adversarial API tests with guessed foreign `attempt_id`, cross-account access to completed question detail endpoints (not yet built), or session expiry/account-switch browser regression. Enforce these separately when implementing the secure historical Review Answers API; do not conflate visible history isolation with complete backend penetration testing.
- **Engineering milestone:** Stage 3B-2 new secure submissions passed owner-real Tutor+Timed flows on both accounts, verified DB persistence, old client-score POST 410 retirement and student direct-DML lockdown, two-account summary isolation verified by owner. The next activity is **discussion/approval of Review Answers and Retake Test visual interface**, using the already-approved blueprint v1.3 feature rules. Do **not** implement UI prematurely.
- **Documentation only** in this commit; no new source, Supabase, production, history or deferred-feature changes.

