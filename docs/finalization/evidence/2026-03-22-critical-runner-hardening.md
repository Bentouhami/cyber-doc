# Evidence - Critical Runner Restricted-Env Hardening (2026-03-22)

## Change

- Updated `scripts/e2e-critical-runner.mjs` with:
  - opt-in fallback flag: `SMOKE_ALLOW_EPERM_SKIP=1`
  - EPERM detection and suite skip reporting
  - `skipCount` in report output
  - safe handling when `pwsh` spawn throws synchronously

## Validation

- `npm run lint` -> PASS
- `npm run type-check` -> PASS
- `SMOKE_ALLOW_EPERM_SKIP=1 npm run test:e2e:critical` -> PASS in restricted sandbox

Report example:
- `tmp/e2e-critical/results.json`
  - `allowEpermSkip: true`
  - `skipCount: 3`
  - no hard fail in restricted environment

## Policy

- CI remains strict (no skip flag by default).
- Skip mode is only for constrained local environments.
