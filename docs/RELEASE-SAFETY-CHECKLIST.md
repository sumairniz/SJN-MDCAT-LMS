# SJN MDCAT LMS Pro — Production Release Safety Checklist

**Status:** OWNER-APPROVED PERMANENT PROCESS (2026-10-14, Pakistan time)  
**Scope:** GitHub development, staging and future production release review.  
**This document does not authorize a merge, deployment, database update or paid service.**

## Basic principle

The development branch holds intended long-term improvements. Short-lived measurements
and experiments belong on clearly named, separate diagnostic branches.
Never merge a diagnostic branch into the development branch or main.
If a confirmed permanent fix is needed, implement it again as a reviewed,
limited change on the development branch, with tests.

**Never rely on chat memory to clean up diagnostics.** Keep the rule in this repository.

## Before a diagnostic experiment

- [ ] First inspect existing browser measurements, code and read-only logs. Use a diagnostic experiment only if those cannot identify the bottleneck.
- [ ] Obtain scoped owner approval for the specific experiment; confirm a dedicated branch/preview connects **only** to staging Supabase before any deployment.
- [ ] Use a branch such as \`diagnostic/auth-timing-YYYYMMDD\`, rooted in the approved development baseline. Do not change any production environment settings.
- [ ] Keep all diagnostic code on this branch. If instrumentation is added to runtime code, label it \`SJN_TEMP_DIAGNOSTIC\`. Never put credentials or student-identifying data into logs.
- [ ] Record findings, then retire the diagnostic branch. Do not cherry-pick its measurement code; independently implement only verified, approved permanent improvements.

## Before proposing any pull request to main

- [ ] Obtain the explicit owner-approved **scope for preparing a release candidate**. This is distinct from authorization to actually merge or deploy.
- [ ] Confirm the selected changes are permanent and needed. Review the **complete PR diff against main**, every touched file, and all diagnostic/experimental branch references.
- [ ] Confirm no temporary measurement code, debug endpoints, hardcoded credentials, ad hoc console logging, obsolete workarounds, or diagnostic assets were carried forward. Search manually as well as running \`npm run check:release\`.
- [ ] Run \`npm test\`, \`npm run check:release\`, backend syntax checks and the applicable GitHub CI checks. Investigate failures; never skip or silence checks.
- [ ] Confirm user-by-user student isolation, RLS, profile-role protection, secured cookies, fixed 24-hour expiry, synchronization across tabs, and login/logout/account-switch behavior (including asleep and background tabs).
- [ ] Confirm the complete **74 original hardcoded Biology MCQs** remain intact until a separately approved, lossless migration; verify quiz progress, attempt-saving errors, history, bookmarks and student records.
- [ ] Verify staging and production Supabase IDs, Vercel environment connections, email verification policy and secrets separately. **Staging-only Auth changes must not be copied to production by assumption.**
- [ ] Review initial-load UX on mobile and desktop, external resources, error states, performance and accessibility. A passing simulated test is not real browser coverage.
- [ ] Prepare a release rollback procedure and identify the last known-good production commit/deployment. Plan for preserving all student data; no destructive migrations without a separate backup/approval process.
- [ ] Update the [Master Development Plan](SJN-LMS-MASTER-DEVELOPMENT-PLAN.md) with evidence, known limitations, proposed release contents and unresolved risks.
- [ ] Keep the pull request **DRAFT** until final release review. Request **separate, explicit owner authorization to merge and to deploy to production**. Neither authorization is implied by past staging approvals.

## Automated guard and limits

- \`scripts/check-release-safety.js\` rejects known temporary source markers, diagnostic paths and accidentally tracked private \`.env\` files.
- The existing Foundation GitHub Actions workflow runs \`npm test\` and the guard on development pushes and pull requests targeting \`main\`. The guard also has self-tests.
- This check is deliberately **limited**: it cannot detect unlabeled diagnostic code, ensure a diff is safe, or prevent someone with repository privileges from overriding checks or merging.
- A truly enforced block on unapproved merges would also require suitably configured GitHub branch protection/rulesets, account permissions and required checks. **No repository settings or production controls were modified as part of this approval.**
- Do not claim that "CI passed" alone means production is safe. Preserve the human review, owner approval and rollback gates.

## Production boundary

**No automatic merge of draft PR #1. No change to production or \`main\` without separate explicit owner permission.** This also applies if a future assistant or developer continues the project without access to this conversation.
