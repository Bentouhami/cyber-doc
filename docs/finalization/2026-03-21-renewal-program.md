# CyberDoc Renewal Program (Start -> End)

Date: 2026-03-21
Branch baseline: `dev`
Status: IN_PROGRESS

## Objective

Rebuild CyberDoc around real business usage so non-technical admins and employees can work fast without developer knowledge.

## Locked Product Scope

### Admin core actions

1. Employee CRUD (create, update, activate/deactivate, delete).
2. Template catalog management with default business templates.
3. Simple-first template mode (advanced mode hidden).

### Employee core actions

1. Find existing client by name / CIN / phone.
2. Open client profile and see all previous documents.
3. Open/duplicate/update existing document quickly.
4. If client is new: select template, enter client info once, auto-create client, auto-link new document.

## Architecture Direction

1. `Persona` is the canonical client identity.
2. Documents are linked to clients through `DocumentParticipant` (`roleKey = client`) and optionally mirrored in `DocumentClient` during migration period.
3. Employee flow becomes client-first, template-second.

## Execution Phases

### Phase 0 - Cleanup and scope lock

1. Remove/ignore leftover experimental files from active runtime paths.
2. Keep archive material in `docs/new-to-test` and `templates_docs` only.
3. Freeze MVP scope and reject non-core additions.

### Phase 1 - Backend foundations (current)

1. Client-centric APIs:
   - search clients
   - fetch client document history
2. Duplicate-safe template creation/import with admin override.
3. Stable API contracts for employee workflow.

### Phase 2 - Employee UX flow

1. New flow: client lookup -> document history -> create/update/duplicate.
2. New client quick-create in document flow.
3. Auto-prefill client data from previous documents/persona.

### Phase 3 - Admin UX simplification

1. Employee CRUD clarity and guardrails.
2. Template manager simplified to business terms.
3. Preloaded default templates by category/type.

### Phase 4 - Data and migration hardening

1. Normalize CIN/phone/name for robust dedup search.
2. Ensure one canonical identity path (`Persona`).
3. Migration scripts + rollback notes.

### Phase 5 - QA and release gates

1. Smoke tests for admin and employee critical paths.
2. Type-check/lint/build green.
3. GO/NO-GO checklist with evidence.

## Decision Checkpoints (ask user confirmation)

1. Canonical client model finalization (`Persona` only vs dual-link bridge).
2. Default template starter pack list.
3. Document update policy (editable original vs always duplicate for legal safety). ✅ Locked on 2026-03-21: always duplicate, original immutable.

## Current Sprint (started now)

1. Deliver client->documents retrieval API.
2. Document API contracts for next UI phase.
3. Start employee page refactor plan after endpoint validation.

## Definition of Done

1. Employee can process repeat client documents in less than 90 seconds.
2. New client intake creates reusable client profile automatically.
3. Admin can manage employees/templates without technical vocabulary.
4. Runtime is stable with no blocker-level errors on core routes.
