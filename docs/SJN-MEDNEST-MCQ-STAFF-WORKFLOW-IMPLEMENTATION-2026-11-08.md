# SJN MedNest Academy — Staff-friendly MCQ Workflow Implementation Checkpoint
Date: 2026-11-08 (Asia/Karachi)
Status: Development branch source implemented; CI checks pass on preceding commits; latest final preview and Chief browser UAT still require verification.
Authorization: Owner explicitly approved implementation after reviewing two Management Panel screen recordings and the refined MCQ/Excel/course/past-paper workflow.
Branch: `sjn-phase1a-foundation` in `sumairniz/SJN-MDCAT-LMS`. Never merge into `main` or publish live without release approval.

## Implemented in this scope
1. Isolated Management Supabase Edge Function `mednest-mcq-library` ACTIVE v3 (`tdqbjhrmfluiinntmjfh`): Chief-only `mcqs.list` now accepts exact IDs (#95 or 95), or partial, case-insensitive matches in bank, subject, chapter, topic, question statement and source; bank/subject filters and 25-row pagination retained. Course-only `SJN MedNest Course Tests` bank intentionally NOT whitelisted. Normal SJN Question Bank added to allow later academy-authored questions. Existing past-paper source required on correction drafts, SJN-authored source optional. Revision guards, live Chief authentication, separate management draft storage, no student writes or publishing retained. **Authenticated end-to-end search UAT is not yet verified.**
2. Management frontend: expanded search placeholder/help; correction editing keeps individual independently editable question/option/answer/explanation/mnemonic/source fields; live text-only student-style preview (no dangerous HTML rendering); field-change summary; numbered-statement, bullet and arrow insert controls; explained Find → Edit → Save Draft → Academic Review; UI communicates source/legacy syllabus caveats. `mcq-editor-assist.js` new module, with CSS.
3. New Question Bank draft editor: optional `option_e`, A–E answer key only when E text exists; original A–D remains valid. Separate optional mnemonic and explanation fields. Formatted multi-line question text preserved. Any five-choice draft shows a publication-blocked warning.
4. Bank-specific CSV/Excel template chooser for SJN Question Bank vs Past Papers Question Bank, with correct optional vs required source policy. New in-browser `mcq-xlsx-template.js` creates Excel `.xlsx` templates without remote CDN or new infrastructure. Existing bound-checked XLSX upload/validation and protected draft batch storage reused; no new-question publication.
5. `tests/management-mcq-usability-2026-11-08.test.js` adds regression for A–D/A–E, optional source, roundtrip templates, HTML IDs and ZIP/XLSX structure. The previous `management-content-studio.test.js` CSV test fixture was updated to include optional E position, after an initial CI failure; two later complete Foundation CI runs on commit `5ed8408c...` SUCCESS.

## Not implemented / blocked (do not claim finished)
- Student LMS is **strictly 4-option at present**: staging `public.mcq_revisions` constraints demand exactly four options and correct_index 0..3, `public.attempt_items` selected_index <=3. End-to-end Option E student rendering, answer submission, grading, review/retake, historical attempt compatibility, revisions and migrations must be engineered and tested together; NO student DB migration was run.
- Course Test and Full-Length Past Paper management/bulk upload: intentionally remain separate **planned, unfinished** modules. Standard ordinary Content Studio batches are not to be passed off as course/paper publication or enrollment.
- New-MCQ drafts saved to the Management Content Studio are separate from existing-MCQ correction drafts used by `Academic Reviews`; a unified cross-type My Drafts and review submission/publishing bridge remain unfinished.
- No syllabus approved in Management yet; user must upload/approve the independent official academy syllabus before canonical taxonomy release.
- **FF-008 student course-only MCQ public-read exposure remains a release blocker.** Never deploy restricted content or broadly revoke current RLS without route inventory and staged replacement.
- No production deployment, main merge, DNS change, student table update, staff invite activation, billing, or custom-domain mapping.
- Vercel protected preview and Chief browser QA must be verified separately; READY state alone is not acceptance.
- Explicitly deferred student resources PDF performance FF-023 and weighted allocation FF-001 untouched.

## Next engineering increments
A. Verify new Management preview at exact head commit, and Chief live search/Excel/preview. Capture browser errors before broader changes.
B. Design secured independent course/session and full-length paper metadata + linked MCQ batch staging/approval; course-level entitlements and launch safety before student publishing.
C. Extend student question/revision/attempt schema and exam UI for optional E with compatibility/backfill QA; do NOT alter old attempts.
D. Extend new-question draft submissions to independent Academic Reviews and build secure versioned publication bridge, separate from existing corrections.
E. Preserve founder decisions, security/CI/owner staging approval and update release documentation per gate.

## QA
- Static syntax and DOM ID checks passed in Chat 10 after source changes.
- CI failure on one legacy CSV fixture resolved; subsequent two workflows SUCCESS at `5ed8408c...`; final head should be rechecked.
- New template generator code checked by Node test; actual owner-browser Excel roundtrip pending.
