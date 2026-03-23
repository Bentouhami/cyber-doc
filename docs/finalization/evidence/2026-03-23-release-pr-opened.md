# 2026-03-23 - Release PR Opened

## Scope

Advance `P8-1` from local freeze to reviewable release candidate PR.

## Actions completed

- Created branch: `release/v1.0.0-candidate`
- Pushed branch to origin
- Opened PR to `dev`:
  - https://github.com/Bentouhami/cyber-doc/pull/12
- Verified freeze gate on candidate branch:
  - `npm run release:freeze-audit` -> clean

## Safety checks

- Secret scan: pass (`npm run release:secret-scan`)
- Branch protections active on `dev` and `main`

## Deferred local artifacts

Non-release files were safely stashed:

- `stash@{0}` message: `defer non-release artifacts before v1.0.0 freeze`

Deferred categories include:

- `.codex/skills/ui-ux-pro-max/`
- `storage/`
- `templates_docs/`
