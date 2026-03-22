# Release Commit Freeze Checklist (P8-1)

Date: 2026-03-23  
Goal: Freeze a clean release candidate set before merge/tag.

## A) Branch and PR state

- [x] Current branch identified (`dev`).
- [x] Open PRs to `dev` checked (none open at snapshot time).
- [x] Recent merged PRs reviewed for release scope.

## B) Working tree freeze gate

- [ ] Working tree clean (`git status` has no modified/untracked files).
- [ ] Release scope files are intentionally selected and reviewed.
- [ ] Non-release experiments/scratch files excluded from release set.
- [ ] Scope staged via `npm run release:scope:apply`.

Current snapshot (2026-03-23):
- modified files: `52`
- untracked files: `60`

## C) Technical gate (must be green on frozen commit)

- [x] `npm run lint`
- [x] `npm run type-check`
- [x] `npm run i18n:audit`
- [x] `npm run build`
- [x] `npx prisma migrate status`
- [x] `npm run test:e2e:critical` (local fallback mode evidence captured)

## D) Merge/tag execution block (after B is complete)

```bash
git checkout dev
git pull --ff-only origin dev
# Ensure frozen release commit set is merged to dev via PR
git checkout main
git pull --ff-only origin main
# Merge dev -> main via PR
git tag v1.0.0
git push origin v1.0.0
```

## E) Exit criteria

- [ ] Branch is frozen and reviewed.
- [ ] Merge PR(s) merged with required checks.
- [ ] `v1.0.0` tag pushed.
