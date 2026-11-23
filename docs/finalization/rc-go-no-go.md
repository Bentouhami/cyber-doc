# RC Go/No-Go Decision

Date: 2026-11-23

Branch: `release/v1.0.0-candidate`

## Decision Status

Current status: **NO-GO — production conditions pending**

The current dirty working tree passes its locally executable code gates and the
standalone document smoke. It is not a reviewed release revision, has no current
remote CI evidence and has not run against the target PostgreSQL environment.

Current evidence:

- `docs/finalization/evidence/2026-11-23-quality-verify.md`;
- `docs/finalization/evidence/2026-11-23-documents-smoke-current.md`;
- `docs/finalization/evidence/2026-11-23-github-governance-audit.md`;
- `docs/finalization/rc-smoke-report.md`.

## Engineering Entry Criteria

- [x] Frozen pnpm install succeeds
- [x] ESLint and TypeScript pass
- [x] Unit tests pass: 103/103
- [x] Production build passes: 29 pages
- [x] API contracts and FR/AR i18n audit pass
- [x] Dependency and dual secret scans have no high/critical finding
- [x] Seven critical-route performance budgets pass
- [x] Permissions, administration and document smokes pass on disposable PGlite
- [x] Real PDF generation passes in the standalone document smoke
- [x] Independent-review payment, generation, asset and role adverse cases are closed
- [ ] `prisma migrate deploy`, seed and `check:data` pass on target PostgreSQL
- [ ] Full critical E2E and FR/AR UX/accessibility matrix pass on target PostgreSQL
- [ ] Manual Owner/Responsible, template, payment, print and audit acceptance passes

The 16 migration SQL files and real seed pass on PGlite, but the emulator's socket
bridge cannot execute Prisma's schema engine and can mix prepared statements under
parallel page queries. Those checks therefore remain open for real PostgreSQL.

## Operational and Governance Criteria

- [ ] Current exact revision builds the `migrator` and `runner` images in CI
- [ ] Current exact revision passes all five required CI checks
- [x] CI-only GitHub secret names are provisioned
- [x] Zero required reviews is the documented Cyber Owner policy for this solo repository
- [ ] Target configuration and trusted proxy/origin policy are approved
- [ ] Durable storage and active-printer configuration are validated
- [ ] Supported immutable container revision is deployed
- [ ] Database plus document-volume backup/restore exercise is recorded
- [ ] Previous-image rollback and post-rollback smoke are recorded
- [ ] Monitoring dashboard, external probe and delivered alert are proven
- [ ] PII and activity-log retention/export/deletion policy is approved
- [ ] Ten inactive historical templates have approved legal content and prices
- [ ] Product, QA, security/privacy and operations sign-offs are recorded

## Decision

- GO: [ ]
- NO-GO: [x]

Move to GO only when every unchecked condition has named evidence or an explicit,
documented risk acceptance from its accountable owner. Local green tests alone do
not authorize production deployment.

## Sign-off

- Cyber/Product Owner: pending
- Engineering Owner: pending
- QA Owner: pending
- Security/Privacy Owner: pending
- Operations Owner: pending
- Decision date: pending
