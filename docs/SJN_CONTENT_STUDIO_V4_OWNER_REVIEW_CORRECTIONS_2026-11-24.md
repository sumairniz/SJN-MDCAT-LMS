# Content Studio V4 — Owner Review Corrections (24 November 2026)

**Status:** WRITTEN SPECIFICATION REVIEWED WITH CORRECTIONS; FINAL VISUAL DESIGN NOT APPROVED; IMPLEMENTATION NOT AUTHORIZED BY THIS REVIEW.  
**Branch:** `sjn-secure-content-publishing`  
**Scope:** Management Panel / Question Content Studio only.

## 1. Review context

The owner clarified that the three review points reproduced in the 24 November 2026 message were written by **Claude AI**, not authored or independently decided by the owner. The owner asked ChatGPT to assess whether Claude's comments were correct. Therefore, the points below are recorded as **Claude AI recommendations and ChatGPT's assessment**, not as owner instructions or owner-approved decisions. The owner has not approved the proposal as a final visual design. Do not describe the visual design as approved or complete.

The owner confirmed the following elements as good:
- Content/Workflow switch appears only inside the Question Content Studio header, beside Auto / Dark / Light.
- Content mode has the destination tree and four workspace tabs: Browse & Edit, Create, Bulk Upload and My Drafts. Destination remains visible.
- Academic Review has one home in Workflow mode, subject to the navigation decision in Section 2.
- Editor includes formatting toolbar, published vs edited copy, What changed?, student preview, shared-question dialog and fifth-option compatibility warning.
- Empty, error and no-permission states are represented; Release Centre includes a disabled-permission state.
- Technical unknowns are labelled verification pending rather than represented as existing capabilities.

## 2. Claude AI recommendation 1 — preserve the real Management Panel sidebar and make navigation change explicit

The previous written mockup used inaccurate sidebar labels and omitted existing modules. The real existing sidebar names supplied by the owner are:
- Team & Permissions
- Reports & Activity
- Student Management
- Feature & Enrollment Access
- My Profile

Claude's observation is valid: the written mockup used inaccurate sidebar labels and omitted existing modules. The corrected design should use the actual existing Management Panel navigation and must not invent replacement names such as "Staff & Permissions", "Reports & Analytics" or "Audit & Activity". Preserve every other existing sidebar item from the actual live panel; do not infer the complete sidebar from this list alone.

**Academic Reviews navigation change — PENDING OWNER DECISION.**

The previous proposal placed Academic Review only inside Workflow mode, which would remove the existing **Academic Reviews** entry from the global Management Panel sidebar. This is a real navigation change, not merely a visual rearrangement. It must be stated plainly in the next visual proposal and must not be implemented until the owner confirms whether:
1. the global Academic Reviews sidebar entry should be removed and the workspace accessed only through Question Content Studio → Workflow → Academic Review; or
2. the existing global sidebar entry should remain as a shortcut to the same single Academic Review workspace (not a duplicate review system).

Do not silently remove or relocate the existing navigation item. No choice has been made by this review.

## 3. Claude AI recommendation 2 — My Drafts destination scope switch

The previous proposal was inconsistent: My Drafts was presented inside a selected destination workspace, while its contents were described as drafts from all destinations.

Claude recommends a clear scope switch in My Drafts. This is a sound UX recommendation and is consistent with the earlier project direction to keep My Drafts distinct from Browse & Edit, but the exact two-scope labels/default behavior were not verified as a previously owner-finalized decision in the retrieved conversation records:
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

## 4. Claude AI recommendation 3 — image and formula controls must not expose unsupported student-facing content

Claude identified a genuine safety concern: planned authoring controls could allow staff to create image/formula questions that the current Student LMS cannot render. The existing project boundary keeps Student LMS changes out of current work.

The corrected specification must state:
- Image and formula support remains a desired end-to-end product requirement.
- Student-side rendering, storage/access, review/history display and any required Student LMS frontend/backend/schema work require a **separate later approval and separate implementation scope**.
- Until student-side rendering is implemented and verified under that separate approval, the Management Content Studio must not let teachers insert image/formula content that students cannot see.
- Therefore Image and Formula toolbar controls must be **hidden or disabled** in the current usable editor until the student-side capability is separately approved, implemented and verified. The next visual design must choose and clearly depict a safe unavailable state; it must not show active, usable controls.
- Do not make Student LMS changes as part of current Management-only work.
- Do not describe the planned end-to-end capability as already implemented.

The safe default in the visual proposal should be disabled controls with a short explanation that student rendering is not yet supported, unless a more suitable inaccessible/hidden state is justified and explicitly reviewed. No student-side implementation is authorized by this record.

## 5. Recommended changes to the next owner-facing design

The next complete visual design must:
1. Use the actual Management Panel shell/sidebar, including the owner's real labels and existing modules. Inspect the exact current screenshot/live interface before claiming pixel-level fidelity.
2. Show Academic Reviews navigation explicitly and explain the consequence of moving it into Studio Workflow. Keep the decision pending until the owner chooses.
3. Add the My Drafts scope switch "This destination | All my destinations", defaulting to This destination when opened from a destination.
4. Show the safe unavailable state for Image and Formula controls until student-side rendering is separately approved, implemented and verified.
5. Continue to show the previously accepted Content/Workflow header placement, destination tree, four tabs, editor/version comparison, shared-question safety, import/recovery, workflow and responsive states.
6. Preserve the distinction between a written specification and final visual design approval.
7. Present the complete corrected visual design for owner review before any implementation.

