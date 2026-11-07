# SJN MedNest Academy — Product Identity and Domain Architecture Lock
Date: 2026-11-07 (Asia/Karachi)
Status: **Confirmed product architecture; future domain purchase and DNS setup pending.**
Purpose: prevent development drift caused by inaccurate voice transcription or outdated branding proposals.

## Canonical branding
- **Academy:** SJN MedNest Academy (**MedNest**, not MadNest, Madness, or H10madness).
- **Management:** SJN MedNest Management Panel / Academy Management Workspace.
- Legacy project/repository/technical identifiers may still contain earlier names; do **not** silently rename projects, database IDs, URLs, deployed app identifiers, or historical documents.

## Exactly TWO website surfaces
1. **One primary Academy website:** public academy pages, student registration/sign-in, and the **entire Student LMS together on the same site/domain** (MCQs, courses, tests, results, history, analytics, learning resources, etc.). **Do not introduce a separate student LMS subdomain** without a new explicit owner decision.
2. **One separate Management Panel:** Chief Administrator and permission-authorized academy staff on **`admin.<academy-domain>`** once a custom domain is purchased and configured. Management authentication is an independent Supabase Auth project as separately approved, but **an Auth project is not another public website**.

## Domain status and release safety
- Owner has **NOT yet purchased a custom domain**; expects to purchase one after resolving checkout, potentially later today. User has not confirmed the final domain spelling; do not infer it from speech transcription, examples, or previous assistant claims.
- Current project work uses Vercel `.vercel.app` addresses. Future domain purchase requires owner confirmation and separate review of Vercel DNS / Auth redirects, email sender DNS (DKIM/SPF), HTTPS, and deployment release gates.
- A single purchased domain with `admin.` subdomain is sufficient for the intended two-site structure; **do not purchase or create any extra domains or student-site subdomains**.
- **Never treat a misheard name or illustrative URL as approval** for rebranding, DNS changes, GitHub rename, database migration, deployment or authentication cutover.
- All future changes: Discuss → Finalize → Owner Approves → Implement, with staging tests, student-data isolation, rollback plan and continuous documentation.

## Interim work while domain is not purchased
- Keep isolated Management Auth project and existing Student LMS staging unchanged.
- Continue **non-domain-dependent Management Panel development**: safely integrate already verified isolated Chief sign-in with the professional existing Management Panel **in a preview first**, use the isolated team directory while writes remain locked, and continue scoped Question Content Studio design/implementation after explicit approval.
- Staff invitation emails and sensitive-action email codes remain gated until the **verified sender domain, secrets, and end-to-end tests** are complete. Do not bypass these gates or use shared student Auth to create staff accounts.
- Do not promote to production/main, add paid services, or alter student exam/history flows without explicit approval.

References: `docs/SJN-DEVELOPER-HANDOVER-AND-ACCESS.md`, `docs/SJN-LMS-MASTER-DEVELOPMENT-PLAN.md`, `docs/SJN-MEDNEST-MANAGEMENT-STEP2-TEAM-ACTIONS-STAGING-2026-11-07.md`.
