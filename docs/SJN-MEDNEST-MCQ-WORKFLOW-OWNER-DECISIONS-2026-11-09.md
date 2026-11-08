# SJN MedNest Academy — Owner decisions and MCQ workflow implementation register

Date: 2026-11-09 (Asia/Karachi).
Authority: Owner decisions after three Management Panel screen recordings. **Do not conflate proposal, approved policy, implemented capability or verified student publication.**
Development branch: `sjn-phase1a-foundation`, draft PR; no release to `main` without explicit authorization.

## Approved functional decisions (owner approved implementation)
- Management Panel must be immediately understandable to nontechnical teachers. Group workflows by **Browse & Edit**, **Create / Import**, **My Drafts**, **Academic Reviews**, **Syllabus**, **Activity Center**, with technical detail in advanced help.
- Search across permitted question bank by ID, text fragment, subject, chapter, topic, source, bank; show **Subject → Chapter → Topic** on results. Exclude restricted Course Test content from generic public and management ordinary bank search.
- Independent fields for question statement; options A-D plus optional E; correct answer; explanation; **separate optional mnemonic**; academic source. Changes to Option C alone must not require retyping the entire MCQ.
- Support bullets, multiple statements, arrows, mathematical/chemical notation, Unicode, line breaks and student-like preview. Plain-text XLSX import does **not** preserve Excel rich cell formatting or equation objects; future canonical math/chemistry renderer and image attachments need safe schema/rendering integration in both Management and Student LMS.
- Source optional on original SJN Question Bank MCQs; original examination attribution must be traceable for Past Papers Question Bank; source never silently overwritten. Course Tests: **contextual student-facing Source = Test Name**, associated automatically via Course → Session → Test (not manually typed on each question), while keeping any original academic source in separate metadata. Course Tests and Full-Length Past Papers are separate content types and management modules, not generic Question Bank upload destinations.
- Excel CSV/XLSX is optional. A single manually authored MCQ **or 30, 50, 180, 500, 1000 MCQs** may reside in one named draft; manually add Question 1→Save & Add Next, repeat, and/or mix manual entry with Excel import, then save/reopen the protected batch. Capacity/large-batch integrity must be verified; currently 3000-row protected batch limit.
- Distinguish working draft, validation issues, submitted for review, changes requested, approved for release, **published**; never label a validation warning as academic approval.
- **Academic review is optional by policy**: authorized trusted content staff may use direct route when the Chief has granted that explicit permission. Independent review route remains available and forbids self-approval. **Technical validation is always required before student publication**, regardless of review route. No direct route may bypass access control, source integrity, or Student LMS publishing safety checks. Current staff onboarding and live student publishing remain disabled.
- Chief Administrator requires an accessible, filterable activity history: **who, what, when, target, result and meaningful details** for content/draft/edit/review/security actions, with server-authoritative audit logging and no ability for ordinary staff to forge/erase it. Avoid presenting repeated chunk writes as distinct uploaded MCQs.
- Keep existing Test History, attempts, Results, Retakes, analytics, Course Overview and student authorization intact.
- Master Academy Syllabus is independent of historical provisional labels. Guide staff through Create / Import → Validate → Approve, with ordinary mapping in the editor; advanced taxonomy renames separate.
- Document each future discuss → approve → implement → verify → defer checkpoint in MDP, handover and decision register. No assumption that user approval alone makes feature implemented.

## Current status at entry to this checkpoint
- Management Content Studio supports manual multiple rows, CSV/XLSX import, 3000-row protected draft saving. UI disconnected/overwhelming; new-question batches NOT connected to Academic Reviews.
- Existing correction review handles previously published MCQ corrections. Staff onboarding disabled, Chief-only new-content draft writes. No student-content publishing bridge.
- Student MCQ revision/attempt constraints are four-option. Management-only new draft can include Option E, but its server storage needs verification/compatibility remediation.
- FF-008 restricted Course Test MCQ anonymous SELECT issue remains a hard launch blocker. Preserve owner-approved temporary Student preview deployment suppression until explicit re-enable.

## Implementation boundaries for this approved phase
- Improve existing Management-only draft creation, navigation, batch workflow and activity oversight.
- Optionally stage **review-routing decisions**, clearly distinct from publication, with chief-only direct-release preparation if safely implemented and audited.
- Do not claim student-facing source-as-test-name is live without Course Test manager, linking and Student renderer changes.
- Do not call content published until a separate authorized, revision-safe student publication bridge is implemented and validated.
- Do not loosen Student RLS or relax staff authentication or self-approval safeguards to expedite launch.

## Acceptance checks
1. Author can add one MCQ and 50 more manually in same batch; retrieve saved batch without data loss.
2. Excel and manual import support optional E; batch reopens with preserved source, paragraphs, Unicode and correct key.
3. Chief can trace audit operations and distinguish per-event saves from actual unique published MCQ counts.
4. Review route never enables unauthorized self-approval; trusted-direct route does not secretly publish.
5. Topic is visible in MCQ listings; staff controls and help are understandable.
6. GitHub CI, protected preview, Chief browser UAT and Student regression gates are individually reported.

## Follow-up checkpoints
- Real Course → Session → Test source linkage and whole-test upload.
- Real Full-Length Paper metadata and 180-question original-order ingestion.
- Complete teacher invitation/authz rollout with scoped per-role permissions and direct-publish policy.
- Student E-option support across schema, submission, grading and historical retake.
- Complete authorized publication service and FF-008 entitlement enforcement.
