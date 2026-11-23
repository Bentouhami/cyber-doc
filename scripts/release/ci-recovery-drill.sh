#!/usr/bin/env bash
set -euo pipefail

if [[ "${CI:-}" != "true" ]]; then
  echo "ci-recovery-drill: CI=true is required" >&2
  exit 1
fi

: "${RECOVERY_DRILL_DATABASE_URL:?RECOVERY_DRILL_DATABASE_URL is required}"
: "${POSTGRES_CONTAINER_ID:?POSTGRES_CONTAINER_ID is required}"

node --input-type=module -e '
  const target = new URL(process.env.RECOVERY_DRILL_DATABASE_URL);
  if (!["127.0.0.1", "localhost"].includes(target.hostname) || target.pathname !== "/cyber_doc_restore") {
    console.error("ci-recovery-drill: target must be the local cyber_doc_restore database");
    process.exit(1);
  }
'

if [[ "$(docker inspect --format '{{.Config.Image}}' "$POSTGRES_CONTAINER_ID")" != "postgres:17" ]]; then
  echo "ci-recovery-drill: expected the PostgreSQL 17 CI service container" >&2
  exit 1
fi

mkdir -p "$PWD/tmp"
work_dir="$(mktemp -d "$PWD/tmp/recovery-drill.XXXXXX")"
tmp_root="$(realpath "$PWD/tmp")/"
case "$(realpath "$work_dir")/" in
  "$tmp_root"*) ;;
  *)
    echo "ci-recovery-drill: refusing a work directory outside the project tmp root" >&2
    exit 1
    ;;
esac

source_storage="$work_dir/source-documents"
restore_storage="$work_dir/restored-documents"
database_dump="$work_dir/database.dump"
storage_archive="$work_dir/documents.tar.gz"
mkdir -p "$source_storage/nested" "$restore_storage"
printf 'CyberDoc recovery drill\n' > "$source_storage/nested/sentinel.txt"

docker exec "$POSTGRES_CONTAINER_ID" \
  pg_dump --username postgres --dbname cyber_doc_ci --format custom \
  > "$database_dump"
tar -C "$source_storage" -czf "$storage_archive" .

test -s "$database_dump"
test -s "$storage_archive"
docker exec -i "$POSTGRES_CONTAINER_ID" pg_restore --list < "$database_dump" >/dev/null
tar -tzf "$storage_archive" >/dev/null
(
  cd "$work_dir"
  sha256sum database.dump documents.tar.gz > SHA256SUMS
  sha256sum --check SHA256SUMS
)

docker exec "$POSTGRES_CONTAINER_ID" createdb --username postgres cyber_doc_restore
docker exec -i "$POSTGRES_CONTAINER_ID" \
  pg_restore --username postgres --dbname cyber_doc_restore --exit-on-error \
  < "$database_dump"
tar -xzf "$storage_archive" -C "$restore_storage"
cmp "$source_storage/nested/sentinel.txt" "$restore_storage/nested/sentinel.txt"

DATABASE_URL="$RECOVERY_DRILL_DATABASE_URL" pnpm exec prisma migrate status
DATABASE_URL="$RECOVERY_DRILL_DATABASE_URL" pnpm run check:data

{
  echo "status=pass"
  echo "source_database=cyber_doc_ci"
  echo "restore_database=cyber_doc_restore"
  echo "database_dump_bytes=$(stat -c %s "$database_dump")"
  echo "storage_archive_bytes=$(stat -c %s "$storage_archive")"
  echo "completed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  cat "$work_dir/SHA256SUMS"
} > "$work_dir/results.txt"

echo "ci-recovery-drill: database and document archive restored successfully"
