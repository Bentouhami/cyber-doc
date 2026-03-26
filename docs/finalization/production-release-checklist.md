# Production Release Checklist

Date: 2026-03-22

## Before merge/tag

- [ ] `npm run release:freeze-audit` is clean (`isClean=true`).
- [ ] `npm run release:secret-scan` reports no findings.
- [ ] Branch is up to date with `dev`.
- [ ] `npm run release:preflight` passed.
- [ ] `npm run release:smoke:critical` passed (or CI green).
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

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
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
