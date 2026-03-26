# Documents Entry Flow - Block 2.1

Date: 2026-03-22

## Scope delivered
- Hardened existing-client prefill for templates that do not use `client` as role key:
  - selected persona now maps to the template primary role (`client` if present, otherwise first role).
- Existing-client generation guard now validates that at least one linked persona is selected.
- Standardized "new version" links to explicit existing-client mode:
  - `/documents/create?documentId=<id>&entryMode=existing`

## Files touched
- `components/templates/template-form.tsx`
- `components/documents/documents-table.tsx`
- `components/documents/document-cards.tsx`

## Validation
- `npm run lint` -> PASS
- `npm run type-check` -> PASS
- `npm run build` -> PASS
- `npm run i18n:audit` -> PASS

## Impact
- Employee workflow is now consistent:
  - Existing client path enforces actual client reuse.
  - Persona prefill works across template role variations (seller/buyer/client/etc.).
  - New-version actions always remain in existing-client mode.

