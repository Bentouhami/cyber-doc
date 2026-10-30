# Deploy & Rollback Runbook (CyberDoc MVP)

Date: 2026-10-31
Applies to: Next.js 16 + Prisma/PostgreSQL

## Supported production target

For v1, production means the immutable `migrator` + `runner` container topology
with persistent PostgreSQL and `DOCS_STORAGE_DIR` volumes. Vercel deployments are
preview-only until the requirements in ADR 0007 are implemented and verified.
A Vercel `Ready` status is not release evidence for file persistence or PDF
generation.

## 1) Pre-Deploy Gate (mandatory)

Run from project root:

```bash
pnpm run release:freeze-audit
pnpm run release:secret-scan
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm run release:preflight
pnpm run release:smoke:critical
```

PowerShell shortcut:

```powershell
./scripts/release/prepare-release.ps1 -SmokeBaseUrl "http://127.0.0.1:3000"
```

The release evidence must come from a strict run with no skipped suite. A local
environment that cannot launch Playwright may be used for diagnosis, but cannot
produce release sign-off evidence.

## 2) Database Backup (before migrate)

PowerShell example:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "tmp/backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
pg_dump --dbname "$env:DATABASE_URL" --format=custom --file "$backupDir/cyberdoc-$stamp.dump"
```

## 3) Deploy Steps

```bash
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run build
pnpm run start
```

`pnpm run start` requires a preceding production build. It copies only the
generated static/public assets into `.next/standalone` and launches Next's
standalone `server.js`; it does not run migrations.

Container deployment uses two separate image targets:

- `migrator` contains the Prisma CLI and must finish successfully before the
  application starts;
- `runner` is the minimal Next.js standalone runtime and never skips migrations
  silently. It includes the packaged Chromium binary required by document PDF
  generation; the container CI must launch it and create a non-empty PDF before
  the image is eligible for release.

For the repository Compose deployment, define `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DB`, `CYBERDOC_IMAGE` and `CYBERDOC_MIGRATOR_IMAGE` outside Git, then
run:

```bash
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

`DATABASE_URL` must address the Compose service host `db` when the bundled
PostgreSQL service is used. The database is not exposed on a host port. Generated
documents and PostgreSQL data use named volumes. Back them up independently.
Both image variables must be immutable digest or commit-SHA references built from
the same source revision; `latest` is forbidden.

Do not start the application if the one-shot `migrate` service fails. Inspect
its logs, restore the pre-deploy backup when necessary, and keep the previous
application image active.

Health check:

- open `/`
- open `/documents`
- open `/admin/templates`

## 4) Post-Deploy Smoke

Run critical checks against deployed base URL:

```bash
SMOKE_BASE_URL=https://<your-domain> pnpm run release:smoke:critical
```

PowerShell shortcut:

```powershell
./scripts/release/post-deploy-smoke.ps1 -BaseUrl "https://<your-domain>"
```

## 5) Rollback Procedure

When to rollback:

- critical routes unavailable,
- auth/session broken,
- generation/download/print failing.

Rollback steps:

1. Set `CYBERDOC_IMAGE` to the previously verified immutable application image.
   Keep its matching migrator reference recorded, but do not apply a down-migration.
2. Do not run down-migrations implicitly. If a database migration introduced a
   breaking change, stop traffic and restore the verified pre-deploy backup.
3. Re-run smoke checks on rolled-back version.

DB restore example:

```powershell
pg_restore --clean --if-exists --no-owner --dbname "$env:DATABASE_URL" "tmp/backups/<backup-file>.dump"
```

## 6) Go/No-Go Sign-off

Before release close:

- update `docs/finalization/rc-smoke-report.md`
- update `docs/finalization/rc-open-issues.md`
- validate `docs/finalization/rc-go-no-go.md`
- record evidence file in `docs/finalization/evidence/`
