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
