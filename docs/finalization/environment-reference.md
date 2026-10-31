# Environment Variable Reference

Date: 2026-10-31

Start from the committed `.env.example`, keep real values outside Git, and use a
deployment secret manager for credentials. Blank example values are intentional
and make missing production configuration fail closed.

## Required

- `DATABASE_URL`

  - Used by Prisma client and migrations.
  - Example: `postgresql://user:password@localhost:5433/cyber-doc-db?schema=public`

- `BETTER_AUTH_SECRET`

  - Long, randomly generated server-side signing secret.
  - Required in every non-test deployment and must be stored in the platform's
    secret manager, never in Git or a container image.

- `BETTER_AUTH_URL` or `NEXT_PUBLIC_APP_URL` or `NEXTAUTH_URL`
  - Auth base URL fallback chain is defined in `lib/auth.ts`.
  - At least one is mandatory when `NODE_ENV=production`; the first configured
    value is canonical. Public production hosts must use HTTPS.
  - For Vercel previews only, the platform-provided `VERCEL_URL` is accepted
    when `VERCEL=1`; an explicit canonical URL always takes precedence.

## Recommended

- `NEXT_PUBLIC_APP_URL`

  - Optional public origin used by server-side auth trusted-origin resolution.
  - The browser auth client is same-origin and does not need a compiled base URL.
  - The production Compose build derives this non-secret build argument from
    `BETTER_AUTH_URL`; direct `docker build --target runner` callers must pass
    the canonical HTTPS origin with `--build-arg NEXT_PUBLIC_APP_URL=...`.

- `BETTER_AUTH_TRUSTED_ORIGINS`
  - Optional comma-separated list of additional exact HTTP(S) origins.
  - Leave empty for same-origin deployments. Values cannot contain credentials,
    paths, query strings or fragments. Development localhost conveniences are not
    added to a production instance.

- `DOCS_STORAGE_DIR`
  - Absolute path for generated document storage and employee-uploaded template assets.
  - If omitted, app uses default local storage path from service layer.
  - Production must mount this path on persistent storage and include it in backups.

- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
  - Optional outside containers; points the PDF renderer at a trusted Chromium binary.
  - The production `runner` image sets this to Alpine's packaged Chromium and CI
    launches the browser and generates a PDF inside that exact image.

## Optional (smoke/QA automation)

- `SMOKE_BASE_URL`
  - Base URL used by smoke scripts. Default: `http://127.0.0.1:3000`
- `SMOKE_ADMIN_EMAIL`
  - Admin account for smoke scripts. Defaults to the local seeded admin account.
- `SMOKE_ADMIN_PASSWORD`
  - Admin password for smoke scripts. Defaults to the local seed value; override it
    through the environment and never print it in reports.
- `SMOKE_ALLOW_EPERM_SKIP`
  - Local restricted-env fallback for critical runner. Use only with value `1`.

## Optional (legacy utility script)

- `GOOGLE_API_KEY`
  - Used only by `scripts/clean_templates.js` (legacy utility).

## Notes

- Prisma config loads `.env.local` first, then `.env` (`prisma.config.ts`).
- Never commit secrets to git.
- Keep production values in secret manager / CI secrets.
- `compose.yaml` additionally requires `POSTGRES_USER`, `POSTGRES_PASSWORD` and
  `POSTGRES_DB`. Its `DATABASE_URL` must use `db` as host and URL-encode any
  reserved characters in credentials. Compose fails during interpolation when
  one of its required values is absent.
- The Compose `migrate` service applies migrations once and must complete before
  `web` starts. The application runner does not contain the Prisma CLI.
- The v1 production target is the persistent container topology. Vercel is
  preview-only until a durable object-storage adapter and compatible PDF runtime
  are implemented and tested; see ADR 0007.
- Compose also requires `CYBERDOC_IMAGE` and `CYBERDOC_MIGRATOR_IMAGE`. Use an
  immutable digest or commit-SHA tag built from the same source revision; never
  use `latest`, which makes rollback and release evidence non-reproducible.
