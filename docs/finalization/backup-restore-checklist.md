# Backup & Restore Checklist

Date: 2026-10-30

## Backup Checklist (pre-release / pre-migration)

- [ ] Record immutable `CYBERDOC_IMAGE` and `CYBERDOC_MIGRATOR_IMAGE` references.
- [ ] Confirm `DATABASE_URL` points to correct environment.
- [ ] Create backup directory (`tmp/backups` or secure external location).
- [ ] Run `pg_dump` custom format.
- [ ] Verify dump file exists and non-zero size.
- [ ] Record backup filename in release evidence doc.

PowerShell command:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "tmp/backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
pg_dump --dbname "$env:DATABASE_URL" --format=custom --file "$backupDir/cyberdoc-$stamp.dump"
Get-Item "$backupDir/cyberdoc-$stamp.dump" | Select-Object FullName, Length
```

## Restore Checklist (rollback)

- [ ] Stop app traffic (maintenance mode or rollback routing).
- [ ] Confirm target database and backup file.
- [ ] Run `pg_restore --clean --if-exists`.
- [ ] Re-run Prisma health check.
- [ ] Re-run critical smoke.

PowerShell command:

```powershell
$backupFile = "tmp/backups/<backup-file>.dump"
pg_restore --clean --if-exists --no-owner --dbname "$env:DATABASE_URL" $backupFile
pnpm exec prisma migrate status
pnpm run release:smoke:critical
```

## Retention

- [ ] Apply the backup retention and legal-hold policy approved in
  `docs/engineering/PRIVACY_OPERATIONS.md`; no duration is assumed by this runbook.
- [ ] Store the required off-host copy in the approved encrypted backup system.
- [ ] Test expiry without deleting a recovery point still required by policy.
