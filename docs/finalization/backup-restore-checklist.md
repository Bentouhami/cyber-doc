# Backup & Restore Checklist

Date: 2026-11-23

The database and `documents_data` volume form one recovery point. Never back up
only one of them. Stop application writes for the whole capture; a database dump
and a file archive taken while employees are creating documents are not a
consistent backup.

## Backup Checklist (pre-release / pre-migration)

- [ ] Record immutable `CYBERDOC_IMAGE` and `CYBERDOC_MIGRATOR_IMAGE` references.
- [ ] Confirm `DATABASE_URL` points to correct environment.
- [ ] Stop `web` or otherwise prevent every document/template write.
- [ ] Create a dedicated recovery-point directory in secure external storage.
- [ ] Run `pg_dump` in custom format and archive the `documents_data` volume.
- [ ] Hash both archives and verify that each archive is readable.
- [ ] Restart `web`, verify `/api/health`, and record the directory and hashes in
  the release evidence without recording credentials.

Compose example (run from the exact immutable release checkout on a Bash-capable
operations host; keep the environment file and resulting archives outside Git):

```bash
set -euo pipefail
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="/secure-backups/cyberdoc/$stamp"
mkdir -p "$backup_dir"

docker compose stop web
docker compose exec -T db sh -c \
  'exec pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --format=custom' \
  > "$backup_dir/database.dump"
docker compose run --rm --no-deps --entrypoint tar web \
  -C /app/storage -czf - . > "$backup_dir/documents.tar.gz"

test -s "$backup_dir/database.dump"
test -s "$backup_dir/documents.tar.gz"
docker compose exec -T db pg_restore --list < "$backup_dir/database.dump" >/dev/null
tar -tzf "$backup_dir/documents.tar.gz" >/dev/null
(cd "$backup_dir" && sha256sum database.dump documents.tar.gz > SHA256SUMS)

docker compose start web
curl --fail --silent --show-error "https://<your-domain>/api/health"
```

If any command fails, keep traffic stopped until the operator has confirmed that
no migration has started and that the previous application instance is healthy.

The critical CI gate runs `scripts/release/ci-recovery-drill.sh` against its
isolated PostgreSQL 17 service. It creates and verifies both archives, restores
them into a new database and directory, then runs migration status and data
invariants. This proves the commands on disposable data only; it does not satisfy
the witnessed target-environment exercise or validate production RPO/RTO.

## Restore Checklist (rollback)

- [ ] Stop app traffic (maintenance mode or rollback routing).
- [ ] Confirm the target database, Compose project and recovery-point directory.
- [ ] Verify `SHA256SUMS`, the dump catalogue and the storage archive before changing data.
- [ ] First restore into a disposable database and empty storage directory.
- [ ] Run migrations status, `check:data`, `/api/health` and critical smoke against
  that disposable target; record the result and elapsed recovery time.
- [ ] For an approved rollback only, restore both production components from the
  same recovery point, then restart the previous immutable image.
- [ ] Re-run the post-rollback critical smoke and retain the evidence.

Archive validation and disposable extraction:

```bash
set -euo pipefail
recovery_point="/secure-backups/cyberdoc/<timestamp>"
(cd "$recovery_point" && sha256sum --check SHA256SUMS)
pg_restore --list "$recovery_point/database.dump" >/dev/null
restore_storage="$(mktemp -d)"
tar -xzf "$recovery_point/documents.tar.gz" -C "$restore_storage"
test -d "$restore_storage"
```

Do not run `pg_restore --clean` or delete the active document volume from this
checklist by copy/paste. The operations owner must supply the explicitly confirmed
target URLs/volumes in the witnessed exercise; restore commands are destructive.

## Required evidence

- UTC timestamp and exact application/migrator image digests;
- database and storage archive sizes plus SHA-256 hashes;
- disposable restore target identity and `pg_restore` result;
- `check:data`, readiness and critical-smoke results;
- measured RPO/RTO and named operator/approver;
- previous-image rollback and post-rollback health result.

## Retention

- [ ] Apply the backup retention and legal-hold policy approved in
  `docs/engineering/PRIVACY_OPERATIONS.md`; no duration is assumed by this runbook.
- [ ] Store the required off-host copy in the approved encrypted backup system.
- [ ] Test expiry without deleting a recovery point still required by policy.
