# SJN MDCAT LMS Pro — Migration of Original 74 MCQs to Supabase Staging

**Created:** 2026-10-17 (Pakistan time)  
**Status:** PROPOSED AND DOCUMENTED. **NO DATA WRITES APPROVED OR PERFORMED.**  
**Audited source code:** Development branch `sjn-phase1a-foundation`, commit `5aee094f718c955aa055cb7751edb2d7c9b372f6`. Always reverify HEAD before execution.  
**Authorized review scope:** Staging Supabase project `aozknkrwafowsrehdwlr`; production Supabase `yapvnevvjfewvafbjcgc` and `main` are strictly out of scope.

## 2026-10-17 — Approved staging import request: pre-existing data, FULL PARITY VERIFIED (NO INSERT PERFORMED)

**User approval:** Owner authorized only the staging import of the original 74 Biology MCQs, preserving IDs/content and performing verification. This approval does not permit production, testing history deletion, schema redesign, or quiz UI changes.

**Unexpected preflight observation:** On preflight, staging `public.mcqs` ALREADY contained **74 rows**, IDs 1–74. Prior read-only snapshot from earlier this date reported zero. **The insertion occurred before this execution, through an unknown actor or path. We did NOT execute an import/INSERT/UPDATE/DELETE or claim credit for the insertion.** Two tracked staging migrations remain: `20261012215543_create_staging_lms_schema_and_rls` and `20261012221323_restrict_staging_signup_trigger_execution`; no separate database migration for this import was listed. Do not infer who uploaded the questions.

**Verification performed:** Re-fetched `public/index.html` from branch HEAD `ab037208ae340c5bf73f2630758a55df2f621786`, extracted the original inline array without editing it, and confirmed the established literal FNV1a64 checksum `a2e57e72716394e8`. It parsed **74** original question records with unique IDs 1–74, required original eleven fields, four answer options and valid correct indices. A read-only SELECT retrieved all **74 existing staging MCQs** and compared every source property against its DB field: `id`, `bank`, `subject`, `chapter`, `topic`, `source`, `question`, `options` ↔ `options_json`, `correctIndex` ↔ `correct_index`, `explanation`, `mnemonic`. Result: **74/74 exact matches, zero mismatches, zero missing, zero extras**. This establishes data-content parity, not the origin of the unexpected import.

**Additional read-only checks:** `pg_get_serial_sequence('public.mcqs','id')` returns `public.mcqs_id_seq`; `pg_sequences.last_value=74`, which is consistent with assigning 75 for the next identity-generated insert under normal conditions (not a guarantee against concurrent writes). `public.attempts` remains **37**, `public.bookmarks` **0**. All source question data is still present in the website code. Staging Vercel branch's last checked deployment for code commit `ab037208ae340c5bf73f2630758a55df2f621786` showed **READY**; this is deployment status, not independent authenticated/mobile E2E test success.

**Outcome:** Intended 74-question data presence and exact parity achieved already; **do not run another import**. No rollback is needed. The detailed import algorithm in this document is retained as the *proposed contingency* for a future fresh environment and should not be mistaken for an executed migration.

**Pending quality gate:** Confirm via owner/browser testing of staging Create Test → Tutor/Timed → results and Phase 4 opt-in, since the remote bank is now nonempty and `loadContent()` uses it. No claim of manual browser acceptance, authoritatively timed deploy, or end-to-end student-account isolation testing has been made by this check. Later Stage 3B per-question attempt persistence still needs a new explicitly approved design/implementation scope.

**Security/release boundary:** No app code, staging DB records/config, GitHub `main`, production Supabase or production Vercel modified. The only committed change from this verification is documentation of observed results.

## Product rules that affect data modeling

- An ordinary question belongs to **either Past Papers Question Bank or SJN Question Bank, never both**. A single `mcqs` table with exactly one `bank` field per record is consistent with that rule; a dual-bank membership/junction system is not required. Future admin-controlled duplicate detection rules can be added without requiring one table per bank.
- The source 74 MCQs are all **Biology**, chapter **Biological Molecules**, bank **Past Papers Question Bank**. Do not invent SJN-bank records.
- Premium course tests are **separate, restricted content**; only authorized admin/manager staff may later select content for publishing into one regular bank. Students cannot publish questions. Never put premium course questions or answer keys into the current anonymous-readable MCQ table.
- Future Create Practice Quiz default **Unused**, with multi-select Used/Incorrect/Marked including all-four combination. Detailed semantics later, only after question-level attempt storage. No wizard redesign now.

## Read-only source and schema facts

