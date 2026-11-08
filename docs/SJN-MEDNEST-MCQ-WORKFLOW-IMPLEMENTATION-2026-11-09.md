# SJN MedNest Academy — MCQ Staff Workflow Implementation Checkpoint
Date: 2026-11-09 (Pakistan Standard Time)
Owner authorization: Explicit implementation and continuing documentation requested after the owner reviewed the screen recording and finalized multi-question manual drafts, course-test contextual Source, optional academic review and Chief activity oversight.

## Implementation inventory

### Development branch source (`sjn-phase1a-foundation`)
- `apps/management/integrated-auth-preview.html`, `content-studio.js`, `content-studio.css`: promote a **My Working Draft** hub with editable name, manual **Add Question**, **Save & Add Next**, **Start Another Draft**, **Save Draft**, saved draft list/open actions, validation summary, topic path and separate routes for academic review and permitted direct release preparation. Reuse Subject/Chapter/Topic/Source context from the previous manually entered question. Provisional syllabus warnings still require correction; new-wording status **Check Needed** does not mean academic review.
- `content-studio-storage.js`: authenticated isolated Management batch actions for submit review, Chief direct release preparation and withdraw. All actions are unpublished staging only. Draft status controls disable unsafe edits to submitted/approved batches; server revalidates before marking review/approval states.
- Academic Reviews now includes a separate **New MCQ Batches — My Review Status** section with a link back to the saved batch; existing published-MCQ correction review stays independently preserved. The new batch author cannot approve their own independent review. The actual independent new-batch reviewer UI is **not fully operational** until eligible Management Team accounts, cross-author review queue and secure staff permissions are enabled.
- `apps/management/mcq-library.js`: permitted MCQ search rows show **Subject → Chapter → Topic**. Generic search continues excluding course-only questions.
- `apps/management/auth-client-isolated.js` and Activity Center HTML: Chief actor-aware, date-filtered and action-category-filtered activity timeline. Clearly distinguishes individual chunk-save events from unique MCQs/published totals; latest 200 events per query only, not an exhaustive activity export. Non-Chief exposure still sanitized.

### Isolated Management Supabase (`tdqbjhrmfluiinntmjfh`) changes
- Migration `isolated_batch_workflow_and_audit_20261109`: existing protected batch status extended to `draft`, `pending_review`, `needs_changes`, `approved_for_release`; added review metadata; index; append-only audit trigger on created/status-changed batches; RLS unchanged. Existing draft rows preserved (at migration time tables had 0 rows).
- JWT-required `mednest-content-studio` Edge v3: now accepts optional `option_e` on protected draft rows; Chief-only batch review routing (independent submission / explicit direct preparation / withdrawal), server validation of all stored rows, exact state guards and no Student DB connection or publication. One draft can contain 1–3000 questions stored in 40-row chunks.
- JWT-required `mednest-isolated-team` Edge v5: Chief-only descriptive activity fields and actor display names, 1/7/30-day or all filter, maximum 200 events. Non-Chief audit viewers continue receiving minimal action and timestamp only. Private arbitrary audit payloads, email addresses, student data and MCQ text remain unexposed.
- `mednest-mcq-library` Edge v3 remains Chief-only for permitted bank browsing/edit drafts, with source and revision safeguards.

### Verification
- Static Node tests added: `tests/management-draft-workflow-2026-11-09.test.js`.
- GitHub two Foundation workflows **SUCCESS** for source SHA `4b48c437cf9935b8cbb4618c3180c21ecf3434c6` after fixing one test assertion mismatch. Subsequent documentation commits require final status recheck.
- Supabase read-only check confirmed active JWT-protected Edge v3/v5 and review metadata columns.
- No actual authenticated browser acceptance test or Staff user UAT has been performed yet; do not represent feature as fully end-to-end accepted.

## Approved but not yet delivered
1. **Team-wide non-Chief editor/reviewer access:** isolated staff onboarding/permissions are still locked; until that rollout, Chief can stage drafts and prepare release, but independent staff reviewer action is not operational.
2. **Live student publication:** not implemented. `approved_for_release` means exactly that, not `published`. Direct route does NOT bypass technical validation nor create Student LMS questions.
3. **Course Test source semantics:** agreed that a Course Test's student-facing Source displays the Test Name automatically through Course → Session → Test association. Actual Course Test manager, metadata linkage and Student renderer still pending. Do not manually store test names as original MCQ source.
4. **Full-Length Past Paper manager:** separate original examination attributes and original-order full-paper batch ingestion not implemented.
5. **Rich scientific formatting:** Excel plain-text Unicode and line breaks supported; Excel rich styling, equation objects/images and shared Management/Student math-chem renderer not implemented.
6. **Student Option E end-to-end:** Student DB revisions and attempt items still enforce four options; publishing 5-option questions blocked.
7. **Chief audit completeness:** current Chief Activity Center shows latest 200 verified operations per selected period; broader action capture, exact unique batch counts, changes before/after, exports and pagination need a follow-up.
8. **FF-008** course-only MCQ public read exposure is still a hard student launch blocker. Do not do blanket revocation or release course content without entitlement design, migration and student regression.

## Governance
Owner-approved requirements live in [Owner MCQ Workflow Decisions](SJN-MEDNEST-MCQ-WORKFLOW-OWNER-DECISIONS-2026-11-09.md). Keep the Master Development Plan, Handover Guide and Deferred Register updated in each future phase, distinguishing discussed/approved/implemented/verified/deferred. Leave production branch `main`, Student LMS database and Student preview quota setting untouched. Preview deployments must be protected and not promoted.
