# RC Go/No-Go Decision

Date: 2026-11-23

Branch: `release/v1.0.0-candidate`

## Decision Status

Current status: **NO-GO — production conditions pending**

PR #13 is mergeable and its release revision passes all required GitHub checks,
including PostgreSQL 17 migrations/data validation, critical browser suites and
both production container targets. The remaining NO-GO conditions concern the
supported deployment target, operator acceptance and governance evidence.

Current evidence:

- `docs/finalization/evidence/2026-11-23-quality-verify.md`;
- `docs/finalization/evidence/2026-11-23-documents-smoke-current.md`;
- `docs/finalization/evidence/2026-11-23-github-governance-audit.md`;
- `docs/finalization/rc-smoke-report.md`.

## Engineering Entry Criteria

- [x] Frozen pnpm install succeeds
- [x] ESLint and TypeScript pass
- [x] Unit tests pass: 104/104
- [x] Production build passes: 29 pages
- [x] API contracts and FR/AR i18n audit pass
- [x] Dependency and dual secret scans have no high/critical finding
- [x] Seven critical-route performance budgets pass
- [x] Permissions, administration and document smokes pass on disposable PGlite
- [x] Real PDF generation passes in the standalone document smoke
- [x] Independent-review payment, generation, asset and role adverse cases are closed
- [x] `prisma migrate deploy`, double seed and `check:data` pass on CI PostgreSQL 17
- [x] Full critical E2E and FR/AR UX/accessibility matrix pass on CI PostgreSQL 17
- [ ] Manual Owner/Responsible, template, payment, print and audit acceptance passes

The PostgreSQL CI artifact records permissions 50/50, administration 45/45,
documents 46/46, FR/AR UX 32/32 and critical E2E 4/4, all without failure.
Production data, durability and recovery remain separate operational gates.

## Operational and Governance Criteria

- [x] Current release revision builds the `migrator` and `runner` images in CI
- [x] Current release revision passes all five required CI checks
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
