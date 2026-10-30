# 2026-10-31 — Vercel Target Audit

## Scope

Read-only inspection of the Vercel project linked by `.vercel/project.json`.
Secret values were neither requested nor displayed; only variable names and
platform-reported deployment metadata were inspected.

## Findings

- The latest production deployment is reported `Ready` and is 84 days old.
- Its build log is dated 2026-08-07 and used npm, Next.js 16.2.0 and Prisma 7.5.0.
- It therefore does not contain the current pnpm-only dependency graph, Next.js
  16.4.3 release candidate, security fixes or final regression suite.
- Vercel lists encrypted authentication and database variables, but no
  `DOCS_STORAGE_DIR` or equivalent durable document-store configuration.
- The local `.env` file is ignored and absent from `HEAD`; `git show HEAD:.env`
  fails and no `.env` history exists. No repository secret leak was established.

## Decision impact

CyberDoc's current generated-PDF and imported-DOCX implementation requires
persistent filesystem and Chromium semantics. ADR 0007 therefore designates the
immutable container topology as the supported v1 production target and Vercel as
preview-only.

No Vercel environment variable, alias, deployment or project setting was changed
during this audit.
