> **2026-11-06 — APPROVED CHIEF ADMIN AND DUAL APPEARANCE FOLLOW-UP:** Owner explicitly approved **Chief Admin** as the highest protected technical role (same exclusive powers as the prior Owner/Super Admin design), **Academy Management Workspace** as the shared staff-neutral heading, and a responsive, synchronized **Auto (OS default) / Dark / Light** Management Panel appearance available from both Sign In and workspace, with locally remembered preference. The owner also requires each management staff member's own detailed profile to show verified identity, optional name/nickname/title, actual technical role and the exact granted permissions; titles must never confer access. Implemented **visual-only management preview**: new `theme.js`, full light CSS palette, neutral copy, **Member Profile** explanatory mockup, tested static UI. Commit `dded64033737b6e03006cc116d1cff725b157d96`, GitHub CI `42195535240` **SUCCESS**, isolated Vercel Preview `https://sjn-mednest-management-2j99ywa0y-sjn1.vercel.app` deployment `dpl_Duq162aZ2ZceYCKhJpo4Aeu7AKgT` **READY**, Vercel-protected. **No live staff auth, permission enforcement, member records, audit backend, Supabase or student LMS changes**. Full cross-chat handover: [Chief Admin, Themes and Profile](SJN-MEDNEST-MANAGEMENT-PANEL-THEMES-CHIEF-ADMIN-PROFILE-HANDOVER-2026-11-06.md). Follow the exact official spelling **MedNest**; historical older filenames with `MADNEST` are not brand labels.

# SJN MedNest Management Panel — Branding, Interface and Team Profile Checkpoint

**Date:** 2026-11-06 (Pakistan time)  
**Owner correction:** **SJN MedNest** (mixed case) or **SJN MEDNEST** (uppercase), NEVER “Madnest,” “Madness” or “Exam Madness.” The Owner explicitly corrected previous speech-to-text transcription mistakes and instructed consistent spelling everywhere. This record supersedes previously mislabeled planning headers and product branding. The prior files containing `MADNEST` in their filenames are historical handover paths and remain valid cross-references, **not authorized product names**.

## Owner-directed decisions

1. **Official product name**: **SJN MedNest Management Panel**. Do not silently alter general student LMS visible branding now; academy-wide branding will be handled in a separately approved phase. Internal GitHub identifiers are stable and should not be renamed broadly just for display text.
2. **Common academy logo**: Replace the stand-in single-letter “S” logo used in Step 2 with the **same current landing page mark**. Source: `public/landing.html`, `.brand-mark`, displays a stylized `SJN` inside dark square with thin red border. On the management app, use self-contained CSS with the same underlying mark (not fetching from student site), so the two applications have consistent design and remain deployment-isolated. **This is temporary**: neither the landing-page nor management logo is the final Academy logo. When a definitive official asset is chosen, adopt one canonical approved brand asset for both applications while avoiding coupling the apps at runtime. Do not generate/distribute a new unofficial logo.
3. **Future staff domain:** when the Owner purchases an academy domain, use **`admin.<academy-domain>`**, not the earlier `manage.<academy-domain>`. Actual domain unknown; do not buy or assign anything today.
4. **Management member display identity**: every team member has a **verified underlying account/identity** for secure login, audit and permissions, plus independent editable **display name/short name/nickname/pseudonym** and optional **organizational title**. Titles may include CEO, Academic Director or any Owner-chosen free text. Neither a title nor nickname grants privileges. Exact technical permissions (role presets and per-action grants) remain Owner-controlled independently; all team members can have equal or different access. Owner can give self a title such as CEO and choose self display name.
5. **Team overview** in management app should show verified **Total Management Members** (define whether this includes Owner and invited/pending members distinctly), Active, Pending Invitations, and a per-member directory (name/title/role/permissions/status). Phase 2 visual preview must not fabricate counts. Invitation/permissions UI remains disabled until backend secure foundation.
6. **Screenshots reviewed**: Sign In left branded story + right form, and admin dashboard/side navigation. Owner asked developer to improve visual proportions, typography and layout while retaining professional theme. Initial refinements: reduce over-dominant large Sign In headline, improve supporting-copy contrast, icon consistency with line SVG instead of mixed symbolic glyphs, slightly better sidebar size and text, team section conceptual profile fields, and remove fake member initials in avatar.
7. **Performance isolation**: no student LMS app code/UI/DB/production change. Management project at `apps/management/`. Management preview is inert, no credentials accepted and no student data read. Existing Vercel Authentication protects preview. Don't allow admin workloads to slow student exams. Future feature access remains at whole-module/whole-bank/whole-course-session level, **not individual MCQ/chapter**.

