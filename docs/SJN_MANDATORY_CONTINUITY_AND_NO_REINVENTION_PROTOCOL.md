# SJN MedNest Academy — Mandatory Continuity & No-Reinvention Protocol

**Status:** ACTIVE OPERATING RULE  
**Applies to:** Every ChatGPT conversation, AI developer, human developer, and contributor working on SJN MedNest Academy.  
**Scope:** All Management Panel, Student LMS, backend, database, infrastructure, UI/UX, product, security, documentation, and deployment work.

## 1. Why this protocol exists

This protocol records a known failure mode: an assistant may have only a memory summary or partial conversational context in a new chat. If it relies on that summary, it may omit requirements that were discussed and documented in earlier conversations. It may then invent a simplified design, reopen settled decisions, or ask the owner to repeat work.

This is precisely what the project's detailed GitHub documentation was created to prevent. The repository—not model memory, a short summary, or the assistant's recollection—is the durable project memory.

A previous incident demonstrated the risk: an incomplete Content Studio V4 visual proposal omitted previously documented navigation, editor, version-comparison, preview, import, and workflow requirements. Had the owner approved it without an independent comparison, the incomplete design could have become implementation scope. This must not happen again.

## 2. Mandatory pre-work gate — no exceptions

Before proposing, designing, estimating, coding, configuring, testing, deploying, or asking the owner to approve any material project work, the assistant/developer MUST:

1. Read the current Master Product, Architecture & Decision Record on the active working branch.
2. Read the latest Active Conversation & Decision Log and all linked/current handover or feature-specific records relevant to the task.
3. Search the repository documentation for the exact feature, terminology, previous design, alternatives, constraints, and deferred items.
4. Retrieve original source conversations, transcripts, screenshots, or mockups when referenced by the records or needed to establish what was actually discussed. A short summary is not a substitute.
5. Inspect the current implementation and technical contracts relevant to the requested scope. Documentation describes intent; code and live provider state establish current implementation.
6. Check branch, commit, environment, project identity, approvals, and scope boundaries before any change.
7. Build a requirement traceability checklist before preparing a design or implementation plan.

If a required source cannot be accessed, say exactly which source/path was checked and what remains unavailable. Do not guess, silently reconstruct, or ask the owner to repeat information until repository and linked source recovery has been attempted.

## 3. Record every material discussion, not only final decisions

Every meaningful project discussion must be recorded, even when it does not result in a decision. This includes:

- DISCUSSED: topic, concern, question, idea, context, and owner intent.
- PROPOSED: each proposed approach, who proposed it, rationale, benefits, risks, and whether accepted.
- CONSIDERING: options actively being evaluated, with trade-offs and unresolved questions.
- DECIDED: an explicit choice or direction, preserving the owner's wording and reasoning.
- FINALIZED / OWNER-DECIDED: settled product requirement or design.
- IMPLEMENTATION APPROVED: separately authorized scope, exclusions, branch/environment and approval context.
- IMPLEMENTED: exact files, functions, components, database objects, configuration, commit and environment.
- VERIFIED: actual test method, evidence, result, limitations and verifier.
- PENDING TECHNICAL VERIFICATION: requirement is retained but technical feasibility/route needs investigation.
- PENDING OWNER DECISION: only a genuine unresolved product choice.
- DEFERRED: deliberately postponed, why, and what condition reopens it.
- REJECTED / REVERSED: what was rejected/undone and why.
- SUPERSEDED: later decision replaces earlier one; preserve both histories and link them.

Use the canonical status vocabulary in the Master Decision Record. Do not collapse statuses or convert an assistant proposal into an owner decision. A discussion remains recorded even if no decision follows.

## 4. Required detail — documentation is not a summary

For each material item, capture as much of the following as applies:

- Date and source conversation/chat reference.
- Feature/module and affected user roles.
- Exact owner request and context; preserve meaningful wording.
- Problem being solved and why it matters.
- Detailed expected behaviour and screen/navigation flow.
- Fields, controls, states, validations, permissions and error cases.
- Data ownership, relationships, provenance, versioning and audit implications.
- Architecture constraints and existing features that must remain unchanged.
- Alternatives discussed, with benefits, drawbacks and reasons accepted/rejected/deferred.
- Dependencies and cross-module effects.
- Security, privacy, performance, accessibility and responsive requirements.
- Explicit exclusions and non-goals.
- Status and the person who made/approved the decision.
- Implementation authorization, if any, kept separate.
- Technical verification still required.
- Tests, evidence, commits and deployment details after implementation.
- Open questions and precise next action.

