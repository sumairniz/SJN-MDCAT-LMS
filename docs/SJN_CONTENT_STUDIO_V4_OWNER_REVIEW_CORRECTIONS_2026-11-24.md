# Content Studio V4 — Owner Review Corrections (24 November 2026)

**Status:** WRITTEN SPECIFICATION REVIEWED WITH CORRECTIONS; FINAL VISUAL DESIGN NOT APPROVED; IMPLEMENTATION NOT AUTHORIZED BY THIS REVIEW.  
**Branch:** `sjn-secure-content-publishing`  
**Scope:** Management Panel / Question Content Studio only.

## 1. Review context

The owner reviewed the assistant's 24 November 2026 written design proposal in the conversation, not the GitHub source-reconciliation document. The owner explicitly approved the proposal as a **written specification subject to corrections**, but did **not** approve it as a final visual design. Do not describe the visual design as approved or complete.

The owner confirmed the following elements as good:
- Content/Workflow switch appears only inside the Question Content Studio header, beside Auto / Dark / Light.
- Content mode has the destination tree and four workspace tabs: Browse & Edit, Create, Bulk Upload and My Drafts. Destination remains visible.
- Academic Review has one home in Workflow mode, subject to the navigation decision in Section 2.
- Editor includes formatting toolbar, published vs edited copy, What changed?, student preview, shared-question dialog and fifth-option compatibility warning.
- Empty, error and no-permission states are represented; Release Centre includes a disabled-permission state.
- Technical unknowns are labelled verification pending rather than represented as existing capabilities.

## 2. Correction 1 — preserve the real Management Panel sidebar and make navigation change explicit

The previous written mockup used inaccurate sidebar labels and omitted existing modules. The real existing sidebar names supplied by the owner are:
- Team & Permissions
- Reports & Activity
- Student Management
- Feature & Enrollment Access
- My Profile

The corrected design must use the actual existing Management Panel navigation and must not invent replacement names such as "Staff & Permissions", "Reports & Analytics" or "Audit & Activity". Preserve every other existing sidebar item from the actual live panel; do not infer the complete sidebar from this list alone.

**Academic Reviews navigation change — PENDING OWNER DECISION.**

The previous proposal placed Academic Review only inside Workflow mode, which would remove the existing **Academic Reviews** entry from the global Management Panel sidebar. This is a real navigation change, not merely a visual rearrangement. It must be stated plainly in the next visual proposal and must not be implemented until the owner confirms whether:
1. the global Academic Reviews sidebar entry should be removed and the workspace accessed only through Question Content Studio → Workflow → Academic Review; or
2. the existing global sidebar entry should remain as a shortcut to the same single Academic Review workspace (not a duplicate review system).

Do not silently remove or relocate the existing navigation item. No choice has been made by this review.

## 3. Correction 2 — My Drafts destination scope switch

The previous proposal was inconsistent: My Drafts was presented inside a selected destination workspace, while its contents were described as drafts from all destinations.

The owner requires a clear scope switch in My Drafts:
- **This destination**
- **All my destinations**

Default selection: **This destination**.

Behavior:
- When My Drafts is opened from a selected destination, default to "This destination" and show only drafts owned by that destination.
- The user can deliberately switch to "All my destinations" to see their drafts across destinations.
- The selected scope must remain visibly clear.
- The scope switch is a view filter only; it must never move, reassign, duplicate or change a draft's actual destination.
- When My Drafts is opened without a selected destination (e.g. from Studio overview or another global Studio entry), the design must avoid falsely implying a destination context. The exact initial scope in this entry path should be shown explicitly in the next visual design for owner review; do not silently invent a default.
- Destination ownership and permissions remain enforced by the existing backend.

This correction supersedes the inconsistent wording in the earlier written proposal that described one all-destinations view without a scope switch.

## 4. Correction 3 — image and formula controls must not expose unsupported student-facing content

The owner identified a conflict between the planned authoring capability and the explicit boundary that the Student LMS is out of scope for current work.

The corrected specification must state:
- Image and formula support remains a desired end-to-end product requirement.
- Student-side rendering, storage/access, review/history display and any required Student LMS frontend/backend/schema work require a **separate later approval and separate implementation scope**.
- Until student-side rendering is implemented and verified under that separate approval, the Management Content Studio must not let teachers insert image/formula content that students cannot see.
- Therefore Image and Formula toolbar controls must be **hidden or disabled** in the current usable editor until the student-side capability is separately approved, implemented and verified. The next visual design must choose and clearly depict a safe unavailable state; it must not show active, usable controls.
- Do not make Student LMS changes as part of current Management-only work.
- Do not describe the planned end-to-end capability as already implemented.

The safe default in the visual proposal should be disabled controls with a short explanation that student rendering is not yet supported, unless a more suitable inaccessible/hidden state is justified and explicitly reviewed. No student-side implementation is authorized by this record.

## 5. Required changes to the next owner-facing design

The next complete visual design must:
1. Use the actual Management Panel shell/sidebar, including the owner's real labels and existing modules. Inspect the exact current screenshot/live interface before claiming pixel-level fidelity.
2. Show Academic Reviews navigation explicitly and explain the consequence of moving it into Studio Workflow. Keep the decision pending until the owner chooses.
3. Add the My Drafts scope switch "This destination | All my destinations", defaulting to This destination when opened from a destination.
4. Show the safe unavailable state for Image and Formula controls until student-side rendering is separately approved, implemented and verified.
5. Continue to show the previously accepted Content/Workflow header placement, destination tree, four tabs, editor/version comparison, shared-question safety, import/recovery, workflow and responsive states.
6. Preserve the distinction between a written specification and final visual design approval.
7. Present the complete corrected visual design for owner review before any implementation.

## 6. Approval and change boundaries

- **Written specification:** APPROVED SUBJECT TO THE CORRECTIONS ABOVE.
- **Final visual design:** NOT APPROVED; a corrected visual design must be presented and reviewed.
- **Academic Reviews sidebar relocation/removal:** PENDING OWNER DECISION.
- **My Drafts scope switch:** OWNER-REQUESTED CORRECTION; incorporate in next design.
- **Image/Formula controls:** OWNER-REQUESTED SAFETY CORRECTION; hidden or disabled until separate student-side approval, implementation and verification.
- **Management implementation:** NOT AUTHORIZED by this review; wait for final visual design approval and applicable implementation authorization.
- **Student LMS:** OUT OF SCOPE. No frontend, backend, database/schema, Edge Function, authentication, test-taking, results, review, analytics, history or other student-facing changes.
- **Production merge/release:** Not authorized.

## 7. Documentation and continuity

This addendum preserves the owner's actual review rather than silently overwriting earlier decisions. The previous reconciliation document remains as the prior proposal and source traceability record; this addendum records the subsequent corrections and their approval status. Future sessions must read both documents and the Master Product Architecture Decision Record before presenting or implementing further Studio design work.
