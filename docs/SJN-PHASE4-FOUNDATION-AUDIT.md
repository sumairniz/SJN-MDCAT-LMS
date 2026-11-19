# Phase 4 — Pre-implementation audit (2026-10-15, staging only)

**Inspected:** `sjn-phase1a-foundation` at `52e7b9cfcbe4eee4a4d4e95277567bb6dca0fe33`; `public/index.html`, `server.js`, `vercel.json`, staging Supabase table metadata and Vercel preview deployment. **No application, database or production changes in this audit.**

## Verified existing state

- The source contains **74 hardcoded Biology MCQs**, IDs 1–74, each with a question, four choices, correct index, chapter/topic, examination source, explanation and mnemonic. The new regression test fingerprints the literal question bank against the accepted baseline.
- Staging Supabase: **0 rows in `public.mcqs`**, **15 rows in `public.attempts`**, **0 rows in `public.bookmarks`** at inspection. All seven public tables reported RLS enabled. These are *staging-only snapshots*, not claims about production.
- `/api/content` fetches database MCQs, but the dashboard's `loadContent()` currently replaces the inline bank **only if the remote array is nonempty**. Keep that safeguard throughout extraction; it is necessary while the database bank is empty.
- The wizard in `index.html` filters the in-memory question bank and randomizes a chosen set; the current quiz is an in-page `module-quiz` section. New `quiz.html` cannot access those variables without an explicit, tested question-bank handoff.
- Existing Tutor Mode still uses a Check Answer button; selecting an option alone highlights red (even if correct). Existing chapter/topic display uses a truncating row. Neither behavior matches the approved Phase 4 specification.
- The old `nextQuestion()` invokes `finishQuiz()` on the last question, and the timer also calls `finishQuiz()` at expiry. Dedicated submission confirmation must replace navigation-driven completion in the new implementation.
- `/api/attempts` writes *completed aggregate results* (`total`, `correct`, `accuracy`, `mode`, `subject`, `selection_json`). It does not store the question IDs or selected options. Current `/api/history` therefore cannot reconstruct a reliable review, retake or resumed draft.
- `/api/bookmarks/toggle` requires a published `mcqs.id` because `bookmarks.mcq_id` has a foreign key to `public.mcqs`. Original inline question IDs 1–74 are not presently present in that staging table, so a genuine persistent unified Mark for Review feature needs a deliberate question identity/data compatibility plan.
- Protected endpoints use verified Supabase identity, signed HttpOnly refresh/session cookies and per-user RLS; session is fixed at a 24-hour absolute deadline. Cross-tab student isolation must survive the new page handoff.

## Phase 2 entry gate — proposed engineering approach

1. Introduce a **read-only, shared original-question data module** that can serve both the existing wizard and the dedicated quiz without altering any of the 74 records. Require byte/content comparison against the accepted bank and guard empty database responses.
2. Handoff the **selected question IDs/order** only after authenticated identity verification. Never accept a client-asserted student identity or trust browser-local account data for progress.
3. Add the dedicated quiz UI as a tested, responsive staging feature while the old quiz flow remains a safe fallback until new tests pass.
4. Design **staging-only additive question-level persistence** with explicit RLS and compatibility for already-completed aggregate history. Do not run a migration or replace the bookmark FK without reviewing SQL and verification tests.
5. Separately test Tutor and Timed Mode behavior, navigation, draft saves, resumption, retakes, results calculations and account switching before proposing any production release.

**Not yet done:** standalone quiz page, shared-bank extraction, persistence migration, user-device acceptance tests. CI passing on this audit commit establishes only the preservation gate and existing tests—not Phase 4 feature completion.
