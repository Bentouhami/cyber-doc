# Release Candidate Scope v1.0.0 (Freeze Plan)

Date: 2026-03-23  
Branch: `dev`

## Goal

Freeze a safe, production-ready commit set while excluding local/test/private artifacts.

## Keep (include in release candidate)

- `.github/workflows/frontend.yml`
- `.gitignore`
- `app/**`
- `components/**`
- `lib/**`
- `locales/**`
- `mappers/**`
- `services/**`
- `scripts/**`
- `types/**`
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `prisma.config.ts`
- `docs/finalization/**`

## Defer (do not include in release candidate)

- `tmp/**` (generated reports)
- `storage/**` (generated customer documents / local assets)
- `templates_docs/**` (raw source Word files / possible PII)
- `docs/new-to-test/**` (sandbox test assets)
- `.codex/skills/ui-ux-pro-max/**` (local skill bundle copy)

## Why this split

- Keeps only application/runtime code + release docs/checklists.
- Excludes local generated artifacts and source legal docs that are not required for production runtime.
- Reduces risk of pushing sensitive or non-essential content.

## Execution sequence

1. Run pre-check:
   - `npm run release:secret-scan`
2. Apply scope (stage keep paths only):
   - use `scripts/release/prepare-freeze-scope.ps1 -Apply`
3. Inspect staged diff:
   - `git diff --staged --name-only`
4. Stash deferred leftovers safely:
   - `git stash push -u -m "defer non-release artifacts before v1.0.0 freeze"`
5. Verify freeze:
   - `npm run release:freeze-audit`
6. Continue release gates:
   - `npm run release:preflight`
   - `npm run test:e2e:critical`
