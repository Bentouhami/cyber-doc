# Release Commit Freeze Checklist

Date: 2026-10-31
Goal: create one reviewable, reproducible release-candidate revision without
silently dropping security, schema, deployment or documentation changes.

## 1. Authorization boundary

- [x] Repository owner explicitly authorizes staging, commit and push.
- [x] The exact destination branch and PR are confirmed.
- [ ] No merge, tag, deployment or repository-setting change is inferred from
  commit/push authorization.

## 2. Scope preview

```powershell
pnpm run release:scope:preview
```

- [ ] Every changed path is either a reviewed keep candidate or an explicitly
  deferred generated/scratch path.
- [ ] Unclassified count is zero; apply fails closed otherwise.
- [ ] Critical release files are present when changed: lockfile, workflow,
  Docker/Compose, Prisma schema/migrations, proxy/security configuration,
  feature docs and release evidence.
- [ ] `.env*`, credentials, local Neon/Vercel metadata, `tmp/` and generated
  storage are absent from the commit scope.

## 3. Technical gate before staging

```powershell
$env:QUALITY_ALLOW_CONSTRAINT_CHANGE = "1"
pnpm run quality:prepush
Remove-Item Env:QUALITY_ALLOW_CONSTRAINT_CHANGE
pnpm run release:secret-scan
pnpm run security:gitleaks
git diff --check
```

- [ ] Every command passes with no skipped suite.
- [ ] Generated evidence contains no secrets or personal data.
- [ ] `.github/workflows` passes actionlint and every external `uses:` reference
  is pinned to an immutable 40-character SHA (also enforced by `quality:floor`).

## 4. Prepare and inspect the index

Only after authorization:

```powershell
pnpm run release:scope:apply
git diff --staged --name-status
git diff --staged --check
pnpm run release:secret-scan
pnpm run security:gitleaks
```

- [ ] Deletions such as the obsolete npm lockfile/workflow are intentional.
- [ ] No user work is discarded, stashed, reset or overwritten.
- [ ] The staged diff matches the reviewed scope.

## 5. Commit, push and exact-revision evidence

- [ ] Commit message describes the release-hardening scope.
- [ ] Commit SHA is recorded in the evidence document.
- [ ] Push targets only `release/v1.0.0-candidate`.
- [x] PR #13 into `dev` points to the release branch; historical PR #12 is merged.
- [x] All five current required checks pass on the audited application SHA `bc0c232`.
- [ ] No merge or tag occurs before approval, operations proof and final GO.
