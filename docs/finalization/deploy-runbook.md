# Deploy & Rollback Runbook (CyberDoc MVP)

Date: 2026-03-22
Applies to: Next.js 16 + Prisma/PostgreSQL

## 1) Pre-Deploy Gate (mandatory)

Run from project root:

```bash
npm run release:freeze-audit
npm run release:secret-scan
npm ci
npx prisma generate
npm run release:preflight
npm run release:smoke:critical
```

PowerShell shortcut:

```powershell
./scripts/release/prepare-release.ps1 -SmokeBaseUrl "http://127.0.0.1:3000"
```

If local Windows sandbox blocks Playwright (`spawn EPERM`), run:

```bash
SMOKE_ALLOW_EPERM_SKIP=1 npm run release:smoke:critical
```

Important:
- Skip mode is local-only fallback.
- CI stays strict (no skip flag).

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
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

Health check:
- open `/`
- open `/documents`
- open `/admin/templates`

## 4) Post-Deploy Smoke

Run critical checks against deployed base URL:

```bash
SMOKE_BASE_URL=https://<your-domain> npm run release:smoke:critical
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
1. Switch app deployment to previous stable artifact/image.
2. If DB migration introduced a breaking change, restore DB backup.
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
