# Current critical smoke evidence

Date: 2026-11-24
Worktree branch: `docs/post-merge-release-evidence`
Revision boundary: local uncommitted release worktree; an immutable commit and CI
rerun are still required before merge or deployment.

## Isolated target

- Neon project: `divine-dust-42849916` (`doc-cyber`).
- Disposable branch: `recovery-drill-20261123`, expiring 2026-11-30.
- Verified non-production endpoint: `ep-withered-wave-adee57gt.c-2.us-east-1.aws.neon.tech`.
- The production endpoint was explicitly rejected by the launch command.
- Application traffic used the pooled URL; Prisma status used the direct URL;
  both requested `sslmode=verify-full`.
- Generated documents used an isolated local directory under `tmp/`.
- `SMOKE_ALLOW_EPERM_SKIP` and `SMOKE_ALLOW_DB_UNAVAILABLE_SKIP` were unset.

Before the browser run, `prisma migrate status` reported all 16 migrations
applied. `check:data` passed every invariant: one active assigned Owner, no
probable duplicate persona, no orphan participant, no invalid active-template
price/source/placeholder contract and no unsafe packaged asset.

## Results

`pnpm run test:e2e:critical` completed with **4/4 suites PASS, 0 failure and
0 skip**:

- permissions: **52/52 PASS**;
- documents: **48/48 PASS**;
- administration: **47/47 PASS**;
- FR/AR desktop/mobile UX and accessibility: **32/32 PASS**.

The document suite now proves the family-business cash exception end to end:
a total discount of 5 MAD produced a charged total of 595 MAD; receiving exactly
595 MAD returned `PAID` with zero change. A discount large enough to make the
total negative returned HTTP 400. The catalog unit price was not changed.

The machine-readable local reports are generated under:

- `tmp/e2e-critical/results.json`;
- `tmp/permissions-smoke/results.json`;
- `tmp/documents-smoke/results.json`;
- `tmp/admin-smoke/results.json`;
- `tmp/ux-check/results.json`.

## Release review and quality gate

An independent review of the payment boundary, shared payment preview, API
callers, document smoke runner, translations and dependency lockfile found no
blocking defect. A mutation check that inverted the discount calculation made
the focused payment tests fail, then the restored implementation passed all 11
focused payment tests.

`pnpm run quality:verify` passed on this worktree: 120/120 unit tests, 21/21 API
contract handlers, 592 used translation keys with no FR/AR gap, the 29-page
Next.js 16.4.6 production build, 13/13 standalone sanitized template assets and
all seven route performance budgets. The dependency audit reports no known
vulnerability.

The refreshed template import screen was inspected in French and Arabic, light
and dark themes, at desktop (1440 px) and mobile (375 px) widths. Both JSON and
Word modes expose visible sections, associated labels and Lucide icons. The
mobile tabs stack vertically with 44 px targets, the Arabic page reports `rtl`,
no horizontal overflow was measured and the browser console contained no error.
The shared mobile header controls for language, theme and sign-out were also
measured at 44 px after the global touch-target correction.

The i18next 24-to-26 migration was checked against the project usage: the
removed legacy formatter and deprecated initialization options are not used.
The local pooled and unpooled Neon URLs were changed from `sslmode=require` to
`sslmode=verify-full`; the follow-up production build passed without the
PostgreSQL SSL compatibility warning. No host or credential was changed.

## Current configured runtime verification

The configured Neon database was rechecked read-only on 2026-11-24. Prisma
reported all 16 migrations applied, `check:data` passed every invariant, and the
running application returned HTTP 200 with `{ "status": "ok" }` from
`/api/health`. The current data contains one active printer
(`Printer-FrontDesk`) and 13 templates: one active and validly priced, with the
other 12 inactive pending catalogue approval. No migration, seed or data write
was performed during this verification.

The local runtime resolves document storage to
`E:\fullstack_project\CyberDoc\storage`; the directory exists, contains 127
files and the readiness check confirms read/write access. This proves the local
runtime wiring only, not persistence of the future production container volume.

