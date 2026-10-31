# Client Data Model (Current)

## Canonical model used by the app

- `personas`: canonical client profile (name, CIN, phone, address, etc.).
- `document_participants`: link table between a generated document and one or more personas with a business role (`client`, `seller`, `buyer`, ...).

This is the model used by:

- `/api/documents/generate` (create/link participant personas)
- `/api/personas` and `/api/personas/[personaId]/documents` (search/history)
- `/documents` and `/documents/create` guided workflow

## Why `users` and `document_clients` can be empty

- `users` is for authenticated staff accounts (admin/employee), not end-clients.
- `document_clients` is a legacy relation (`document` <-> `user`) and is not used by the current documents workflow.

## Practical checks in Prisma Studio

When a document is generated for new participants, verify:

1. New rows in `personas`.
2. New rows in `document_participants`.
3. New row in `documents`.

Do not expect new rows in `users` for client creation.

## Env consistency note

Prisma CLI/Studio is configured to load `.env.local` first in `prisma.config.ts` to match Next.js runtime DB target.
