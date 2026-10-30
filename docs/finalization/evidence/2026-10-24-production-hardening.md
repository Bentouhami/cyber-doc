# 2026-10-24/30 — Production Hardening Evidence

## Scope

Fresh verification after the pnpm/Next.js migration, security hardening,
performance work, accessibility automation and standalone deployment repair.

## Environment

- Branch: `release/v1.0.0-candidate`
- OS: Windows / PowerShell
- Node.js: 24.15.0
- pnpm: 12.15.0

## Commands and Results

- `pnpm install --frozen-lockfile --ignore-scripts` — PASS
- `$env:QUALITY_ALLOW_CONSTRAINT_CHANGE='1'; pnpm run quality:prepush` — PASS
- standalone server root request — HTTP 200
- standalone generated CSS request — HTTP 200

The composite gate produced:

- unit: 47/47 PASS;
- contract audit: 4/4 self-tests, 17/17 handlers;
- i18n: 489 keys, no missing key;
- permission/admin/document/UX suites: 44/39/23/32 PASS, zero failure;
- critical E2E aggregate: four suites, zero skip;
- Axe serious/critical violations: zero;
- migrations: eleven applied and current;
- performance budgets: seven routes PASS;
- internal secret scanner and Gitleaks: PASS;
- dependency audit: no known high-severity vulnerability.

## Evidence Safety

Only aggregate counts, command names and non-sensitive runtime metadata are
recorded here. Browser reports exclude field values, HTML fragments, secrets and
personal data.

## Deliberate Constraint Change

`QUALITY_ALLOW_CONSTRAINT_CHANGE=1` acknowledges the reviewed update to measured
bundle budgets in `CONSTRAINTS.md`. All substantive gates still ran and passed.

## Unproven Conditions

- Docker was unavailable locally; container builds must be proven by CI.
- Backup/restore, previous-image rollback and deployed post-smoke are pending.
- Privacy/retention decisions and independent named sign-off are pending.

Therefore this evidence supports a release candidate, not a production GO.
