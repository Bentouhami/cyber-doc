# 2026-03-22 - Feature 4 Contract Audit

## Scope

Close `P3-4` by adding an automated contract drift audit for API mutation routes.

## Implemented changes

- Added `scripts/contract-audit.mjs`
  - Scans `app/api/**/route.ts`
  - Targets mutation handlers (`POST`, `PATCH`, `PUT`)
  - Flags routes that parse JSON body without schema validation patterns
  - Writes report to `tmp/contract-audit/results.json`
- Added npm script:
  - `npm run check:contracts`

## Verification

- `npm run check:contracts` -> pass
- Report summary (`tmp/contract-audit/results.json`):
  - `totalChecked: 15`
  - `passCount: 15`
  - `failCount: 0`

## Outcome

Contract drift detection is now automated and reusable in local/CI quality gates.
