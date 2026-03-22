# Release Notes - v1.0.0 RC

Date: 2026-03-22
Status: GO-CANDIDATE (technical)

## Highlights

- Admin flows stabilized:
  - employee CRUD,
  - template create/import/duplicate/review/archive,
  - duplicate guard with override.
- Employee flows stabilized:
  - new vs existing client entry path,
  - participant detection + selective persistence,
  - document generate/print/download/payment.
- UX/i18n quality:
  - FR/AR + RTL/LTR route checks passing,
  - no raw i18n keys on critical routes,
  - label/placeholder consistency improved.
- QA and safety:
  - admin/documents/ux smoke runners in place,
  - unified critical runner (`npm run test:e2e:critical`),
  - CI workflow wired to run quality gates + critical smoke.
- Security hardening:
  - CSP + standard security headers in `next.config.ts`.

## Known Limitations

- Local restricted Windows sandbox may require:
  - `SMOKE_ALLOW_EPERM_SKIP=1 npm run test:e2e:critical`
- Complex `.docx` imports may still need manual review.

## Upgrade/Run Commands

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

## Validation Commands

```bash
npm run release:preflight
npm run release:smoke:critical
```

## Evidence

See `docs/finalization/evidence/` for latest execution batches and RC refresh logs.