The running HTTP application also returned the expected CSP nonce, `DENY`
framing, `nosniff`, restrictive referrer and permissions policies, and
`no-store`. Two requests produced different nonces. The focused security-header
tests passed 2/2 and prove that production CSP removes the development-only
`unsafe-eval` and broad hot-reload connection allowances. HSTS is intentionally
not asserted on the local plain-HTTP development server and must be supplied by
the approved HTTPS edge.

A privacy triage query returned aggregates only: all 8 personas and all 5
documents match the known synthetic smoke markers, with zero unclassified client
record. Neon also contains 6 workforce accounts (2 active, 4 deactivated), which
remain personal data and therefore do not remove the CNDP compliance gate.

Runtime reproducibility was tightened with `.node-version` pinned to the exact CI
baseline Node 22.17.0 and pnpm 12 `engineStrict: true`. An install attempt under
Node 26.13.0 now fails early with `ERR_PNPM_UNSUPPORTED_ENGINE`. The controlled
development server was restarted through the user's profile on supported Node
24.22.3, and `/api/health` remained HTTP 200.

The quality floor now fails when `.node-version`, `package.json` engines, the
Docker major, the CI runtime or pnpm `engineStrict` drift apart. A temporary
`23.0.0` mutation produced the three expected blocking findings; after restoring
`22.13.0`, targeted ESLint, the floor guard and `git diff --check` all passed.

PR #14 then exposed a newer direct dependency floor: `@sparticuz/chromium-min`
153 requires Node 22.17.0 or newer. The project floor, exact CI runtime and
`.node-version` were raised together to 22.17.0; the frozen pnpm install and floor
guard passed under the supported Node 24.22.3 development runtime.

A five-axis review then rechecked the financial boundary, every changed caller,
the administration/import UI, dependency lock and runtime guard. The document
summary amount was corrected to follow the server-confirmed local state after a
payment or print instead of retaining the initial page value. The no-discount
generation case now has an explicit test; mutating the shared empty-value rule
made that test fail as expected before restoration. The full Node 24 gate passed
again: 120/120 unit tests, 21/21 API handlers, 592 bilingual keys, no known
dependency vulnerability, the 29-page production build, 13/13 sanitized assets
and all seven performance budgets. The local server was restarted on Node 24.22.3
and readiness returned HTTP 200.

An interactive follow-up found that both signed-out shared headers linked to the
nonexistent `/auth/login` route even though the login screen is the home page.
Both links now target `/`; the focused regression test and targeted ESLint pass.
The complete `quality:verify` gate now passes with 120/120 unit tests, the 29-page
production build, all 21 API handlers and all seven performance budgets.
The corrected link was observed in the running Arabic UI. In an authenticated
document detail, a blank discount previewed as 0 MAD and a 5 MAD discount changed
the displayed total from 200 to 195 MAD. The same unsaved preview and explanatory
copy were verified in Arabic and French; the payment save action was not invoked.

Production authentication rate-limit counters now use the existing PostgreSQL
`rate_limits` table. Forwarded client IP headers are ignored until an explicit
`BETTER_AUTH_TRUSTED_PROXIES` list is supplied; every entry must be an exact IP or
valid CIDR, and Compose passes the validated proxy/origin settings to the runner.
The deployment still needs the approved edge addresses and a target-topology
`429` exercise before RC-019 can close.

The installed Better Auth context was also initialized read-only with test-only
production values. With no proxy list it resolved `enabled: true`,
`storage: database`, `headers: []` and `proxies: []`. With the documentation-only
list `127.0.0.1,10.20.0.0/24`, it enabled only `x-forwarded-for` and returned those
two validated entries unchanged. No authentication request or database write was
performed by this configuration inspection.

## Safety notes and boundary

A schema-only branch named `smoke-release-20261124-1100` was created with an
automatic 2026-11-26 expiry. Prisma correctly refused to replay the initial
migration over its copied schema. A subsequent reset attempt was stopped by
Prisma's destructive-action consent guard before any data was removed. The
branch was not used for smoke and will expire automatically.

This run proves the current local application behavior against isolated Neon,
not deployment readiness. Container deployment, persistent document-volume
backup/restore, previous-image rollback, live monitoring/alert delivery, privacy
policy approval, CNDP base-processing/foreign-transfer evidence and legal/template
approval remain separate release gates.
