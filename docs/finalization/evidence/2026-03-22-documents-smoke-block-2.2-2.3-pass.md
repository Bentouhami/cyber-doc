# Documents Smoke Validation - Blocks 2.2 / 2.3 / 2.4

Date: 2026-03-22
Report: `tmp/documents-smoke/results.json`

## Summary
- passCount: 13
- failCount: 0

## Validated scope
- API auth for smoke runner
- Active template discovery with participant roles + fields
- New client generation flow:
  - participants persisted
  - persona searchable after generation
- Existing client generation flow:
  - seed persona creation
  - persona linked by `personaId`
  - persona enrichment (email update) persisted
  - persona document history linked
- Delivery checks:
  - document download endpoint returns file
  - print view route renders dedicated print frame
- Language guard:
  - mixed-script submission triggers warning gate (`LANGUAGE_OVERRIDE_REQUIRED`)
  - confirmation path succeeds and generation continues

## Technical additions
- New runner: `scripts/documents-smoke-runner.mjs`
- New npm script: `npm run smoke:documents`

## Related functional hardening
- Existing mode prefill now maps selected persona to template primary role if `client` key is absent.
- Existing mode guard now checks at least one linked persona.
- Editing participant fields no longer clears linked `personaId` by default.