## Actual implementation checkpoint

- Branch: `sjn-phase1a-foundation` in repo `sumairniz/SJN-MDCAT-LMS`.
- Source commit: **`b1145993fa482c4aec81034f1776e37c1234bcb7`** — management-only `apps/management/index.html`, `styles.css`, `app.js`, `README.md`, plus its isolation test. Replaced all live client-visible Madnest labels, reused landing-page `SJN` mark, refined interface and introduced **nonfunctional** Team Directory/optional profile concepts. Student LMS source `public/` and `server.js` are untouched.
- New protected Vercel project **renamed** (same project ID, no project recreation) to **`sjn-mednest-management`** (project ID `prj_Uhb73zzfpQjXxqa5bitk8jrp4uU2`). Historical Vercel domain/aliases may retain old spellings from original project creation; new deployment URLs use corrected slug. Do not claim legacy alias removal or automatic redirect without verifying.
- Exact new preview deployment ID: **`dpl_BbhsT3ZD4V7KqgvQnADVobh5dhGC`**, **READY**, target **preview**, from branch commit `b1145993fa482c4aec81034f1776e37c1234bcb7`.
- Preview URL: **https://sjn-mednest-management-k3x8cakor-sjn1.vercel.app**
- GitHub `Foundation checks` run **`42192312118`**: **success**.
- No actual management staff authentication, RBAC permissions, invitation service or audit/DB operations implemented in these updates.
- Owner UI review and device/browser acceptance pending.

## Future Phase 1A profile model (design; no implementation approval in this correction)

| Field | Source | Purpose | Alters technical privileges? |
| --- | --- | --- | --- |
| Account ID + verified email | Secure Auth provider | Real membership and audit | Never by display edit |
| Member status | Admin database | Invited / active / suspended | Enforced server-side |
| Technical permission set | Owner-governed protected data | Authorization for MCQ edits, student management, premium grants etc. | Yes, separately audited |
| Display name / nickname | Owner-edited optional public-facing profile | How the member appears in lists and header | **No** |
| Organizational title | Owner-edited optional free-text | “CEO”, “Academic Director” etc. | **No** |
| Audit actor ID | Immutable verified identity | Nonrepudiable staff operation history, even if nickname changes | Not editable |

No mandatory Deputy designation. Owner can give equal actual permissions to any number of Management Team Members.

## Continuity instructions

When resuming the SJN MedNest Management Panel in a new chat, prioritize this checkpoint over historical old spelling in the files named `SJN-MADNEST-*`. Read [Step 2 Historical Handover](SJN-MADNEST-MANAGEMENT-PANEL-STEP-2-IMPLEMENTATION-HANDOVER-2026-11-06.md), [Foundation Blueprint](SJN-MADNEST-MANAGEMENT-PANEL-FOUNDATION-BLUEPRINT-2026-11-06.md), [Step 1 Audit](SJN-MADNEST-MANAGEMENT-PANEL-STEP-1-SECURITY-ARCHITECTURE-AUDIT-2026-11-06.md), Master Development Plan, Deferred Register. **Correct spelling is always MedNest, staff future domain is admin., and display identity is NOT permission.**

**Next development** only after Owner's approval of the refreshed visual preview: secure Owner account bootstrap, real staff login and separated team permission/audit architecture; preserve current student LMS stability and data.
