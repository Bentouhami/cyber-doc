# Documents smoke evidence — 2026-11-23

Scope: current dirty `release/v1.0.0-candidate` working tree after document
taxonomy, customer-history pagination and query/copy-boundary hardening.

## Environment

- fresh disposable PGlite PostgreSQL-compatible data directory;
- all 16 repository migration SQL files applied in order;
- real Prisma seed: 13 templates, 224 fields, 20 participant roles and one active printer;
- Next.js 16.4.6 standalone production build on an isolated local port;
- isolated document storage directory;
- installed Google Chrome supplied explicitly to the Playwright PDF renderer.

Prisma's schema engine cannot drive migrations through the PGlite socket bridge,
so the same migration SQL files were applied sequentially with the installed `pg`
client. This is emulator evidence, not a substitute for `prisma migrate deploy` on
the target PostgreSQL service.

## Result

`scripts/documents-smoke-runner.mjs`: **46/46 passed, 0 failed**.

The successful run covers authentication, request-boundary failures, real PDF
generation, new and existing personas, enrichment and history, global and
per-persona type/category filters, preview/download/print view, immutable
duplication, concurrent print accounting, missing resources, printer validation,
copy-count bounds, server-derived payment/change, employee price-override refusal,
version 2 creation, superseded-source conflict and the language override guard.

The machine-readable report is `tmp/documents-smoke/results.json`. The disposable
database, standalone build and generated document storage were removed after the
run; no real customer or production data was read or modified.

## Remaining boundary

This evidence does not prove the target PostgreSQL service, container image,
production secrets, durable storage, backup/restore, monitoring or remote CI.
