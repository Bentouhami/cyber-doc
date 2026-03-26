# Environment Variable Reference

Date: 2026-03-22

## Required

- `DATABASE_URL`
  - Used by Prisma client and migrations.
  - Example: `postgresql://user:password@localhost:5433/cyber-doc-db?schema=public`

- `BETTER_AUTH_URL` or `NEXT_PUBLIC_APP_URL` or `NEXTAUTH_URL`
  - Auth base URL fallback chain is defined in `lib/auth.ts`.

## Recommended

- `NEXT_PUBLIC_APP_URL`
  - Client-side API base for auth client.

- `DOCS_STORAGE_DIR`
  - Absolute path for generated document storage.
  - If omitted, app uses default local storage path from service layer.

## Optional (smoke/QA automation)

- `SMOKE_BASE_URL`
  - Base URL used by smoke scripts. Default: `http://127.0.0.1:3000`
- `SMOKE_ADMIN_EMAIL`
  - Admin account for smoke scripts. Default: `admin@cybercafe.com`
- `SMOKE_ADMIN_PASSWORD`
  - Admin password for smoke scripts. Default: `12345678`
- `SMOKE_ALLOW_EPERM_SKIP`
  - Local restricted-env fallback for critical runner. Use only with value `1`.

## Optional (legacy utility script)

- `GOOGLE_API_KEY`
  - Used only by `scripts/clean_templates.js` (legacy utility).

## Notes

- Prisma config loads `.env.local` first, then `.env` (`prisma.config.ts`).
- Never commit secrets to git.
- Keep production values in secret manager / CI secrets.
