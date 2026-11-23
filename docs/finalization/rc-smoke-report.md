# RC Smoke Report

Date: 2026-11-23

Branch: `release/v1.0.0-candidate`

Scope: current dirty working tree; not a remote-CI release revision

Canonical detailed evidence:

- `evidence/2026-11-23-quality-verify.md`;
- `evidence/2026-11-23-documents-smoke-current.md`;
- `evidence/2026-11-23-github-governance-audit.md`.

## 1) Current quality evidence

- ESLint and TypeScript: PASS;
- unit tests: **103/103 PASS**, zero skip;
- API contracts: **4/4 self-tests and 20/20 handlers PASS**;
- FR/AR audit: **555 used keys**, zero missing key and zero raw server message in UI;
- Next.js 16.4.6 Webpack production build: **29 pages PASS**;
- standalone assets: **13/13 sanitized DOCX**, zero raw historical DOCX;
- performance budgets: **7/7 routes PASS**;
- secret scans: no finding;
- dependency audit: zero high/critical finding.

## 2) Current functional smoke evidence

- permissions smoke: **50/50 PASS** on disposable PGlite;
- administration smoke: **45/45 PASS** on disposable PGlite;
- documents smoke: **46/46 PASS** on a fresh disposable PGlite database and
  standalone build, including real PDF generation through installed Chrome;
- isolated template-list responsive check: FR/LTR and AR/RTL at 390 px, zero overflow.

The current document smoke covers request-boundary failures, new/existing clients,
history and type/category filters, preview/download/print, immutable duplication,
concurrent copy accounting, payment/change, price-override refusal, versioning and
language override. Its machine report is `tmp/documents-smoke/results.json`.

## 3) Database and runtime boundary

All **16 migration SQL files** and the real Prisma seed succeeded on a fresh PGlite
database. The seed produced 13 templates, 224 fields, 20 participant roles and an
active printer. PGlite's socket bridge cannot execute Prisma's schema engine, so
this does not prove `prisma migrate deploy` on the target PostgreSQL service.

The complete integrated UX matrix also remains pending on real PostgreSQL: the
PGlite bridge can mix prepared statements when a document page performs parallel
queries. This emulator limitation must not be reported as production evidence.

## 4) Release assessment

Local code and document-smoke gates are green, but the release remains **NO-GO**
until the current tree is committed, reviewed, pushed and covered by remote CI,
and until the target PostgreSQL, container, durable storage, backup/restore,
monitoring, privacy policy and legal/template approvals have named evidence.