## 6. Attribution, assessment and approval boundaries

- **Claude AI review points:** REVIEWED BY CHATGPT; generally sound recommendations, not owner instructions.
- **Written specification:** The owner previously said it was acceptable as a written specification subject to corrections; this does not approve the visual design.
- **Final visual design:** NOT APPROVED; a corrected visual design must be presented and reviewed.
- **Academic Reviews sidebar relocation/removal:** PENDING OWNER DECISION. Claude correctly flagged that moving it would alter existing navigation; no owner decision has been made.
- **My Drafts scope switch:** CLAUDE AI RECOMMENDATION; ChatGPT assesses it as a sound UX improvement. Exact labels/default should be shown in the next design for owner review.
- **Image/Formula controls:** CLAUDE AI SAFETY RECOMMENDATION; ChatGPT assesses the concern as valid. Keep controls hidden/disabled until student-side rendering is separately approved, implemented and verified; this is a proposed safe design, not an owner-issued instruction.
- **Management implementation:** NOT AUTHORIZED by this review; wait for final visual design approval and applicable implementation authorization.
- **Student LMS:** OUT OF SCOPE. No frontend, backend, database/schema, Edge Function, authentication, test-taking, results, review, analytics, history or other student-facing changes.
- **Production merge/release:** Not authorized.

## 7. Documentation and continuity

This addendum preserves the owner's actual review rather than silently overwriting earlier decisions. The previous reconciliation document remains as the prior proposal and source traceability record; this addendum records the subsequent corrections and their approval status. Future sessions must read both documents and the Master Product Architecture Decision Record before presenting or implementing further Studio design work.


## 8. 24 November attribution clarification from owner

The owner explicitly clarified after the initial recording that the three numbered comments came from Claude AI and were pasted for independent evaluation. They were not the owner's own instructions. ChatGPT's assessment:
- Sidebar mismatch and the need to disclose the Academic Reviews navigation consequence: valid observation. Whether to retain the global sidebar entry or make it Workflow-only remains undecided.
- My Drafts scope switch: sound and useful UX recommendation. It resolves the mismatch between a destination-context tab and an all-destinations list. Earlier records establish My Drafts as a dedicated draft workspace distinct from Browse & Edit, but the exact two labels/default were not verified as a previously owner-finalized requirement.
- Image/formula controls: valid safety concern. Do not let teachers create content that the current student experience cannot display. The safest interim visual state is hidden/disabled controls until student-side rendering is separately approved, implemented and verified. This recommendation does not authorize Student LMS work.

**Attribution correction:** Any wording in this record that previously described these three items as "owner-requested corrections" is superseded by this section. They are Claude AI recommendations assessed by ChatGPT. Only an explicit subsequent owner decision can promote any of them to FINALIZED / OWNER-DECIDED.


## 9. Owner approval of Claude AI recommendations — 24 November 2026

The owner subsequently clarified: where ChatGPT independently agrees that a Claude AI point is correct or a strong recommendation, the owner approves proceeding with that recommendation ("if you also agree, approve it and do it"). This approval promotes the following recommendations into the accepted design specification. It does **not** mean Claude authored the decisions; their origin remains attributed to Claude, and the owner's approval is recorded separately.

### 9.1 Sidebar accuracy and Academic Reviews navigation disclosure — APPROVED REQUIREMENT; ROUTING CHOICE STILL PENDING

Approved:
- Use the actual Management Panel navigation labels and preserve existing modules; do not use invented sidebar labels.
- Explicitly disclose that making Academic Review accessible only inside Studio → Workflow would remove/change the existing global **Academic Reviews** navigation entry.
- Do not silently remove or relocate it.

Still not decided:
- Whether the existing global Academic Reviews entry is removed in favor of Workflow-only navigation, or retained as a shortcut to the same single workspace.
- Until the owner chooses, the next design must show both alternatives or preserve the current global entry as the non-destructive baseline and clearly mark the alternative. No implementation or navigation removal is authorized.

### 9.2 My Drafts scope switch — APPROVED

Incorporate the two-scope switch:
- **This destination**
- **All my destinations**

When opened from a selected destination, default to **This destination**. Switching scopes filters the view only and must never change a draft's actual destination, ownership, identity or permissions. When opened without a selected destination, show the entry behavior clearly in the next visual design rather than implying a destination context.

### 9.3 Image and Formula controls — APPROVED SAFETY REQUIREMENT

Until student-side rendering is separately approved, implemented and verified:
- Hide or disable Image and Formula authoring controls in the Management Content Studio.
- Do not permit teachers to create student-facing content that the current Student LMS cannot render.
- If disabled controls are shown, include a concise explanation that student-side rendering is not yet supported.
- Image/formula end-to-end support remains a future product requirement requiring a separate Student LMS scope and explicit approval.
- This approval does not authorize any Student LMS code, database, Edge Function, authentication or deployment changes.

### 9.4 Approval boundary remains

- These recommendations are now **OWNER-APPROVED DESIGN REQUIREMENTS**.
- The complete corrected visual design is still **PENDING OWNER REVIEW**.
- Application implementation remains **NOT AUTHORIZED until the owner reviews and approves the complete visual design and the relevant implementation scope**.
- No application code, schema, backend, Vercel or production changes are authorized by this documentation approval.
