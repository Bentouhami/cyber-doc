# Release Notes — v1.0.0 RC

Date: 2026-10-30
Status: release candidate; production NO-GO pending operational and governance evidence

## Runtime Baseline

- Node.js: `>=22.13.0 <25`
- package manager: pnpm 12.15.0
- Next.js: 16.4.3 (exact direct dependency)
- React: 19.3.1-compatible range
- Prisma: 7.10.1-compatible range

`pnpm-lock.yaml` is the only dependency lockfile. npm installation commands are
not supported for this repository.

Unbounded `latest` specifiers were removed from direct dependencies; Next.js,
`@next/env` and `eslint-config-next` are kept on the same exact release.

## Highlights

- Admin employee and template management flows are regression-tested.
- Employee document creation, preview, download, printing and payment paths are
  covered by critical browser smoke.
- Active-user policy revokes disabled sessions and public account signup is off.
- Template input is sanitized; previews use a strict CSP and sandbox; PDF
  generation blocks network and page JavaScript with a bounded timeout.
- Generated-file access enforces database ownership, realpath containment,
  symlink rejection and exclusive writes.
- Activity logs have an admin-only, minimized, paginated and filterable API and
  a responsive FR/AR administration UI with complete loading/error/empty states.
- FR/AR, RTL/LTR, desktop/mobile, overflow and automated Axe checks cover the
  critical route matrix.
- Post-build gzip budgets protect seven user-facing routes.
- CI and local quality gates include tests, dependency audit, dual secret scans,
  contracts, i18n, build, performance budgets and critical browser smoke.
- Container deployment separates schema migration from the minimal standalone
  Next.js runtime.

## Known Limitations and Release Conditions

- Container targets still require a witnessed green CI build.
- Backup/restore and image rollback must be exercised in the target environment.
- PII and activity-log retention/export/deletion policy requires product/legal approval.
- Complex `.docx`, multi-copy payment arithmetic and no-CIN identity matching
  need operator-focused acceptance testing.
- An upstream Prisma PostgreSQL adapter warning remains visible until resolved
  upstream; it is not suppressed locally.

## Upgrade and Run Commands

```bash
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run build
pnpm run start
```

For containers, use the separately built `migrator` target before the `runner`
target. The application runtime never performs or silently skips migrations.

## Validation Commands

```bash
pnpm run release:preflight
pnpm run release:smoke:critical
```

The authoritative release decision and open conditions are maintained in
`docs/finalization/rc-go-no-go.md` and `docs/finalization/rc-open-issues.md`.
