# Mistake Diary V1 — Staging Implementation and Owner Handover (2026-11-05)

## Status and explicit approval
- **Owner:** Approved implementation after detailed feature/layout discussion on 2026-11-05 (Chat 8).
- **Current:** Staging implementation complete in feature scope; GitHub automated verification and Vercel preview to be checked on the exact latest HEAD; **owner real-device visual/functional UAT pending**. Do NOT classify as owner-accepted yet.
- **Scope:** Branch `sjn-phase1a-foundation` and staging Supabase project `aozknkrwafowsrehdwlr` only. PR #1 draft/unmerged; do not modify `main`, production Supabase or production deployment without separate approval.
- **Precondition:** Dashboard V1 finalized by owner; five-level criteria and quotation provenance audit are separate future/release tasks.

## Product implementation
1. Mistake Diary has a sidebar tab, a small amber **LEARNING JOURNAL** eyebrow, bold title, explanatory subtitle, four restrained professional summary cards and subject accents. Isolated, mobile-responsive CSS follows accepted Dashboard / My Analytics design principles.
2. **Every genuinely wrong answered item** from an atomically submitted student practice test is automatically included. Uses stored `attempt_items.selected_index IS NOT NULL` + `is_correct=false`, links the actual owning `attempts` row with `details_version=1`, and reads its immutable `mcq_revisions` snapshot. No second writes in the grading transaction; no data fabricated from legacy summary-only tests; skips excluded.
3. **Three sources:** (a) both normal Question Banks combined, **Subject → Chapter → incorrect MCQs**, each with its original bank and topic badges, no separate topic navigation screen; (b) **My Courses** grouped by Course Test with course and test labels even where chapter metadata missing; (c) **Full-Length Past Papers** by original exam paper, with chapter/topic metadata shown on questions where present.
4. Every MCQ expands **in-place**, showing all original four A–D answer options; original wrong answer red, correct answer green, remaining neutral; immutable explanation / mnemonic, source / subject / chapter / topic and original question retained. **Previous / Next** within 20-item page. No duplicate quiz engine.
5. Optional, editable student **Learning Note** (max 1,200 chars), student-only category **Information Gap, Conceptual Mistake, Silly Mistake, Retention Gap**. Unedited entries are **Not Categorized**, not a fifth category. Review status **Need Review, In Progress, Mastered**; default Need Review. Category and status are *never inferred automatically* from performance.
6. One Diary entry per **student/question**, even after multiple incorrect attempts. Most recent wrong response and repeat count displayed. A later wrong attempt after the student marked an entry Mastered makes the effective display status **Need Review** until student explicitly resaves review progress. Notes/category preserved.
7. Filters by review status and mistake type, server-side paginated at 20 items; compact breadcrumb and source-group navigation. Empty/failed states are honest. Saved annotations require verified HTTP success and refresh summary independently. Dashboard/Analytics/History remain separately maintained.

## Persistence and access controls
- Migration `database/migrations/20261105_mistake_diary_v1.sql` was **applied to staging only**; new `sjn_mistake_annotations` student-owned table with PK `(user_id,mcq_id)`, strict category/status enum and note limit, updated-at trigger, RLS policies for read/insert/update, and no user delete workflow in V1.
- Read-only `sjn_mistake_diary_entries` **security_invoker** view derives the latest verified wrong answer per student/question. The `sjn_mistake_diary_catalog()` RPC is **SECURITY INVOKER** and returns summary/group counts. No service-role bypass, grants only for authenticated users. API additionally filters by `req.user.id` and validates all query parameters.
- Three authenticated API routes: `GET /api/mistake-diary/catalog`, `GET /api/mistake-diary/entries` (source/group/page/filter), `PUT /api/mistake-diary/annotations/:mcqId` (verifies existing genuine wrong answer, then RLS upsert). Existing cookie + bearer authorization and per-request Supabase client reused. The submission transaction is unchanged.
- A partial index on `attempt_items` covering genuine wrong responses supports query performance.
- The existing **course entitlements restriction remains a production release blocker**: pilot course tests are currently accessible to any signed-in staging student. New Diary does not add a way to bypass those permissions, but server-enforced future course access must also constrain Diary before public paid-course release.

## Verification performed
- Staging SQL read found **252 distinct student/question wrong entries** from existing persisted historical responses (under separate, preexisting student accounts); 104 in Question Banks, 53 in Courses and 95 in Full-Length Papers. Those counts are *development-only reference observations*, not one user's Dashboard counts or fixed production values.
- All 252 derived entries had exactly four options; 0 malformed option arrays; none was artificially assigned a category.
- RLS enabled, policies restricted to authenticated student ownership, no unauthenticated table/view SELECT grants; executed a real authenticated-role, scoped claim isolation check against the view and student catalog.
- GitHub test `tests/mistake-diary.test.js` protects UI integration, correct/wrong option presentation, category/status labels, safe server input, immutable-history derivation and non-interference. Check exact latest GitHub Foundation status and Vercel preview before declaring READY.

## Owner UAT / release checklist
1. Authenticate in staging on desktop: navigate sidebar Mistake Diary and check amber heading / metrics / cards against My Analytics.
2. In **Question Banks** select Subject → Chapter, confirm source badge (SJN vs Past Papers Question Bank), correct topic and full A–D response.
3. In **My Courses** select Genome test; in **Full-Length Past Papers** select the original paper; verify test/paper grouping and immutable question text.
4. Save one category + optional note + status; reload tab/site and confirm persistence, summary count update, personal data isolation.
5. Change an item to Mastered and submit that same MCQ incorrectly again; confirm visible Need Review without deleting notes.
6. Verify filters, 20-item pagination, Previous/Next and Android small-screen readability; signed-out / account-switch never shows another student's entries.
7. Confirm atomic Submit/Results/Retake speed, Test History, My Analytics, Dashboard, Courses and Resources are unaffected.
8. Before production: harden real course entitlements, review semantic grouping for future course/paper types, check DB performance with real larger histories, and reconcile release/temporary registers.

## Files
- `database/migrations/20261105_mistake_diary_v1.sql`
- `lib/mistake-diary.js`
- `server.js` (isolated route registration)
- `public/sjn-mistakes.js`, `public/sjn-mistakes.css`
- `public/index.html` (sidebar, SPA lifecycle, asset links, invalidate/reset hooks)
- `tests/mistake-diary.test.js`

**Permanent scope:** No autosave, no AI diagnosis, no reminder scheduler, no separate diary quiz engine, no change to original academic content or scoring, no new production or `main` writes.
