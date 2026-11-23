# Neon recovery rehearsal and smoke isolation

Date: 2026-11-23  
Branch: `release/v1.0.0-candidate`

## Recovery evidence

- Neon project `doc-cyber` uses `production` as its primary branch.
- A temporary `recovery-drill-20261123` branch was created from the current
  production state and expires on 2026-11-30.
- On that isolated branch, `prisma migrate status` reported all 16 migrations
  applied and `check:data` passed every invariant.
- A second temporary branch, `clean-production-candidate-20261123`, was restored
  from snapshot `pre-v1-migration-20261123`, then received all 16 migrations and
  the production seed. It also expires on 2026-11-30.
- The clean candidate passed `check:data` with zero personas, participants and
  documents, exactly one assigned/active Owner, and no invalid template price,
  render source, placeholder contract or packaged asset.

The snapshot restore remains un-finalized. No branch swap, production restore or
production deletion was performed.

## Smoke isolation finding

The mutating critical E2E suite had previously inherited the local `.env`, which
now points to Neon `production`. Its document runner explicitly leaves test
personas, documents and files behind because CI normally supplies disposable
PostgreSQL and storage.

Read-only production counts confirmed that all five documents were created during
the earlier local pre-push window on 2026-11-23. Production currently contains
eight personas, five documents and ten participant links; six personas, four
documents and eight links carry the explicit `SMK*` identifier marker. No rows
were deleted during this audit.

The release gate now fails closed unless:

1. `SMOKE_DISPOSABLE_DATABASE=1` is explicitly set;
2. a local database name contains a disposable marker such as `ci`, `test` or
   `restore`; or
3. a remote target also declares a marked `NEON_BRANCH`, such as a recovery or
   preview branch.

The runner rejects the current production environment before starting Next.js.
CI declares its isolated `cyber_doc_ci` database explicitly. The PowerShell
release launcher also requires `-ConfirmDisposableDatabase`.

## Authentication boundary regression

The first isolated run exposed a transient Neon transaction timeout on the public
sign-up request, even though Better Auth has sign-up disabled. The auth route now
rejects `/api/auth/sign-up/*` with HTTP 400 before invoking Better Auth or the
database. The isolated permission smoke subsequently passed 52/52.

## Remaining release proof

- The project snapshot quota is one, so a new post-migration snapshot could not be
  created while the pre-migration snapshot remains. Replacing it requires an
  explicit destructive decision.
- The clean candidate has not replaced production.
- The production smoke rows remain until the Cyber Owner approves either the clean
  branch cutover or a precisely scoped purge.
- The target container's persistent `documents_data` volume still needs a witnessed
  backup/restore and previous-image rollback exercise.
