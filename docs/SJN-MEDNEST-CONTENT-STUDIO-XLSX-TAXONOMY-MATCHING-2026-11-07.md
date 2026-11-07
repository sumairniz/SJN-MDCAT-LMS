# SJN MedNest Academy — XLSX/CSV Bulk Import and LMS Taxonomy Matching
Date: 2026-11-07 Asia/Karachi · Branch: `sjn-phase1a-foundation`

## Scope and owner requirement
Owner requested a robust Excel MCQ bulk-import workflow that **reuses existing uploaded LMS chapter/topic labels**, ignores capital/lowercase and harmless spacing differences, flags spelling variations for manual correction, supports a possible bulk cleanup of roughly 100 existing topic labels, and **does not disturb the working student test engine**. Work performed without Vercel deployment quota. No student database modifications or production routing changes.

## Read-only LIVE staging inspection
Student staging Supabase `aozknkrwafowsrehdwlr`, table `public.mcqs`, excluding segregated `SJN MedNest Course Tests`:
- 1,196 non-course MCQ rows.
- 97 distinct subject/chapter combinations including rows with missing topic.
- 415 distinct subject/chapter/topic combinations including null/blank combinations; **87 rows** have missing topic.
- Snapshot query only selected `subject`, `chapter`, `topic`, count; **no question statements, options, keys, student IDs, personal data or access tokens**.
- Among complete nonempty subject/chapter/topic rows, 393 distinct labelled combinations returned. Case-insensitive/extra-space normalization consolidated these to **392 label entries** and 81 chapter scopes. This snapshot is **not** a full official taxonomy, is **not continuously synchronized**, and may have old or inconsistent labels. Do not mistake it for a vetted official MDCAT/STB taxonomy.
- Source: `database/management/content-studio-taxonomy-snapshot-20261107.json`, and static management-only copy `apps/management/content-studio-taxonomy-snapshot.json`. This is a read-only snapshot and should be refreshed after future approved catalogue updates.

## Implemented source (GitHub; Vercel preview deployment still pending)
1. `apps/management/content-studio-taxonomy.js`: pure taxonomy reconciliation. Unicode NFKC, trim, consecutive-whitespace collapse and case-insensitive exact matching; scoped first by Subject, then Chapter, then Topic. Existing canonical label is reused for exact matches, including capitalization differences. Character-level approximate matching returns *suggestions only* (never accepted as exact or automatically published); missing chapter/topic requires explicit Chief selection from existing catalog.
2. `apps/management/content-studio-xlsx.js`: native client-side XLSX/ZIP worksheet parser with browser `DecompressionStream`, XML text extraction, first-worksheet only, shared/inline strings, 20 MB packed archive limit and stricter entry/expansion limits. Rejects encrypted workbooks, unsafe XML entities, formulas (must paste values), malformed archive, oversized files. Imports first sheet only; other sheets need separate import. Converts sparse worksheet rows to padded CSV, then sends through the existing strict draft validator. Browser acceptance requires actual desktop/mobile testing after deployment; do not call this production-verified just because source CI passes.
3. `apps/management/content-studio.js` + professional `integrated-auth-preview.html`: accepts CSV/XLSX; imported exact matches are canonicalized to existing LMS labels; flagged rows display Match Existing Topic and Chief-controlled Chapter and Topic pickers, with no direct publishing. If taxonomy snapshot is unavailable, rows remain review-only. Manual selections cannot create new labels in the live student database.
4. Bulk taxonomy correction proposal tools: `content-studio-taxonomy.js` provides `reviewRenamePlan`, collision checks and CSV template; professional Content Studio includes a dedicated topic-renaming proposal upload/review table and JSON export. Up to **1,000 review proposals** per CSV, exact subject/chapter source must exist; no-op capitalization/whitespace changes, duplicate source proposals, and target-label collisions are invalid. **This is review and export ONLY**. No existing live LMS topic names were modified or merged, and no mass update RPC exists.
5. `tests/management-content-studio-taxonomy-xlsx.test.js`: scoped case-insensitive matching, typo suggestions, collision/rejection, safety boundary, XLSX CSV conversion, metadata-only snapshot, bulk correction proposal tests. Existing Content Studio tests updated to allow local taxonomy snapshot fetch while continuing to forbid student API calls.
6. Final source code/test commit `7bb462ccb08018e6893ee7b0c37b38532c4a4021` — **2 GitHub Foundation CI workflows SUCCESS** (runs `42400122631`, `42400116865`).

## Critical business and security rules
- No guessing of answer keys, chapter names, or textbook correctness; do not silently rewrite original past-paper MCQ wording. Spelling correction affects *taxonomy metadata only* after academic approval.
- Distinguish existing ordinary Past Papers Question Bank from original Full-Length Past Papers, academy-created SJN Question Bank drafts (not yet published student bank), and course-only questions that must remain segregated. Matching scope must be subject/chapter/topic; two topics with identical spelling in separate chapters remain separate.
- English and Logical Reasoning approved taxonomy requires Chapter=Topic (case-insensitive equivalent). Source file might omit topics for some full-length past papers; review rather than manufacture labels automatically.
- Exact-case matching is not a database schema migration; reference catalogue should eventually contain stable taxonomy IDs, normalized unique scoped labels and accepted aliases. New topics and bulk renames require independent approval, audit, collision handling, review of student analytics/filter semantics, and an explicitly authorized versioned student-data migration, especially if old exam attempts refer to historical labels.
- Existing protected Management Content Studio draft database and dedicated Edge service from prior checkpoint remain intact. These source changes add no student DB writes and do not activate any publishing or staff-mutating functionality.

## Next engineering batch
- Build official stable taxonomy registry and alias governance; let authorized content managers map import columns and fix 100-topic correction proposals with preview/approval before any DB mutation.
- Academic Review: draft → review, Direct Publish / one reviewer / two reviewers per owner policy, immutable source history and server-enforced permissions.
- Separate, carefully scoped staff-to-student publishing bridge with server-controlled validation, historical revision safety and audit; no frontend student Supabase service-role keys.
- Benchmark 500–3,000 MCQ batches, genuine XLSX browser import, blank cells, multiple worksheets, duplicate detection against *published* bank, and negative/security load cases.
- Vercel quota still blocks newly deployed Management Panel preview; do not claim this feature is live until deployment and Chief browser UAT. No paid upgrade authorized.
