# CyberDoc performance baseline

Measured: 2026-10-24 on the local production build. These are synthetic local
measurements, not real-user monitoring or production SLO evidence.

## HTTP and bundle baseline

- `/` cold TTFB: 240.3 ms.
- `/` warm average TTFB: 17.8 ms; warm maximum: 41.5 ms.
- `/` compressed HTML: 4,841 bytes.

| Route | Initial JS gzip | CSS gzip |
| --- | ---: | ---: |
| `/` | 64.8 KiB | 20.4 KiB |
| `/documents` | 103.0 KiB | 20.4 KiB |
| `/documents/create` | 170.9 KiB | 20.4 KiB |
| `/admin/employees` | 150.2 KiB | 20.4 KiB |
| `/admin/templates` | 100.7 KiB | 20.4 KiB |
| `/admin/templates/new` | 108.4 KiB | 20.4 KiB |
| `/admin/templates/[slug]` | 107.0 KiB | 20.4 KiB |

All measured routes are below the provisional 200 KiB initial-JavaScript budget.
`/documents/create` and `/admin/employees` are the first routes to monitor.

## Enforced deterministic budgets

`pnpm run performance:budgets` reads the client-reference manifests produced by
`next build`, deduplicates the route assets and compresses their bytes locally at
gzip level 6. It performs no HTTP request and starts no server. `quality:verify`
runs it immediately after the production build, so missing manifests or chunks
fail closed in local preflight and CI.

| Route | JS gzip limit | CSS gzip limit | Baseline headroom |
| --- | ---: | ---: | ---: |
| `/` | 75 KiB | 25 KiB | 15.7% JS |
| `/documents` | 120 KiB | 25 KiB | 16.5% JS |
| `/documents/create` | 195 KiB | 25 KiB | 14.1% JS |
| `/admin/employees` | 175 KiB | 25 KiB | 16.5% JS |
| `/admin/templates` | 116 KiB | 25 KiB | 15.2% JS |
| `/admin/templates/new` | 125 KiB | 25 KiB | 15.3% JS |
| `/admin/templates/[slug]` | 123 KiB | 25 KiB | 15.0% JS |

The roughly 14–17% JS headroom is deliberate: it catches meaningful route growth
while avoiding false failures from small compiler or compression differences.
The CSS ceiling leaves about 22% above the 20.4 KiB baseline. CI pins Node and
pnpm; a toolchain upgrade must rebuild the baseline before changing a threshold.
Threshold increases require evidence explaining the user value and why splitting
or deferring the added code is not appropriate.

The local pre-check and the subsequent fresh production rebuild produced the same
byte totals for all seven routes. This confirms deterministic evaluation for the
current pinned toolchain; CI still remains the authoritative Linux environment.

These budgets cover transfer size, not runtime responsiveness. TTFB, API p95,
Core Web Vitals and PostgreSQL pool limits remain observation-only until stable
deployment and RUM evidence exist; this check must not be presented as proof of
those metrics.

## Kept optimization: PDF rendering

Same local conditions, three runs each:

| State | Samples | Median |
| --- | --- | ---: |
| Before (`networkidle`) | 713 / 705 / 688 ms | 705 ms |
| After (`load`, isolated network) | 564 / 216 / 213 ms | 216 ms |

The median improved by about 69%, exceeds observed variance, preserves a valid PDF
signature and makes zero forbidden network requests. The change is retained.

## Proven next candidates

1. `/api/users/me` is currently requested two to three times on protected admin
   navigation. Consolidate consumers on the existing profile provider and verify
   exactly one initial request in the browser network trace.
2. Do not add database indexes yet: representative local document queries execute
   below 0.1 ms at the current small dataset. Re-run `EXPLAIN ANALYZE` with
   production-like volume first.

## Kept optimization: admin template list projection

The list now selects only the fields it renders and uses Prisma `_count` instead
of loading every template field. The measured local median changed from 3.153 ms
to 1.169 ms (about 63% faster), while serialized query data fell from 53,699 to
9,351 bytes (about 82.6% smaller). The returned UI contract is unchanged.

## Missing production evidence

Production topology, instance count, PostgreSQL connection ceiling, traffic shape
and RUM provider are unknown. Pool budgets, p95 API SLOs and Core Web Vitals alerts
must be finalized when those deployment facts are available.

## Kept optimization: activity-log query indexes

A connection-local temporary table with 250,000 representative append-only rows
was measured over seven warm samples on PostgreSQL 17. No production row was
created or changed. Median list-query execution changed as follows:

| Query shape | Before | After |
| --- | ---: | ---: |
| Recent page | 55.925 ms | 0.078 ms |
| Date range | 35.412 ms | 0.080 ms |
| User filter | 14.668 ms | 0.046 ms |
| Activity-type filter | 16.548 ms | 0.031 ms |
| Resource-type filter | 29.659 ms | 0.030 ms |
| Deep offset 100,000 | 84.185 ms | 32.136 ms |
| Case-insensitive contains search | 294.918 ms | 291.620 ms |

The retained indexes replace sequential scans and sorts for the stable ordering,
date range and exact filters. Their synthetic storage cost was about 59.6 MiB in
total at 250,000 rows (excluding the primary key). The endpoint also computes an
exact count: indexes materially help selective date/user counts, while low-
selectivity type/resource counts and the unfiltered count remain scan-bound.

Deep offset and `contains` search did not improve enough to claim a solved problem.
No trigram index was added because the OR search spans joined tables and there is
no usage evidence yet; no cursor contract was introduced without an API consumer.
Re-run `scripts/performance/activity-log-query-benchmark.ts` with representative
production cardinality before changing either design.
