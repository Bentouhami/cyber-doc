# 2026-03-23 - Release Scope Preview

## Scope

Prepare a safe keep/defer split for release freeze.

## Added tooling

- `scripts/release/prepare-freeze-scope.ps1`
- `npm run release:scope:preview`
- `npm run release:scope:apply`
- Scope reference doc:
  - `docs/finalization/release-candidate-scope-v1.0.0.md`

## Preview result

Command:

```bash
npm run release:scope:preview
```

Output summary:

- Keep candidates: `101`
- Defer candidates: `6`

Deferred sample:

- `.codex/skills/ui-ux-pro-max/`
- `storage/`
- `templates_docs/*.docx` (source sample docs)

## Outcome

Release freeze can proceed with a single safe staging command:

```bash
npm run release:scope:apply
```
