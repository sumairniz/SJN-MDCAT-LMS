# SJN MedNest Management Panel — Step 2 Visual Preview

This **inert static interface** lives entirely under `apps/management/` and is intentionally isolated from the existing student LMS (repository root's `server.js` and `public/`).

**What works:** a responsive Management Sign In presentation, a clearly labeled layout preview, module navigation and mobile sidebar. The Sign In controls are disabled and do not transmit/record credentials. All cards use dashes/placeholders rather than fabricated counts. No student data or authenticated APIs.

**What does NOT work:** login, staff membership, invitations, permissions, Audit Logs, content management, premium feature toggles, student records and actual app routes. These require the separately approved and tested Phase 1A secure foundation.

**Security:** restrictive static CSP forbids forms and network connections, frame embedding is denied, and no confidential environment variables or Supabase keys are used. When implementing legitimate authentication, revise the CSP only as narrowly necessary after security review. Protect the Vercel preview deployment with Vercel Authentication where available.

**Deployment:** separate Vercel project with Root Directory `apps/management`, static framework, Git source `sjn-phase1a-foundation`. No custom domain, no production deployment. Future custom domain `manage.<academy-domain>`.

**Important:** this preview is not a functional admin portal. Do not use its pages to authenticate staff or grant access. The student app remains unaffected. Refer to `docs/SJN-MEDNEST-MANAGEMENT-PANEL-FOUNDATION-BLUEPRINT-2026-11-06.md` and Phase 1 Foundation Design.

**Branding checkpoint:** The temporary CSS-based `SJN` mark matches the current landing-page logo in `public/landing.html`. It is not a finalized logo asset; when the academy chooses an official logo, use one canonical shared brand asset across the student website and management panel. The future staff custom domain will be `admin.<academy-domain>`. Technical role/permission and optional display name/nickname/organizational title remain separate; audit identity must be immutable.
