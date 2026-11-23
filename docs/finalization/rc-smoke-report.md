# RC Smoke Report

Date: 2026-11-23

Branch: `release/v1.0.0-candidate`

Scope: PR #13 application revision `bc0c232`; remote CI runs `45210543249` and
`45210556273`

Canonical detailed evidence:

- `evidence/2026-11-23-quality-verify.md`;
- `evidence/2026-11-23-documents-smoke-current.md`;
- `evidence/2026-11-23-github-governance-audit.md`.

## 1) Current quality evidence

- ESLint and TypeScript: PASS;
- unit tests: **108/108 PASS**, zero skip;
- API contracts: **4/4 self-tests and 20/20 handlers PASS**;
- FR/AR audit: **555 used keys**, zero missing key and zero raw server message in UI;
- Next.js 16.4.6 Webpack production build: **29 pages PASS**;
- standalone assets: **13/13 sanitized DOCX**, zero raw historical DOCX;
- performance budgets: **7/7 routes PASS**;
- secret scans: no finding;
- dependency audit: zero high/critical finding.

## 2) Current functional smoke evidence

- permissions smoke: **52/52 PASS** on PostgreSQL 17;
- administration smoke: **47/47 PASS** on PostgreSQL 17;
- documents smoke: **46/46 PASS** on PostgreSQL 17, including real PDF generation;
- full FR/AR UX/accessibility matrix: **32/32 PASS** on PostgreSQL 17;
- critical Playwright E2E: **4/4 PASS**, zero skip.

The current document smoke covers request-boundary failures, new/existing clients,
history and type/category filters, preview/download/print, immutable duplication,
concurrent copy accounting, payment/change, price-override refusal, versioning and
language override. The complete machine reports are preserved by run
`45210556273` in the `critical-smoke-reports` artifact.

## 3) Database and runtime boundary

All **16 migration SQL files**, `prisma migrate deploy`, the real Prisma seed twice,
`check:data` and `prisma migrate status` succeeded against the workflow's
PostgreSQL 17 service. The data report found one active assigned owner, valid
active-template prices/sources/contracts, no unsafe packaged asset and no orphan or
duplicate fixture data.

## 4) Release assessment

Code, PostgreSQL, browser and production-container CI gates are green. The release
remains **NO-GO** until the immutable container is deployed with durable database
and document storage and backup/restore, rollback, monitoring, privacy policy,
manual acceptance and legal/template approvals have named evidence.
