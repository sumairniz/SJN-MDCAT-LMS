# SJN Phase 4 Architecture Decision — SPA Quiz Workspace & Future MCQ Scale

**Date:** 2026-10-15
**Status:** OWNER APPROVED for Phase 4 development on staging; production remains separately gated
**Supersedes:** v1.2's conditional preference for a separate `quiz.html` file
**Related:** `SJN-PHASE4-INTERFACE-BLUEPRINT-v1.3.md`

## Decision

Use **SPA-style dynamic quiz navigation inside the existing LMS application**, without fetching or creating a standalone `quiz.html` page for each test. Render a focused exam workspace that hides the normal dashboard sidebar and footer, keeps the original SJN background/style, and maintains current authenticated client context. The selected test's URL should be able to reflect a dedicated route using the History API if beneficial and safe; no exact URL pattern is mandated yet.

The owner researched two reference academies and reports that they dynamically update the URL/UI without fetching a separate quiz HTML document. Treat that as supplied evidence of their observed behavior, not independently verified network evidence or a license to copy their design.

### Why this fits the current code

- Existing `public/index.html` already has a `switchModule` system, an in-memory filtered/shuffled question list, embedded original 74 Biology questions, authentication bootstrap and current quiz UI. New pages would require explicit, carefully tested state transfer and another document bootstrap.
- SPA transition can avoid full-document reload and duplicate bootstrapping during **in-app transitions**, likely improving perceived responsiveness. It does **not** guarantee zero latency or eliminate database calls for saving/resuming attempts.
- We do not need to adopt React or a large SPA framework. Keep the current codebase incremental and maintainable.
- A dedicated **experience** does not imply a separate **HTML file**.

### Acceptance conditions for implementation

1. Entering the exam does not reload the page. No dashboard sidebar/footer appears, but the exam controls remain visible on both desktop and mobile.
2. Refresh, hard-link routing, Back/Forward, history/navigation cancellation, Save & Exit and resumed attempts are consistent, with no test-loss or accidental submission. Design a safe fallback on an unsaved test during early rollout; do not claim draft recovery exists until persistence is implemented.
3. Preserve server-enforced signed-cookie/Supabase verification, 24-hour absolute session deadline, multi-tab account isolation and existing account-switch protections. No student A/B data mixing.
4. Preserve original bank **IDs 1–74**, question text, choices, answers, chapter/topic/source, explanations and mnemonics; never overwrite bank with empty Supabase content.
5. Keep existing wizard and previous quiz path stable while gradually introducing the new SPA screen; remove legacy behavior only after regression tests and owner acceptance.
6. CI, source-level tests, staging preview and manual mobile/desktop testing pass before treating Phase 4 as complete. Main, production database and production deployment remain unchanged without independent approval.

## Long-term question bank architecture — owner direction, not approved implementation

The owner expects multiple large banks, potentially 20k+ MCQs each and 30k–50k+ combined, managed through a separate future full-featured Admin Panel (bulk upload, corrections, removals/archiving, reports, courses and more). Do **not** build that panel in Phase 4.

Recommended future foundation: Supabase PostgreSQL for normalized, indexed, student-independent question records and bank membership; Supabase Storage (or equivalent object storage) for files/images; admin-authenticated batched imports with validation/deduplication/staging preview; minimal paginated or selected questions to student clients; snapshots/versioning for historical results and RLS-protected per-student attempt data. Existing staging `mcqs` is empty, and `bookmarks` references that table: inspect compatibility before migrating 74 embedded questions or changing mark persistence. Do not assume any free-tier capacity or cost threshold without measurements.

## Feedback and professional decision responsibility

The owner rightly noted that they depend on engineering guidance and should not be expected to know that SPA routing is an alternative. Future proposals must compare relevant architectures proactively, explain tradeoffs clearly, and recommend based on this project's code and security needs rather than treating a nontechnical owner as the designer of the implementation.