- Original JS source: `public/index.html` embeds `mcqQuestionBank` with 74 questions, IDs **1–74**. Original test `tests/phase4-preservation.test.js` locks the literal with fingerprint **FNV1a64 `a2e57e72716394e8`** and tests exact count, IDs and each answer index. **Never loosen this gate or reword the original questions during import.**
- Existing staging `public.mcqs` is **empty (0 rows)** at last inspection. It already has `id bigint GENERATED BY DEFAULT AS IDENTITY`, `bank`, `subject`, `chapter`, `topic`, `question`, `options_json jsonb`, `correct_index integer`, `explanation`, `mnemonic`, `source`, and default `created_at`.
- Staging had 37 aggregate-only test attempts and 0 bookmarks at last read. No deletion is necessary for this 74-question import. Existing bookmark FK targets `mcqs(id)`.
- Existing `server.js` returns DB question rows via `publicMcq()` in `/api/content`. **CRITICAL:** `public/index.html` `loadContent()` replaces the hardcoded question list on any nonempty remote `data.mcqs` array. The import will therefore affect the actual staging quiz immediately, with NO separate frontend code switch. A partial import can break staging; never import question-by-question in independently committed calls.

## Mapping — source → existing DB

| Source field | DB column | Verification |
| --- | --- | --- |
| `id` | `id` | Preserve unique IDs 1 to 74 |
| `bank` | `bank` | Always Past Papers Question Bank for these 74 |
| `subject` | `subject` | Biology |
| `chapter` | `chapter` | Biological Molecules |
| `topic` | `topic` | Preserve literal string |
| `source` | `source` | Preserve year/source text; do not infer year |
| `question` | `question` | Preserve every character |
| `options` | `options_json` | Preserve four choices and their order |
| `correctIndex` | `correct_index` | Preserve original zero-based 0–3 |
| `explanation` | `explanation` | Preserve literal string |
| `mnemonic` | `mnemonic` | Preserve literal string |

The `created_at` default requires no special mapping. A new schema or separate bank tables are NOT required solely to import these records.

## Proposed execution — staging-only, needs explicit separate owner approval

1. **Preflight:** Reconfirm exact staging project, source branch commit and source fingerprint, current `mcqs` count 0, RLS and table definitions. Extract the 74 source objects deterministically from the accepted source (not by retyping), producing a temporary validated manifest in the authorized import environment. Validate 74 distinct IDs, all 11 mapped fields, nonempty strings, four options each, valid correct indices, exact bank and subject.
2. **Atomic database import:** Insert the full set as **one database transaction** using an authorized migration/import tool. Validate all 74 records and field-for-field parity **before committing**. Abort/rollback if even one is missing, already present, mismatched or rejected. Do not use silent `ON CONFLICT DO NOTHING` or destructive `ON CONFLICT DO UPDATE`. Existing BY DEFAULT identity supports explicit IDs; **advance/reset its sequence safely** after inserting IDs 1–74 to prevent collisions with future admin inserts.
3. **Post-import verification:** Re-read the 74 staging rows and map them through the existing server field representation. Confirm exact IDs, answer keys, options and every text metadata field; verify the `/api/content` output returns the same 74-question bank. Preserve source fingerprint, unchanged source JS, current accounts, test attempts and bookmarks.
4. **Functional acceptance:** Test actual staging Create Test selection, question pool/count, Tutor, Timed, Phase 4 SPA exam, submission, result metrics, mobile, refresh, user isolation, bookmark FK behavior (when separately implemented), and empty/error fallback. Run `npm test`, `npm run check:release` and relevant deploy checks. Staging-only deployment may occur from future separately approved *code* adjustments; no production changes.
5. **Failure handling:** If transaction fails, ROLLBACK automatically. If a committed staging import behaves incorrectly, halt; obtain owner approval for exact-74-ID targeted rollback after verifying dependencies and a restore plan. Never issue broad deletion or modify production.
6. **Permanent handover:** Record migration ID and commit, source and output checksums, attempt failures, final implementation, verified test outcomes, identified limitations, and whether any temporary diagnostic code was added (register it immediately). Do not include any credentials.

## Deferred after this verified import

- **Phase 4 Stage 3B question-level attempt history** with student-scoped RLS, saved ordered questions, responses and immutable question version/snapshot where required.
- Review Test / Retake / Test History; functional Mark for Review and Report MCQ Issue; later improved Create Practice Quiz including Used/Unused/Incorrect/Marked; future premium course tests, analytics and Mistake Diary.
- Large-scale indexing, server-side pagination and precise question duplication detection before growing toward 30,000–50,000 MCQs. Current `/api/content` fetch-all should not be assumed appropriate for that scale.

**Next decision:** Owner to approve or adjust the precise **atomic import of 74 original Past Papers MCQs into staging Supabase**, using unchanged IDs 1–74 and all fields. This document is not itself permission to import, change the schema, reset test history or deploy production.
