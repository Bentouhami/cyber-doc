# 2026-11-24 — Vercel production foundation

## Scope

Prepared the current candidate for the Vercel production topology selected in
ADR 0008. No production deployment, alias, database migration or document-data
copy was performed.

## Implemented

- Added an explicit `local` / `vercel-blob` storage driver.
- Kept database `filePath` values as validated relative paths.
- Added private Blob write, authenticated read, deletion and readiness support.
- Changed Blob readiness to a private `_system/health` metadata check so the
  one-minute monitor does not perform a billable list operation.
- Routed generated PDFs and uploaded template assets through the shared driver.
- Added Vercel Postgres variable fallbacks and production fail-closed behavior.
- Required a Better Auth secret of at least 32 characters in production.
- Bound per-client auth rate limits to Vercel's overwritten
  `x-vercel-forwarded-for` header and kept their counters in PostgreSQL.
- Added a distinct hidden `BETTER_AUTH_SECRET` to Vercel Preview.
- Added a traced serverless Chromium runtime for all three PDF routes with a
  60-second maximum duration.
- Pinned the vulnerable transitive Zod instance to 4.6.7.
- Updated ADR 0007/0008 and deployment/environment documentation.
- Upgraded the Better Auth `rate_limits` table to the current `id` primary-key
  contract while preserving `key` as unique; the table contained zero rows.
- Fixed standalone asset copying for non-default Next.js build directories and
  limited Vercel Analytics injection to the Vercel runtime.

## Verification

Command executed with the supported Node 24.22.3 runtime:

```text
pnpm run quality:verify
```

Result: PASS.

- floor guard: clean
- secret scan and Gitleaks: no findings
- lint and TypeScript: pass
- unit tests: 127/127
- dependency audit: no known vulnerabilities
- API contracts: 21/21 handlers
- i18n: 592 used keys; zero FR/AR gaps
- Next.js 16.4.6 production build: 29 pages
- standalone sanitized template assets: 13/13
- performance budgets: 7/7 routes
- build traces contain the serverless Chromium files for document generation,
  document download/regeneration and template render-test routes
- Prisma migration `20261124144500_add_rate_limit_id`: applied successfully to Neon
- isolated production bundle: `/api/health` 200 and `/api/auth/get-session` 200
- authenticated post-deploy smoke: 7/7 read-only checks
- browser smoke: owner login, template catalog and template pricing detail in
  desktop and mobile viewports; zero console errors or warnings

## External state and remaining gate

- Neon project `doc-cyber` is in `aws-us-east-1`.
- Vercel's default function region is `iad1`, the aligned Blob region.
- Creating `cyber-doc-documents` as a private `iad1` Blob store was not executed:
  it is persistent, potentially billable and region-immutable, so explicit owner
  approval is required.
- `DOCS_STORAGE_DRIVER=vercel-blob`, deployed storage/PDF smoke, backup/restore
  evidence and production promotion remain pending until the store exists.

## Read-only storage inventory

`pnpm run storage:inventory` was executed against Neon without selecting or
printing customer data or file names:

- documents in the database: 5;
- canonical `documents/` paths: 4;
- documents without a stored path: 1;
- referenced local PDFs present: 4/4;
- packaged sanitized template assets: 13;
- uploaded persistent template assets: 0;
- total local document files: 127;
- local files not referenced by an active database path: 123 candidates.

Only the four validated database-referenced PDFs are eligible for the initial
Blob migration. The 123 unreferenced candidates must remain local until a
separate retention/ownership review approves archival or deletion; bulk upload
would expand personal-data exposure and storage cost without an application
reference.
