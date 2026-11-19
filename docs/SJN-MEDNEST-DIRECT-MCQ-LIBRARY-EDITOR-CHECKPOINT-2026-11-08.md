# SJN MedNest — Direct MCQ Library and Correction Draft Editor Checkpoint
**Date:** 2026-11-08 Asia/Karachi
**Branch:** \`sjn-phase1a-foundation\`
**Status:** Management-only edit-draft DB migration applied; MCQ Library Edge **ACTIVE v2**; editor UI in GitHub source; automated CI passed; Vercel preview / Chief browser UAT PENDING; Student LMS publishing DISABLED.

## Owner's approved direction
Create a professional Admin/Management Panel with no need for XLSX/CSV just to correct a single existing MCQ. The Chief can browse/search by ID or question text, filter bank and subject, open a question, see the original question/options/key and edit answer, explanation, mnemonic, source and syllabus classification with a direct editor. The existing source version and historical attempts must never be silently overwritten. Owner testing and approval are mandatory before finalization.

## Independent student source read-only inspection
- Student **staging** Supabase \`aozknkrwafowsrehdwlr\` contains **1,275 MCQs** and **1,996 MCQ revisions**, with **0 records missing \`current_revision_id\`**.
- Actual banks: \`Past Papers Question Bank\` (146); \`BUMHS MDCAT Past Papers\` (180); \`KMU MDCAT Past Papers\` (180); \`NUMS MDCAT Past Papers\` (150); \`SIBA MDCAT Past Papers\` (180); \`SZABMU MDCAT Past Papers\` (180); \`UHS MDCAT Past Papers\` (180); and **segregated** \`SJN MedNest Course Tests\` (79). The library permits **only the seven ordinary/regional past-paper bank names**, never course-only content.
- \`mcqs\` has public SELECT for ordinary source and a \`current_revision_id\`; \`mcq_revisions\` is protected with \`sjn_mcq_revisions_immutable\` trigger preventing UPDATE/DELETE. A source read-only key is used by the separate management backend; **no student service-role credential or write operation exists in that backend**.
- Original Full-Length Past Papers, Past Papers Question Bank, and restricted courses remain distinct; no publishing to any category from this batch.

## Management-only schema / API
- On **independent** Management Auth Supabase \`tdqbjhrmfluiinntmjfh\`, successfully applied \`database/management/isolated-mcq-library-draft-edits-20261108.sql\` migration \`mednest_mcq_library_edit_drafts_20261108\`.
- \`mednest_mcq_edit_drafts\`: one proposal per owner and original MCQ ID, original revision ID, original immutable snapshot JSON, editable proposal JSON, approved syllabus topic ID (optional), optimistic version number, draft/discarded state and timestamps.
- RLS enabled; no direct client access. Verified **anon SELECT=false, authenticated SELECT=false, authenticated UPDATE=false, authenticated direct RPC execute=false**. Service-role-only RPC validates live Chief session and role in the database, uses optimistic concurrency, records audit metadata, does not touch student MCQs.
- Deployed \`database/management/mednest-mcq-library/index.ts\` as Management Auth Edge \`mednest-mcq-library\` **ACTIVE v2**, JWT verification ON, exact Chief-confirmed email and active session, allowlisted Management Panel Origin, bounded 25-row pagination, MCQ ID/exact numeric and text search, bank/subject filters. Explicit allowlist excludes the 79 course test MCQs.
- \`mcqs.get\` returns live source revision and the Chief's previously saved correction draft, if present. \`mcqs.save_draft\` fetches live student source first, compares \`expected_revision_id\`, verifies all four options and answer key, validates a selected approved syllabus topic's full active Subject→Chapter→Topic path, and only then calls Chief-session authenticated management draft RPC. Every successful mutation responds \`published:false\`.
- No operations for student MCQ UPDATE, DELETE, INSERT, publish or historical revision mutations. Real editing/publication requires a later dedicated reviewed and authorization-scoped student content write service.

## Professional Management Panel (GitHub source, not deployed yet)
- \`integrated-auth-preview.html\` now includes a searchable MCQ Library above Content Studio drafts and a full direct edit form.
- \`apps/management/mcq-library.js\` uses independently authenticated Chief Management session: first load, search, bank/subject filter, pagination, source revision snapshot, direct A–D/text/answer/explanation/mnemonic/source edits, optional approved active syllabus topic picker (populates subject/chapter/topic), explicit unpublished save confirmation, in-place draft reopening, optimistic versioning, source conflict handling, sign-out memory clearing.
- \`apps/management/syllabus-manager.js\` now exposes approved active **stable topic UUIDs** to the MCQ Editor; provisional existing MCQ topic labels are not automatically approved.
- No CSV file is required for direct editing. Existing Content Studio draft import/batch tools continue separately.

## Test verification
- Real Management-only SQL transaction used an existing eligible Chief Auth session; simulated one MCQ correction draft, incremented version and checked stale update rejection; entire transaction rolled back successfully. Follow-up DB read-only inspection: **0 persistent edit drafts, 0 canonical syllabus entries, 1 active Chief**.
- Added \`tests/management-mcq-library-direct-editor.test.js\` with server-side auth, source read-only, excluded course bank, revision checks, table/RPC grants and direct editor form assertions.
- Latest GitHub source checks at \`3b6a87c6dddbb5205821bab3e90d219573d16d83\`: **2 SUCCESS**. Earlier regression test failure was a wrong test assertion on source field alias, corrected.
- Vercel latest protected Management Panel deployment was previously checked at source \`3da37a9631dbf3657285684aff2d5be502bf034b\`, older than this source. Hobby daily deployment limit remains an obstacle; this feature has **not** undergone Chief real-browser/manual UAT. Do not claim ready for public release.
- No changes to student staging DB, existing question bank content, live test results/history/analytics, production Supabase or DNS in this batch.

## Remaining release gates
1. Batch deploy current protected Management Panel preview after Vercel quota permits, run Chief interactive desktop/mobile tests: browse/filters, open MCQ, change a draft, save/reload, stale revision and tab-conflict, source unchanged, no course-only content or student data leakage. Verify approved-syllabus selector after owner imports their syllabus.
2. Build Academic Review policy (Direct Publish/1 reviewer/2 reviewers as configured, granular staff permissions, audit, reviewer independence); do not activate staff invitations/permissions until isolated staff Auth UAT passes.
3. Build **separately authorized** student-side versioned publishing API: preserve existing \`mcq_revisions\` append-only semantics and all completed student attempt revision links; source-preserving regional paper rules, transaction, conflict detection, backup/rollback, negative auth tests, rate limits and performance budgets. Browser never receives student service key.
4. Existing source \`mcqs\` public SELECT currently includes course content, but this new Chief API deliberately excludes course-only bank. A separate security review of broader student data exposure/paid mock assessment policy is still required before production.
5. Complete Full-Length Past Papers/Courses & Sessions/Academy Resources/Student Enrollment/Team Permissions and student-critical deferred issues in independently tested batches; no blanket guarantee all features are launch-ready simply because source CI passes.

**Owner acceptance remains mandatory. Changes only in development branch and isolated Management Auth; Student LMS and public website untouched.**
