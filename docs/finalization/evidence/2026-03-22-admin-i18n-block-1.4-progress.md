# Admin i18n Cleanup - Block 1.4 Progress

Date: 2026-03-22

## Scope completed
- Replaced remaining hardcoded admin badge label with i18n key:
  - `employees.managementBadge`
- Replaced remaining import generic error fallback with i18n key:
  - `templates.importFailedGeneric`
- Added FR/AR translations for both keys:
  - `locales/fr/common.json`
  - `locales/ar/common.json`

## Validation
- `npm run lint` -> PASS
- `npm run type-check` -> PASS
- `npm run i18n:audit` -> PASS
  - missing in fr: 0
  - missing in ar: 0
  - fr-only keys: 0
  - ar-only keys: 0

## Remaining item in Block 1.4
- RTL visual verification on running admin routes (manual runtime check).

