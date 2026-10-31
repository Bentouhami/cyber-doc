# 2026-03-22 - Feature 2 API Integration Coverage

## Scope

Close `P4-2` from `project-master-plan.md` by adding explicit integration checks for:

- template validate endpoint
- template render-test endpoint
- document payment update endpoint

## Implemented changes

- Updated `scripts/admin-smoke-runner.mjs`
  - Added `Templates API - validate` check on `GET /api/templates/{slug}/validate`
  - Added `Templates API - render test` check on `POST /api/templates/{slug}/render-test` and verifies PDF content type
- Updated `scripts/documents-smoke-runner.mjs`
  - Added `Documents payment update` check on `PATCH /api/documents/{documentId}/payment`
  - Validates expected computed payment output fields (`paymentStatus`, `amountPaid`, `changeGiven`)

## Expected verification commands

- `npm run smoke:admin`
- `npm run smoke:documents`
- `npm run lint`
- `npm run type-check`

## Outcome

Integration coverage now explicitly includes templates + documents + payments API mutations in the automated smoke layer, matching the objective of `P4-2`.
