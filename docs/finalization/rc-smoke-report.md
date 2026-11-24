# RC Smoke Report

Date: 2026-11-24

Branch: `docs/post-merge-release-evidence`

Scope: current local release worktree after PR #13; an immutable commit and clean
CI rerun are still pending.

Canonical detailed evidence:

- `evidence/2026-11-23-quality-verify.md`;
- `evidence/2026-11-23-documents-smoke-current.md`;
- `evidence/2026-11-23-github-governance-audit.md`;
- `evidence/2026-11-24-critical-smoke-current.md`.

## 1) Current quality evidence

- ESLint and TypeScript: PASS;
- unit tests: **120/120 PASS**, zero skip;
- API contracts: **4/4 self-tests and 21/21 handlers PASS**;
- FR/AR audit: **592 used keys**, zero missing key and zero raw server message in UI;
- Next.js 16.4.6 Webpack production build: **29 pages PASS**;
- standalone assets: **13/13 sanitized DOCX**, zero raw historical DOCX;
- performance budgets: **7/7 routes PASS**;
- secret scans: no finding;
- dependency audit: no known vulnerability after the targeted i18next update.

## 2) Current functional smoke evidence

- permissions smoke: **52/52 PASS** on isolated Neon;
- administration smoke: **47/47 PASS** on isolated Neon;
- documents smoke: **48/48 PASS** on isolated Neon, including real PDF generation
  and a 5 MAD total discount paid exactly;
- full FR/AR UX/accessibility matrix: **32/32 PASS** on isolated Neon;
- critical Playwright E2E: **4/4 PASS**, zero skip.

The refreshed template import screen was also inspected interactively in French
and Arabic, light and dark themes, at 1440 px and 375 px. JSON/Word modes expose
associated labels and icons; the mobile tabs are stacked with 44 px targets,
the Arabic document is RTL, no horizontal overflow was measured and the browser
console reported no error. Language, theme and sign-out controls in the shared
mobile header were measured at 44 px after correction.

The current document smoke covers request-boundary failures, new/existing clients,
history and type/category filters, preview/download/print, immutable duplication,
concurrent copy accounting, payment/change, customer discount, excessive-discount
and price-override refusal, versioning and language override. The current local
machine reports are listed in `evidence/2026-11-24-critical-smoke-current.md`;
historical clean-CI reports remain preserved by run `45210556273`.

A final interactive check also caught and corrected a stale signed-out header
link from `/auth/login` to the existing login screen at `/`. A focused regression
test and ESLint pass. On an authenticated document detail, the unsaved payment
preview treated a blank discount as 0 MAD and a 5 MAD discount reduced 200 MAD to
195 MAD in both Arabic and French. No payment or document data was saved.

The production auth limiter now persists counters in PostgreSQL and ignores
forwarded client-IP headers unless `BETTER_AUTH_TRUSTED_PROXIES` contains validated
exact IP/CIDR entries. The final full gate passes 120/120 unit tests; target proxy
addresses and a deployed `429` exercise remain release evidence gates.

## 3) Database and runtime boundary

All **16 migration SQL files**, the real Prisma seed twice and `check:data`
previously passed against the workflow's PostgreSQL 17 service. For the current
worktree, `prisma migrate status` and `check:data` also passed on the isolated Neon
recovery branch before the zero-skip browser run. The data report found one active
assigned owner, valid active-template prices/sources/contracts, no unsafe packaged
asset and no orphan or probable duplicate fixture data.

The currently configured Neon target was then rechecked read-only: all 16
migrations remain applied, `/api/health` returns HTTP 200, one active printer is
configured, and the 13-template catalogue contains one active validly priced
template plus 12 inactive templates awaiting approval. No data was changed by
this verification.

The local runtime storage resolves to `E:\fullstack_project\CyberDoc\storage`,
exists with 127 files and passes the readiness read/write check. Durable
production-volume persistence and restore remain separate operational gates.

Runtime HTTP checks confirmed per-request CSP nonce rotation, anti-framing,
`nosniff`, restrictive referrer/permissions policies and `no-store`. The focused
security-header suite passed 2/2 and proves production removes development-only
CSP allowances. HSTS remains an HTTPS-edge responsibility.

## 4) Release assessment

Local code, database and browser gates are green; historical production-container
CI is green, but the current uncommitted worktree still needs an immutable commit
and clean CI/container rerun. The release remains **NO-GO** until the immutable
container is deployed with durable database and document storage and
backup/restore, rollback, monitoring, privacy policy, manual acceptance and
CNDP base-processing/foreign-transfer evidence, legal/template approvals and
manual acceptance have named evidence.
