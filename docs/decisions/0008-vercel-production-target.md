# ADR 0008 — Vercel production target

Date: 2026-11-24
Status: Accepted; rollout evidence pending
Supersedes: ADR 0007

## Context

CyberDoc is already linked to Vercel and uses Neon PostgreSQL. ADR 0007 kept
Vercel preview-only because generated PDFs and uploaded DOCX files were written
to a local filesystem and the packaged Chromium runtime was container-specific.
The owner has confirmed Vercel as the production target.

## Decision

The v1 production topology is Next.js on Vercel, Neon PostgreSQL and a private
Vercel Blob store. Database rows continue to store opaque relative paths; the
storage service selects the local driver for development/containers and the
private Blob driver explicitly with `DOCS_STORAGE_DRIVER=vercel-blob`.

PDF routes use the existing hardened renderer. On Vercel they extract a traced,
pinned serverless Chromium package into the function's temporary filesystem;
local and container execution keep their existing browser configuration.

The store must be private. Downloads remain behind CyberDoc role checks and are
streamed by authenticated route handlers; direct public document URLs are not
permitted.

## Release gates

- Create and connect a private Blob store in the approved region.
- Upload the private `_system/health` sentinel used by readiness checks.
- Set `DOCS_STORAGE_DRIVER=vercel-blob` for Preview, then Production.
- Deploy the exact candidate revision and obtain a `200` readiness response.
- Prove import, generation, private download and cleanup on Preview.
- Inventory and migrate any recoverable legacy filesystem files before cutover.
- Exercise and record Neon plus Blob backup/restore and Vercel rollback.
- Keep the historical production deployment active until those gates pass.

The technically aligned region is `iad1`, close to the current Neon
`aws-us-east-1` project and Vercel's default function region. Store creation is a
separate, potentially billable and region-immutable operation and therefore
requires explicit owner approval.

## Consequences

- ADR 0007's container topology remains a supported recovery/self-hosting option,
  but is no longer the selected production target.
- A green build alone is insufficient; Blob and PDF flows require deployed smoke
  evidence.
- Private customer documents are subject to Vercel/Neon data-location, retention
  and CNDP decisions documented by the release gate.
