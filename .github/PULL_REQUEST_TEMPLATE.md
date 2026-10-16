## SJN LMS change summary
Describe the owner-approved scope, exact code areas affected and why the change is permanent.

## Temporary-code declaration (required, even if none)
- **New or changed temporary IDs:** list `TEMP-...` entries, or write `none` after full diff review.
- **Files/config, rationale and owner approval:** point to exact register sections and commit.
- **Pre-merge disposition:** identify removal, safe permanent replacement and verification plan, including blockers. Do not assume staging-only workarounds can ship.
- **Register:** [SJN Temporary Changes & Pre-Merge Cleanup Register](../docs/SJN-TEMPORARY-CHANGE-REGISTER.md).

## Required review before main/production
- [ ] Temporary-change register reconciled with the full diff; all temporary runtime items resolved and verified or individually reviewed under an explicit owner release-scope decision. No diagnostic code is included.
- [ ] All changed files and the complete diff against \`main\` reviewed; no temporary measurements, experiments, dead code or debug endpoints.
- [ ] \`npm test\`, \`npm run check:release\`, syntax and GitHub CI checks passed.
- [ ] Staging browser checks completed for relevant login, logout, MCQ, history and multi-tab behavior.
- [ ] Student records, RLS, fixed 24-hour session and the original 74 Biology MCQs preserved.
- [ ] Production/staging settings and Auth policy reviewed separately; no test-only configuration will be copied automatically.
- [ ] Master Development Plan updated with accepted scope, open risks and rollback plan.
- [ ] This PR remains DRAFT until a separate owner-approved release review.

**Separate explicit owner permission is needed for any merge into \`main\` and production deployment.** Completing this checklist alone is not authorization.

Reference: [Release Safety Checklist](../docs/RELEASE-SAFETY-CHECKLIST.md).
