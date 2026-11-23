# ADR 0007 — Supported production deployment target

Date: 2026-10-31
Status: Accepted for the v1 release candidate

## Context

CyberDoc stores generated PDFs and imported DOCX template assets through a local
filesystem contract rooted at `DOCS_STORAGE_DIR`. Those files must survive
process restarts, deployments and rollbacks and must be included in backups.
PDF generation also launches Chromium.

The linked Vercel project currently has a historical production deployment, but
its standard serverless filesystem is not CyberDoc's durable document store and
the deployed revision predates the pnpm, Next.js 16.4.3 and security-hardening
work.

## Decision

The supported v1 production target is the repository's immutable container
deployment using the `migrator` and `runner` images plus persistent database and
document volumes. The same source revision must build both images.

Vercel may be used for UI previews only. It is not an approved production target
for document generation/import until CyberDoc has a tested durable object-storage
adapter, compatible atomic publication semantics, private-download authorization,
retention/backup procedures and a Chromium execution strategy for that platform.

## Consequences

- Release evidence must include the container Chromium/PDF smoke.
- `DOCS_STORAGE_DIR` must point to a mounted persistent volume and be backed up.
- A green Vercel deployment does not satisfy the production release gate.
- The historical Vercel production alias must not be treated as the v1 release.
- Supporting serverless production later requires a separate architecture change,
  threat-model update, migration plan and end-to-end tests.
