# PR Checklist (Finalization)

Use this checklist for every PR touching product behavior.

- [ ] Feature scope is inside MVP boundary (`cahier-des-charges-v1.md`).
- [ ] DRY/KISS pre-check completed (`pre-feature-discovery-checklist.md`).
- [ ] Functional services matrix updated if feature behavior changed (`feature-service-matrix.md`).
- [ ] Canonical feature documentation created or updated under `docs/features/`.
- [ ] `docs/features/README.md` indexes every new feature document.
- [ ] ADR added under `docs/decisions/` for any expensive-to-reverse decision.
- [ ] i18n impacted keys updated in FR/AR.
- [ ] `pnpm run lint` passes.
- [ ] `pnpm run type-check` passes.
- [ ] `pnpm run build` passes.
- [ ] `pnpm run check:feature-docs` passes.
- [ ] `pnpm run quality:prepush` passes without skips.
- [ ] `pnpm run release:scope:preview` reports zero unclassified path.
- [ ] GitHub workflow YAML passes actionlint and external actions are SHA-pinned.
- [ ] Release PR only: CI secret names, approval label and branch protection
  pass their read-only audits before push/merge.
- [ ] Smoke evidence updated if route/API behavior changed.
