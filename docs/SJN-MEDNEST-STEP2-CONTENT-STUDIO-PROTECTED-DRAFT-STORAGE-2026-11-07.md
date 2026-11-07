# SJN MedNest Management — Protected Content Studio Draft Storage Handover
Date: 2026-11-07 (Asia/Karachi)
Branch: `sjn-phase1a-foundation`
Status: **Management draft backend deployed, database guards validated, GitHub CI PASS. Browser UAT / Vercel deployment pending. No student publishing.**

## Owner authorization and purpose
Owner explicitly approved continuing development while Vercel's Hobby deployment quota was exhausted, prioritizing the complete Management Panel and critical deferred LMS features before the ambitious Nov 8–9 launch target. This batch completes server-side **unpublished draft persistence** for Content Studio without any cross-project Student LMS operations.

## Three environments — preserve boundaries
- Canonical brand: **SJN MedNest Academy**.
- Exactly two website surfaces: `sjnmednest.com` main Academy + full Student LMS together, and `admin.sjnmednest.com` separate Management Panel. Public DNS routing **not yet promoted**.
- Main LMS staging Supabase `aozknkrwafowsrehdwlr`: source of existing 1,275 MCQs and versioned exam content. **No database migration, student data writes, auth changes or new keys on student project in this work.**
- Independent Management Auth Supabase `tdqbjhrmfluiinntmjfh`: private staff membership and now unpublished Content Studio draft storage.

## Backend implemented and DEPLOYED
- SQL source `database/management/isolated-content-studio-drafts-20261107.sql`; `mednest_content_studio_drafts_20261107` migration applied successfully to **management-only** Supabase. Two new tables:
  - `mednest_content_draft_batches`: UUID batch id, staff user owner, unique client idempotency UUID, title, `draft` status, timestamps.
  - `mednest_content_draft_rows`: batch FK, row position 1–3,000, JSON draft fields with size constraint, SHA-256 draft content hash, timestamps.
- Both tables have RLS **enabled and zero public/anon/authenticated policies** deliberately, and table privileges revoked from `anon`/`authenticated`. Verified SQL `has_table_privilege` for both tables: `anon_read=false`, `authenticated_read=false`, `authenticated_insert=false`. Server service-role access only.
- Edge Function source `database/management/mednest-content-studio/index.ts`; `mednest-content-studio` **ACTIVE v1**, `verify_jwt=true`, independent management project. Authorization validates exact Management Auth issuer/audience, live session ID in `auth.sessions`, Supabase Auth `getUser`, confirmed email and matching active `chief_admin` membership **on every request**, and strict protected preview Origin. No other staff role currently authorized.
- API operations exclusively `batch.list`, `batch.create`, `batch.get`, `batch.save_rows`; **no publish, student read/write, source-key edits or student service-role credentials**.
- Batch idempotent creation by client UUID, maximum 60 stored batch names per Chief, max 3,000 rows/batch, 40 rows/chunk, max 100 rows/read page, exact allowed field/length validation, SHA-256 stored content fingerprints; bounded JSON payload, no question text in audit.
- No server-side publishing of actual student `mcqs` has been implemented or implicitly authorized.

## Professional Content Studio frontend wired in GitHub, NOT browser deployed yet
- `apps/management/content-studio-storage.js`: same **isolated management** Supabase Auth session storage key as professional Chief client; calls management-only Edge; creates/resumes batches with idempotency key, saves chunks of 40, paginates read 100 rows, never requests student Supabase.
- `apps/management/content-studio.js`: explicit **Save Draft Batch**, Refresh Saved Batches, Load Selected Batch, progressive save status; loading replaces browser drafts only after user confirmation; failed load leaves prior browser data intact; clear detaches previous batch; on management sign-out, browser drafts and recipient data are scrubbed.
- `apps/management/integrated-auth-preview.html`: professional Chief-only Content Studio module includes Save/Load fields and an explicit reminder that this never publishes to the LMS. Existing question draft editor, CSV import, duplicate warnings and draft JSON export unchanged.
- `apps/management/app.js`: existing navigation reused; student LMS JS/HTML untouched.

## Verification
- Dedicated DB query after migration: **0 draft batches, 0 draft rows, 1 active Chief**. No test MCQs were written to student LMS or even Management draft tables.
- Management project Security Advisor: RLS/no policies INFO on private service-only tables is **intentional fail-closed**. Separate, pre-existing warning: Auth leaked-password protection disabled (consider enable before wider staff onboarding; no settings changed in this batch).
- GitHub CI at source commit `07edbbb5cfc3b0ded72e6cfb1f6c6c07494f249d`: **both Foundation workflows SUCCESS**, `tests/management-content-studio-storage.test.js` checks Chief and session guard, scope, quotas, browser wiring, non-public direct privileges and no publishing calls. Earlier test failures were test assertions matching project-identifying comments, corrected before final PASS.
- **Vercel Hobby deployment limit** still blocks new preview deployment. Latest checked ready Management Panel deployment source remains older `3da37a9631dbf3657285684aff2d5be502bf034b`; no claim that new save/load UI is browser available.

## Remaining release gates / next engineering work
1. Chief authenticated browser E2E once Vercel quota resets: sign in; add MCQs and CSV; Save Draft Batch; refresh; Load Selected Batch; compare source/options/key; test signout scrub; confirm zero student changes.
2. XLSX ingestion library/worker and controlled 500–3,000 row chunk import with resume, normalized taxonomy mapping and duplicate detection against existing published MCQs. Don't conflate local CSV parser with full Excel support.
3. Academic review and publishing policy (Direct vs 1 or 2 reviewers), per-field change history, reviewer security and corrections provenance; **do not auto-publish**.
4. An independently scoped management-to-student academic publication service with explicit technical permission model and separate release migration, transactional revisions, immutable historical student attempt references, accurate source/answer keys, and negative auth/performance tests. **No client-side student Supabase service key**.
5. Team invitations still disabled until verified staff creation/acceptance E2E. Full-Length Past Papers, Courses & Sessions, Student Management, Academy Resources, Feature/Enrollment Access and high-priority LMS deferred items require separate staged work.
6. Release of main `sjnmednest.com` and `admin.sjnmednest.com` requires product owner approval, Vercel deployment quota availability, reliable infrastructure plan, student content/backups/auth/redirects/regression and desktop/mobile UAT. Deadline is a target, NOT a validated assertion that all remaining modules are already complete.

**No new paid service, production DNS, student content update or risky exam-engine change in this batch.**
