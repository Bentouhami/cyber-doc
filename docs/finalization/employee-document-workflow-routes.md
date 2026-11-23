# Employee Document Workflow Routes

Date: 2026-03-21

## Goal
Define the exact employee routes for:
- Existing client reuse (strict mode)
- New client creation mode
- Where/when a new client is created in DB

## Employee Routes

1. Documents dashboard:
- `GET /documents`
- Guided choice:
  - `Client existant`
  - `Nouveau client`

2. Existing client flow (strict reuse):
- Search/list on dashboard (API):
  - `GET /api/personas?q=<query>&limit=8`
- Client history:
  - `GET /api/personas/:personaId/documents?page=1&pageSize=12`
- Create new doc from existing client:
  - `GET /documents/create?personaId=<personaId>&entryMode=existing`

3. New client flow:
- Start new client mode:
  - `GET /documents/create?entryMode=new`

4. Document generation endpoint (both modes):
- `POST /api/documents/generate`

## Strict Rules Implemented

1. Existing mode (`entryMode=existing`):
- `TemplateForm` requires selected existing `personaId` for `client` role before generation.
- If missing, generation is blocked with user-facing error.

2. New mode (`entryMode=new`):
- No `personaId` required.
- Client data in participants is persisted automatically during generation.

## DB Persistence Behavior (Source of Truth)

In `POST /api/documents/generate`:

1. If `participants[].personaId` provided:
- Existing persona is linked to document participant.
- Action in response: `linked_existing`

2. If no `personaId` and `persona.nationalId` provided:
- Upsert on `Persona.nationalId`:
  - found => update existing persona, action `updated_existing`
  - not found => create new persona, action `created_new`

3. If no `personaId` and no `nationalId`:
- Create new persona row, action `created_new`

4. Link to document:
- Rows created in `document_participants` via `createMany(..., skipDuplicates: true)`

## API Response Verification

`POST /api/documents/generate` now returns:
- `persistedParticipants[]` with:
  - `roleKey`
  - `roleLabel`
  - `personaId`
  - `action` (`linked_existing` | `updated_existing` | `created_new`)

This is the direct runtime proof of whether the client was newly created or reused.

## Smoke Runner

Script added:
- `scripts/admin-smoke-runner.mjs`
- `npm run smoke:admin`

Coverage:
- Admin route rendering
- Employees CRUD via API
- Templates duplicate guard on create/import APIs

Outputs:
- `tmp/admin-smoke/results.json`
- `tmp/admin-smoke/checklist.md`
