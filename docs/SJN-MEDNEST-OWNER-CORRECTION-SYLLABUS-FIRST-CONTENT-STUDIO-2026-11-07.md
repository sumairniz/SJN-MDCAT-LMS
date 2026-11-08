# SJN MedNest Academy — Owner correction: Syllabus-first Content Studio
**Date:** 2026-11-07 (Asia/Karachi); **branch:** `sjn-phase1a-foundation`.
**Status:** Owner's clarified requirements and proposed next implementation sequence. **No implementation or student/management database mutation authorized by this document alone.**

## Critical correction to most recent content-studio implementation
The taxonomy currently found in student LMS `public.mcqs` (`aozknkrwafowsrehdwlr`) is **provisional and often assistant-assigned**, originally attached to past-paper uploads for practical launch/testing. It was **not vetted as the Academy's final syllabus** and **must not be treated as the canonical master taxonomy** or the sole source for the official MCQ importer. A 2026-11-07 Content Studio snapshot copied 392 normalized nonblank labels from MCQ data and made them the reference for imported exact matches. This can be useful only as **legacy data for migration suggestions**, NOT the lasting source of truth.

The owner expects to **author and upload the full Academy syllabus independently of MCQ records first**. Existing chapter/topic labels may be extensively renamed, replaced, reorganized, deleted from the visible syllabus or mapped to the new curriculum. Nothing should force the owner to retain assistant-created classifications.

## Product behavior — Syllabus & Taxonomy Manager (first priority)
- Management Panel contains a full **Syllabus & Taxonomy Manager**, where authorized staff can upload a structured full syllabus (Excel/CSV), paste a subject/chapter/topic outline, or add and edit chapters/topics manually, without needing to upload any MCQs.
- Owner may list 100+ topics, rename many at once, add missing chapters/topics, change ordering, move topics between chapters or replace provisional chapter names. Provide a proper preview/validation, collision handling, and explicit confirmation for bulk migration. Case-only differences and extra whitespace must not force duplicates.
- This editable, separately stored, **owner-approved syllabus** becomes the reference for *future* MCQ uploads and individual MCQ editing. Stable internal IDs and normalized name/alias rules keep code independent of mutable visible display names; use revisions/audits where historical references exist. New/unmatched taxonomy labels can be created by authorized persons through the Syllabus Manager, not just rejected because no MCQ currently uses them.
- **Legacy LMS MCQ-assigned names become import/mapping suggestions only.** Provide an owner-reviewed mapping tool to link old chapter/topic strings to new IDs, including preview counts and safe handling for MCQs with blank or ambiguous classifications. Do not silently remap or modify current published questions or student historical attempts.
- "Delete" should be defined in the user-friendly interface as safe archive / remove from active syllabus or approved bulk replacement; if an existing label is referenced by published MCQs/attempts/analytics, require safe reassignment or archive, not destructive orphaning.

## Multiple contexts
- Authoritative syllabus is the default for ordinary practice question banks and Create Practice Test / Topic Drill.
- **Full-length past papers** may have original-source chapter/topic annotations or per-paper classifications that differ from the Academy syllabus; preserve provenance and offer optional manual mapping/overrides. Past Papers Question Bank vs Full-Length Past Papers remain separate concepts.
- **Courses / Sessions / restricted course assessments** may refer to the same syllabus where suitable, but may also have their own private curriculum mapping or course-local categories. Avoid turning course-only content into publicly browseable practice questions.
- Do not impose a universal chapter/topic assignment that misclassifies a question merely for consistency; stable question IDs and versioned source data remain intact.

## Individual MCQ editing (equal high priority)
- Admin-facing **Question Content Studio** includes a **Search/Browse/Edit MCQs** view, not just a CSV/XLSX importer. Find by question ID, full-text, bank/source, subject/chapter/topic, paper/course context, etc.; open a question and directly edit question text, A–D options, correct index, explanation, mnemonic, source metadata and syllabus tags using clear forms and selectors.
- **No spreadsheet, CSV or code required to edit one MCQ.** A member with correct permission can save a draft / submit for review / publish as allowed by configured academic review policy.
- Preserve **original past-paper source wording and keys**, current published revision and historical student test/attempt revision references. Corrections and publishing need secure server-side authorization, audit and revision semantics. For questions attached to original paper tests, changes must not unintentionally alter source paper history, scoring or retakes.
- Ordinary Question Bank vs full-length past papers and separate course-only questions must be clearly identified. The future SJN Question Bank is not yet a published bank.

## Reordered implementation plan — supersedes earlier next-step priority
1. **Syllabus Manager foundational design and implementation**: separate canonical syllabus registry; editor + manual/bulk upload/paste; import preview; stable IDs, aliases, archive/replace workflow, read-only legacy mapping preview. No student DB migrations until separately audited and approved.
2. **Direct MCQ browser/editor** integrated into professional Management Panel; can edit one question without XLSX; secure role-bound draft/revision/publish policy.
3. **Rewire CSV/XLSX bulk MCQ import to the owner-approved syllabus registry** rather than the static `content-studio-taxonomy-snapshot.json` extracted from old MCQ rows. Unmatched labels propose new taxonomy items or mappings for review. Per-row tags and batch defaults; stage validation and duplicate checks.
4. Academic review/approval, secure publication bridge, protected student revision history, tests and authorized release.
5. Courses, Full-Length Past Papers context mappings, remaining Admin functions, deferred LMS changes and final release QA.

## Legacy development status
- Old `apps/management/content-studio-taxonomy.js` and `content-studio-taxonomy-snapshot.json` plus XLSX UI are GitHub-only **provisional source**, **not yet owner-accepted**. Their current source-of-truth assumption is superseded. Do not deploy the old importer as a finished product without replacing that assumption.
- Draft save/load backend and Chief management-auth isolation from prior batch are reusable. They do not publish into LMS, alter MCQs or implement canonical syllabus.
- Vercel preview remains older deployed state. No new Vercel deployment or domain/production change requested here.
- Earlier documentation already specified source taxonomy management and in-panel individual edit. This correction makes the owner's separate syllabus upload and mutable taxonomy requirement unambiguous for the next implementation phase.

**No new files/tables/row writes beyond this documentation checkpoint; get implementation authorization before making structural migrations or source changes.**
