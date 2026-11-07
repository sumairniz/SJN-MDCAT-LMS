# SJN MedNest Academy — Purchased Domain and Management Count Decision
**Date:** 2026-11-07; **branch:** `sjn-phase1a-foundation`

## Confirmed by owner
- Custom academy domain was purchased approximately five minutes before owner message: **sjnmednest.com**. Owner says purchase completed. The Vercel account's registered-domain list currently shows zero entries, so purchase at external registrar and DNS are **not yet verified or connected inside Vercel**.
- Architecture is exactly **two website surfaces**: main **sjnmednest.com** combines public academy and all Student LMS, separate **admin.sjnmednest.com** is the management panel. Never invent a distinct student LMS subdomain.
- Owner tested isolated Chief Administrator login and signout successfully on protected professional Management Panel preview. Owner explicitly changed prior team-count decision: **total management members includes Chief Administrator**, and **active members also include active Chief**. Chief remains presented separately in the protected identity card. At this stage 1 total, 1 active, 0 pending invitations.

## Implemented
- Updated `apps/management/integrated-auth-preview.html` cards to **Total Management Members**, explanatory note *Includes the Chief Administrator and all team members*, **Active Management Members**, explanatory note *Includes the active Chief Administrator*. Pending invitations unchanged.
- Updated `apps/management/auth-client-isolated.js` to set `team-total` from **all staff** and `team-active` from **all active staff** while the Team directory itself still lists only ordinary members and Chief remains in separate card.
- Added regression test to `tests/management-integrated-isolated-auth.test.js`.
- **2 GitHub CI workflows successful** at code commit `3da37a9631dbf3657285684aff2d5be502bf034b`.
- Protected Vercel **preview** deployment `dpl_4BPdjiaZ2KiEPNdhUZjsyuBn4uz1` READY: `https://sjn-mednest-management-lpdcv3zeg-sjn1.vercel.app/integrated-auth-preview.html`. No production, DNS, student database, management secrets, or older Management Panel route touched.

## Domain connection — next approved implementation gate
- Existing Vercel projects confirmed: `sjn-mdcat-lms` (main academy + integrated Student LMS) and `sjn-mednest-management` (Management Panel). Both currently have Vercel-provided URLs. Do not create a third project/site to split public pages and LMS.
- Domain has **not yet** been attached to either Vercel project, and no DNS changes were made. Before association, verify registrar/owner control, current domain DNS and Vercel plan/commercial deployment implications. Owner remains final approver of project-domain assignment and DNS cutover. Maintain Vercel previews until release gates pass.
- Target future mappings: `sjnmednest.com` -> main Academy project; `admin.sjnmednest.com` -> management project, with separate authentication, protected staff endpoints and precise CORS / Auth redirects. Management panel custom domain must not expose development-only services or bypass protection.
- Dedicated email sending may use a suitable verified subdomain of `sjnmednest.com`; configure SPF/DKIM as dictated by sender and test before enabling sensitive-action verification. No email secrets in GitHub, screenshots or chat.
- Management staff invitation and sensitive writes remain disabled. No standalone student app subdomain, no extra paid infrastructure, no student Auth or examination changes.

## References
`docs/SJN-MEDNEST-PRODUCT-AND-DOMAIN-ARCHITECTURE-DECISION-2026-11-07.md`;
`docs/SJN-MEDNEST-ISOLATED-MANAGEMENT-SHELL-INTEGRATION-2026-11-07.md`;
Master Development Plan and Developer Handover.
