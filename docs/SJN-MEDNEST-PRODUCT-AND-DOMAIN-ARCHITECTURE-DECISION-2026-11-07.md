> **2026-11-07 — DOMAIN PURCHASE & INCLUSIVE MANAGEMENT COUNTS:** Owner reports buying **sjnmednest.com**, now canonical approved spelling. Exactly two sites: `sjnmednest.com` main Academy + complete Student LMS; `admin.sjnmednest.com` separate Management Panel. **No DNS/production mapping has been applied yet**, current Vercel projects/URLs retained. Owner tested isolated Chief login and sign-out. On Owner's explicit correction, Chief **is included** in both Total Management Members and Active Management Members; with the sole active Chief this is 1 / 1 / 0 pending invitations. Updated isolated professional Management Panel preview, tests and protected Preview READY at `https://sjn-mednest-management-lpdcv3zeg-sjn1.vercel.app/integrated-auth-preview.html`, code SHA `3da37a9631dbf3657285684aff2d5be502bf034b`, 2 CI workflows passed. Chief remains separate in identity card; no student/production changes or live invitations. See [Purchased Domain + Count Checkpoint](SJN-MEDNEST-PURCHASED-DOMAIN-AND-TEAM-COUNT-CHECKPOINT-2026-11-07.md).

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

## 2026-11-17 — Owner clarification: preserve existing Student LMS; access locks must not create silos

**This entry supersedes any wording in older handover notes that could be read as a proposal to rebuild student authentication, create new LMS navigation, or introduce a separate identity/navigation system.**

The Owner's requirement is specifically about the **new Management Panel-controlled feature access restrictions**. The existing Student LMS already has its sign-in, navigation, dashboard, module routing and exam system. These are to be preserved, not replaced or redesigned as part of entitlement work.

- A student uses the existing sign-in and navigates through the existing Student LMS. The same existing authenticated identity/session continues across its modules under the already-established 24-hour session policy.
- If the Management Panel locks one complete feature, only that feature is restricted. The student's existing login, dashboard, navigation, other unlocked features and unrelated modules must continue to work normally.
- Unlocking a feature restores it through the existing LMS. Do not create a separate login, duplicate account, separate student app, feature-specific session, or new navigation architecture.
- A lock/unlock operation must not silo, corrupt or interrupt the existing exam system: Create Test, Practice Test, question-bank launch, active attempts, submission, Results, Test History, Review, Retake and saved records must remain intact.
- Direct links, refresh, multiple tabs, mobile navigation, session expiry, sign-out and account switching must continue to follow the current system's behaviour. This is a regression/compatibility requirement for access-control implementation, not a request to build those capabilities from scratch.
- The access system must enforce the approved whole-feature/whole-bank/whole-course-session policy server-side without per-subject, per-chapter, per-topic, per-category, per-paper or per-question commercial locks.
- **Correct feature name: My Analytics.** Do not invent or infer a feature called “Medalytics” from speech-to-text. When voice transcription produces a name, brand, feature or requirement that conflicts with existing project documentation or product structure, inspect the source-of-truth documents and ask the Owner one concise clarification before making changes. Do not silently normalize uncertain words into a new product/feature.
- The Owner speaks Urdu; speech-to-text may render it as Hindi or distort proper nouns. Respond in English for this project, preserve confirmed English product names/spellings, and confirm genuine ambiguity rather than guessing.

### Implementation acceptance tests

The access-control change is accepted only if:
1. Locking SJN Question Bank does not lock Past Paper Question Bank, My Courses, My Analytics or other unlocked modules.
2. Locking Past Paper Question Bank does not lock SJN Question Bank or unrelated modules.
3. Locking Full-Length Past Papers, Mindletics, My Analytics, Mistake Diary or Academy Resources affects only that complete feature.
4. Locking one My Courses session affects only that session/package; other sessions and general LMS features remain usable.
5. Existing sign-in/session, dashboard and navigation behaviour remain unchanged.
6. Existing exam start, active attempt, submit, Results, History, Review and Retake remain correct and student-isolated.
7. No new sign-in, identity, navigation silo or per-question/per-chapter network check is introduced.
8. Feature unlock/revoke changes take effect safely without corrupting an active attempt or historical records.

**Status:** Product clarification recorded; implementation and Student DB/RLS changes remain separately scoped and unapproved until the Owner approves the concrete plan.
