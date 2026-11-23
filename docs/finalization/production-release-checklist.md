# Production Release Checklist

Date: 2026-10-30

## Before merge/tag

- [ ] `pnpm run release:freeze-audit` is clean (`isClean=true`).
- [ ] `pnpm run release:secret-scan` reports no findings.
- [ ] Branch is up to date with `dev`.
- [ ] `pnpm run release:github-protection` passes for `dev` and `main`.
- [ ] `pnpm run release:preflight` passed.
- [ ] `pnpm run release:smoke:critical` passed locally with zero skip.
- [ ] Required CI jobs are green on the exact release commit: Gitleaks,
  quality-gates, dependency-review, container-build and critical-smoke.
- [ ] `CYBERDOC_IMAGE` and `CYBERDOC_MIGRATOR_IMAGE` are immutable references
  built from that same commit and recorded in the release evidence.
- [ ] Backup/restore and previous-image rollback evidence is current.
- [ ] Privacy/retention decisions and named sign-offs are complete.
- [ ] RC docs updated:
  - [ ] `rc-smoke-report.md`
  - [ ] `rc-open-issues.md`
  - [ ] `rc-go-no-go.md`

## Merge and tag

```bash
git checkout dev
git pull --ff-only origin dev
# merge release branch via PR (preferred)
git checkout main
git pull --ff-only origin main
# merge dev to main via PR (preferred)
git tag v1.0.0
git push origin v1.0.0
```

## Deploy

Preferred container deployment follows `deploy-runbook.md`: run the matching
one-shot migrator image, then the standalone application image. For a direct
host deployment, use:

```bash
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run build
pnpm run start
```

## Immediate post-deploy checks

- [ ] `/` loads
- [ ] `/documents` loads
- [ ] `/admin/templates` loads
- [ ] Create + download one test document
- [ ] Print route excludes app chrome

## Rollback trigger criteria

- auth/session failure for admin/employee
- document generation failure
- download/print failure
- API error rate spike

## Rollback command references

See: `docs/finalization/deploy-runbook.md` and `docs/finalization/backup-restore-checklist.md`
