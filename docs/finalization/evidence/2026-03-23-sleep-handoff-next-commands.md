# 2026-03-23 - Sleep Handoff (Next Commands)

## Current state

- Branch: `dev`
- Branch protection: active on `dev` and `main`
- Release freeze audit: **not clean**
  - modified: `52`
  - untracked: `61`
  - report: `tmp/release-freeze/results.json`

## First command to run on resume

```bash
npm run release:scope:preview
npm run release:scope:apply
npm run release:freeze-audit
npm run release:secret-scan
```

## If still not clean

1. Decide the exact release candidate file set.
2. Stage release scope only via `npm run release:scope:apply`.
3. Stash deferred leftovers safely:

```bash
git stash push -u -m "defer non-release artifacts before v1.0.0 freeze"
```

4. Re-run release gates.
5. Re-run:

```bash
npm run release:freeze-audit
npm run release:secret-scan
npm run release:preflight
npm run test:e2e:critical
```

## When freeze is clean

Execute `P8-1` from:

- `docs/finalization/production-release-checklist.md`
- `docs/finalization/release-commit-freeze-checklist.md`

Then continue with:

- `P8-2` deploy steps (`docs/finalization/deploy-runbook.md`)
- `P8-3` monitoring (`docs/finalization/post-release-monitoring-checklist.md`)
- `P9-1` closure note (`docs/finalization/release-closure-note-template.md`)
