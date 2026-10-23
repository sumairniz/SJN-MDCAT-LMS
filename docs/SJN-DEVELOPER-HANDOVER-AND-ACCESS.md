# SJN MDCAT LMS Pro — Developer / AI Handover and Access Guide

**Established:** 2026-10-17 (Pakistan time)  
**Audience:** Academy owner, future human developers, ChatGPT, Gemini and other authorized collaborators.  
**Goal:** Continue development safely after conversations, AI plans or provider access change, without relying on memory or sharing passwords in code.

> **CURRENT HANDOVER UPDATE — 2026-10-22:** This guide was originally written at the 2026-10-17 Stage 3A checkpoint. Its older "current" stage, zero-database-MCQ count and unfinished Save & Exit/Review statements below are **historical snapshots, not current facts**. Before acting, read the [current Master Development Plan](SJN-LMS-MASTER-DEVELOPMENT-PLAN.md) and the [2026-10-22 Temporary Register audit addendum](SJN-TEMPORARY-CHANGE-REGISTER.md). Current owner-accepted staging features include 74 verified staging MCQs, manual Save & Exit/Resume, refresh recovery Option A, server-graded submissions, Results/Review/Retake, instant authenticated Test History cache, 25 tests/page and the simplified Test History heading. Autosave is permanently cancelled. The working branch remains `sjn-phase1a-foundation`, PR #1 remains draft; **production/main, staging release promotion, and production database are not approved for modification**. Continue source-first checks against exact GitHub/Vercel commits and update the Temporary Register as temporary flags are introduced or removed.

## 1. Start here — what currently exists