Do not replace detailed records with a one-line summary. A concise index may link to detailed records, but must not replace them.

## 5. Design-specific protection

Before showing any design for owner approval:

1. Recover the complete previously discussed/finalized design and all relevant mockups.
2. List every documented requirement in a design traceability matrix.
3. Compare the proposed screens and interactions against every requirement.
4. Explicitly identify requirements not visible in the mockups, including behaviour that needs a separate state/screen.
5. Identify contradictions and technical dependencies without silently changing the product decision.
6. Mark each item as represented, not represented, technically pending, or requiring a genuine owner decision.
7. Do not ask for approval while known requirements remain unrepresented or unaccounted for.
8. Never use unrelated stock dashboard images as if they were SJN-specific approved mockups. Clearly label conceptual references versus actual SJN designs.

The owner should receive a concise review of important changes and unresolved points, with detailed evidence available in GitHub. Do not make the owner reread a huge chat or act as the technical auditor.

## 6. No-reinvention / no-silent-omission rule

A previously FINALIZED / OWNER-DECIDED requirement remains active until the owner changes it or a documented technical discovery requires a proposed reconciliation.

- Do not simplify, remove, rename, merge, or reinterpret finalized requirements because they are absent from a memory summary or current UI.
- Do not reopen settled questions without a genuine new conflict or material new evidence.
- A technical limitation does not erase a product requirement. Record it as PENDING TECHNICAL VERIFICATION and propose options.
- Preserve rejected alternatives and the reasoning behind the selected approach.
- When a new instruction changes an earlier decision, record the new instruction and mark the old decision SUPERSEDED; never erase history.
- If two sources conflict, follow the evidence hierarchy in the Master Decision Record and show the conflict.

## 7. New-chat startup checklist

At the start of every new conversation involving this project:

- Identify the repository and active branch.
- Read this protocol.
- Read the Master Product, Architecture & Decision Record.
- Read the latest Active Conversation & Decision Log.
- Read relevant feature-specific records and handovers.
- Recover original conversations and visual sources when needed.
- Inspect current code/provider state for the requested task.
- Produce a short continuity checkpoint: current scope, settled decisions, open discussions, approvals, exclusions, implementation state and next safe action.
- Do not ask the owner to repeat already documented information.

If tools or repository access are unavailable, disclose that limitation before proceeding with project decisions or changes.

## 8. Approval and safety gates remain separate

Discussion, proposal, design finalisation, implementation approval, preview deployment, database migration, merge and production release are separate gates unless the owner explicitly combines them. This protocol does not grant new implementation or deployment authority.

All existing project safety boundaries remain in force, including the explicit restriction against Student LMS changes during Management-only work.

## 9. Session-close documentation checklist

Before ending any substantial project conversation:

1. Update the Active Conversation & Decision Log with all material discussions, proposals, considerations, decisions, rejected alternatives, deferred items and pending questions from that conversation.
2. Update the Master Decision Record with durable decisions, architecture changes, approvals, implementation/verification evidence and links to detailed records.
3. Update relevant feature-specific records and handovers.
4. Preserve original source references and screenshots/mockups where available.
5. Record exact commit SHA and branch for documentation changes.
6. Verify the files were actually committed and readable on GitHub.
7. Tell the owner exactly what was saved, where, and what could not be saved.
8. Never claim documentation was updated until the GitHub operation succeeds and is verified.

If the session cannot complete documentation, explicitly mark the record as pending and identify the exact unsaved items. Do not imply the conversation is fully handed over.

## 10. Incident record — incomplete Content Studio V4 proposal

**Status:** RECORDED / PROCESS CORRECTION REQUIRED

An assistant presented a simplified Content Studio V4 design without first reconciling it against the full existing GitHub specification and original design discussions. The proposal omitted or weakened previously documented requirements, including destination/action separation, internal navigation, complete editor/version comparison, preview, formatting, image/formula behaviour, shared-question safeguards, navigation ownership and detailed import/workflow rules.

The owner identified that another AI's review was needed to expose omissions. This created a risk that the owner could approve an incomplete design and cause rework or architectural regression.

**Required prevention:** Sections 2, 5, 6 and 7 of this protocol are mandatory before any future design or implementation approval request.

This incident record is not a claim that all historical discussions have now been recovered or that the Content Studio design is complete. Full source-history reconciliation remains a required task.

---
