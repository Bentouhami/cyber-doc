# Continuous Execution Batch - 2026-03-22

Date: 2026-03-22

## Implemented

1. Security hardening headers in `next.config.ts`
- Added CSP
- Added Referrer-Policy, X-Content-Type-Options, X-Frame-Options, Permissions-Policy
- Added HSTS in non-dev environments

2. Employee-facing generation error clarity
- API now returns explicit error codes in `/api/documents/generate`
  - `INVALID_REQUEST_PAYLOAD`
  - `INVALID_JSON_PAYLOAD`
  - `FIELD_VALIDATION_ERROR`
- Frontend maps invalid payload errors to actionable FR/AR messages.

3. Technical wording cleanup
- Removed `Persona` technical term from employee result label in FR/AR UI copy.

4. Critical E2E runner
- Added `scripts/e2e-critical-runner.mjs`
- Added npm command: `npm run test:e2e:critical`
- Current limitation: unified runner still needs stabilization for restricted execution environments.

## Validation
- `npm run lint` -> pass
- `npm run type-check` -> pass
- `npm run i18n:audit` -> pass
- `npm run build` -> pass

Route smoke checks (executed with approved wrappers):
- `admin-smoke` -> pass (26/0)
- `documents-smoke` -> pass (13/0)
- `ux-route-check` -> pass (28/0)

## Reports
- `tmp/admin-smoke/results.json`
- `tmp/documents-smoke/results.json`
- `tmp/ux-check/results.json`
- `tmp/e2e-critical/results.json`