- **GitHub source:** https://github.com/sumairniz/SJN-MDCAT-LMS
- **Working development branch:** \`sjn-phase1a-foundation\`; last feature commit verified at the review baseline: \`656f97de1ca8e00d3bd7f831286565c0bc060792\` (Stage 3A Results Screen). **Pull request #1 is DRAFT and must not be merged without separate owner approval.**
- **Production branch:** \`main\`; **production domain:** https://sjn-mdcat-lms.vercel.app/ . Do not touch production merely to test a new feature.
- **Staging Vercel alias:** https://sjn-mdcat-lms-git-sjn-phase1a-foundation-sjn1.vercel.app/ ; a Preview deployment can be protected, requiring owner-granted access. Test-only Phase 4 URL switch \`?sjnPhase4Preview=1\` is documented as temporary in [Temporary Change Register](SJN-TEMPORARY-CHANGE-REGISTER.md). **Do not put Vercel share tokens in public documentation, commits or screenshots.**
- **Supabase staging project reference:** \`aozknkrwafowsrehdwlr\`; **production reference:** \`yapvnevvjfewvafbjcgc\`. They are distinct projects, not interchangeable; staging is the only future candidate for separately approved database testing.
- **Stack:** Node.js + Express (\`server.js\`); HTML/CSS/JavaScript client (\`public/index.html\`); Vercel; Supabase PostgreSQL/Auth with RLS; Tailwind CSS build using pinned \`package-lock.json\`; no React rewrite. Permanent 24-hour student session, signed HttpOnly cookies, user isolation and cross-tab sign-out protections need regression testing.
- **Source question bank:** 74 original inline Biology MCQs in \`public/index.html\`, until a separately approved, verified migration; staging \`mcqs\` contained 0 rows at this review.
- **Current user-facing Phase 4 progress:** opt-in Stage 2 exam workspace and owner-accepted Stage 3A Results Screen; complete Review/Retake, durable Save & Exit, marking and historical question-level persistence remain open. No claim of production readiness.

## 2. Access is controlled by provider accounts, NOT branch passwords

**GitHub branches do not have individual passwords.** GitHub permissions come from repository access and authenticated provider accounts. Similarly, Vercel and Supabase permissions are granted through their own account/team/project access settings. Do not invent or record passwords for branches, deployment aliases or databases.

**Safe handover inventory** (non-secret metadata only):

| Provider/service | What authorized developers need | How owner grants access | What must NOT enter GitHub |
| --- | --- | --- | --- |
| GitHub | Repository and branch/PR permissions | Invite collaborator with appropriate permission; developer signs into their own account | GitHub passwords, personal access tokens, SSH private keys, recovery codes |
| Vercel | SJN project, preview deployments/logs and relevant settings | Owner assigns appropriate project/team access when available; alternatively limited preview-share permission for testing only | Access tokens, protected share URL tokens, environment secret values |
| Supabase staging | Staging project access, schema/migration privileges appropriate to role | Owner grants access from Supabase project/organization UI | DB password/URI with embedded credentials, service-role/secret key, SQL passwords |
| Supabase production | Restricted production access separately approved | Owner-approved, least-privilege access only when needed | Production tokens, connection strings, recovery secrets |
| Email/domain/DNS and optional external integrations | Actual service owner and recovery method, if applicable | Owner controls login and delegates only needed role | Email passwords, OAuth client secrets, DNS/provider API keys |

**Store secrets in a reputable password manager or each provider's encrypted environment-secret store.** Owner should own the vault, retain account recovery and multi-factor-authenticator/backup recovery procedures, and invite individual developers rather than sharing the owner's entire email/password. If credentials must be shared for exceptional reasons, use the password manager's secure sharing with expiry/rotation, never chat/GitHub/issue trackers. Remove departing collaborators' permissions and rotate exposed keys.

**Non-secret handover notes can record** provider URL, project name/ref, credential-vault **item title/reference** (not its secret value), custodian/role, environment (staging/production), when last access was reviewed, and how to request access.

### Server environment variable names (names only, inspected in code)

\`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`, \`JWT_SECRET\`, \`ADMIN_TOKEN\`, \`GEMINI_API_KEY\`, \`GEMINI_MODEL\`, \`NODE_ENV\`, \`PORT\`, \`VERCEL\`.

**Do not copy current values.** Some fields may be optional or future-only; verify use, necessity and safe scoping from current code and project settings. \`JWT_SECRET\`, \`ADMIN_TOKEN\`, secret API keys and any elevated Supabase credential are particularly sensitive. An AI's connector authorization is **not** a password or a permanent transferable credential. Each new developer must be explicitly authorized by the owner.

## 3. For every new AI/developer session — mandatory reading

1. [Master Development Plan](SJN-LMS-MASTER-DEVELOPMENT-PLAN.md): project intent, feature baseline, approved/rejected decisions, outstanding risks.
2. [Phase 4 Interface Blueprint v1.3](SJN-PHASE4-INTERFACE-BLUEPRINT-v1.3.md): latest approved exam/results behavior (later owner changes supersede).
3. [MCQ Database Foundation Review](SJN-MCQ-DATABASE-FOUNDATION-REVIEW-2026-10-17.md) and [74-MCQ Staging Migration Plan](SJN-74-MCQ-STAGING-MIGRATION-PLAN.md): audited schema, exact mapping and next proposed staging-only import; not approved yet.
4. [Future Question Banks & Create Test](SJN-FUTURE-QUESTION-BANKS-AND-CREATE-TEST.md): **changeable** future two-bank, history filter, mark, admin, analytics and theme plan.
5. [Temporary Change Register](SJN-TEMPORARY-CHANGE-REGISTER.md) and [Release Safety Checklist](RELEASE-SAFETY-CHECKLIST.md): pre-merge blockers.
6. Latest GitHub branch commits, open draft PR and CI; validate staging/production environment and current HEAD again before any write.

A future developer should obtain **fresh live project evidence**, since branch HEAD, schema counts and authorized access can change after this snapshot.

## 4. Operating and validation guide

- Clone the authorized repository, switch to the development branch, and inspect code/diff.
- Locally: \`npm ci\`, \`npm test\`, \`npm run check:release\`, \`npm run check:css\` as relevant. Confirm any build/dependency prerequisites before changing them. Test results in a new environment must be measured—not presumed.
- Treat PR #1 as DRAFT, merge authorization and production deployment as **separate owner decisions**, and staging database migrations/deletes as requiring their own explicit owner approval.
- Never run SQL against production when aiming to test staging. Perform backups/rollback planning and query schema policies before migrations.
- Protect the original 74 records, student privacy, account switching, RLS, fixed 24-hour expiry, and existing source behavior. Investigate failed tests rather than disabling checks.
- No automatic deployment or service modification just because someone asked a technical question. Record exact approvals.

## 5. Lightweight permanent engineering history — owner-approved process

GitHub commits already show line-by-line file history; **avoid duplicating every code edit in long prose**. In the Master Development Plan (or focused \`docs/\` design/incident file), document each **significant stage**:

| Field | Required content |
| --- | --- |
| Context and original issue | Feature goal, evidence, accepted owner requirements |
| Design alternatives tried | Concise failed/partial approaches, why rejected; don't invent untried attempts |
| Final design and reasons | Why chosen, architecture, exact modified files/API/schema |
| Scope and owner permission | Development/staging vs production, specific approved operation |
| Commit / migration refs | Accurate identifiers, PR/review links, release boundary |
| Actual validation | Automated CI, browser/mobile and Supabase checks, unresolved failures |
| Known limitations / future work | Unfinished functionality, risk, rollback, temporary IDs |
| How to change safely later | Dependencies, migration/version compatibility, tests to rerun |

Use **CONFIRMED, OBSERVED IN CODE, VERIFIED, PROPOSED** consistently; record failed experiments rather than overwriting history. Reference the register for any temporary code **in the same commit** when introduced. Only mark a final implementation accepted if owner or tests actually verified it.

**Illustrative real checkpoint, not a fabricated success:** Stage 3A Results Screen implementation commit \`656f97d\` on development, two GitHub workflows passed and staging deployment reported READY; owner subsequently reported the Results Screen looked very good. Detailed Review/Retake was intentionally deferred; see [Stage 3A Results document](SJN-PHASE4-STAGE3A-RESULTS.md) and [TEMP-P4-006](SJN-TEMPORARY-CHANGE-REGISTER.md). This does **not** mean historical review/storage is finished.

## 6. Current task / do not proceed beyond approval

**Current authorized work:** read-only review and documentation of Phase 4 MCQ Database Foundation; design future Supabase structure for two named question banks and question-level history; explain options and obtain scoped approval **before** applying SQL/importing the 74 records. No official students yet; owner allows discussing potential cleanup of test attempt history, but no deletion without separately specified approval.

**Handover test:** A new developer must be able to identify current branch, hosting, DB scope, verified baseline, approved product behavior, unfinished temporary flags, test commands, pending migration decisions, access-request process and production restrictions *without reading private chat transcripts*. If not, improve this file.
