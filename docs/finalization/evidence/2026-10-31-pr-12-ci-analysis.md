# 2026-10-31 — PR #12 CI Failure Analysis

PR: `https://github.com/Bentouhami/cyber-doc/pull/12`

## Authoritative state

- PR #12 is open from `release/v1.0.0-candidate` into `dev`.
- Its remote head is now release commit
  `20edaaa48c66615041a26d62fefe14b0ce6d0f19`.
- GitHub reports the PR mergeable at the Git level but blocked by policy and
  requiring review.
- Historical `quality-gates`: PASS.
- Historical `critical-smoke`: FAIL after 4m11s.
- GitGuardian and the Vercel preview status passed.
- The reviewed `quality-contract-change-approved` label is present and applied.
- The PR body now documents pnpm, the strict validation evidence and the
  remaining NO-GO conditions.
- There are no requested reviewers, completed reviews or milestone.

After a fresh fetch, `origin/dev` is an ancestor of the release head with zero
commits unique to `dev`; the release branch is eight commits ahead. `main` also
has no commit absent from the release ancestry. GitHub reports the PR mergeable,
and a merge-tree check finds no conflict. The PR can therefore be updated in
place; no replacement PR or history rewrite is required.

## Evidence limitation

GitHub no longer retains the detailed run log or artifacts for run
`23612334763`: the logs endpoint returns HTTP 410 and the artifacts endpoint
returns zero artifacts. The surviving check-run record contains two annotations:
an obsolete Node.js 20 actions warning and `Process completed with exit code 1`.
Therefore, the exact final stderr line cannot be claimed.

## Proven structural defects in the historical workflow

Inspection of `.github/workflows/frontend.yml` at the failing SHA proves that the
old `critical-smoke` job:

1. used npm and `package-lock.json` rather than the now-authoritative pnpm graph;
2. provisioned no PostgreSQL service;
3. supplied no `DATABASE_URL`, auth secret or canonical application URL;
4. ran no migrations and no seed;
5. enabled `SMOKE_ALLOW_DB_UNAVAILABLE_SKIP=1`, allowing some database failures
   to count as skipped instead of proving the application;
6. used action versions that generated a Node.js 20 deprecation warning;
7. uploaded reports only after the run, but no retained artifact now exists.

The old runner's skip detection applied only to recognized database error text
inside individual suites. Server-readiness failure or a differently worded
configuration/database failure still exited 1. Given the missing DB topology,
this is the strongest supported causal explanation, but it remains an inference
because GitHub deleted the detailed log.

## Corrections present in the reviewed working tree

The current workflow replaces that design with:

- exact pnpm/Corepack tooling and a frozen lockfile;
- a PostgreSQL 17 service with CI-only credentials;
- required-secret validation;
- Prisma client generation, migration deployment, seeding and migration-status
  verification;
- strict critical E2E with no DB-unavailable skip;
- five separately named quality/security/container/database checks;
- container builds for both `migrator` and `runner`;
- a real Chromium launch and non-empty PDF generated inside the runner image;
- always-uploaded structured smoke reports.
- Node 24-compatible action releases pinned to immutable commit SHAs, including
  checkout v7, dependency-review v5, pnpm/setup v3, Gitleaks v3 and
  upload-artifact v7.

These corrections pass locally, including 66/66 unit tests and four critical
browser suites with zero skip. They were pushed under the owner's explicit GO;
the post-push CI findings and corrections are recorded below.

After the PR analysis, the current workflow was also validated with actionlint
1.7.12. The Windows binary was downloaded from the official release, its
SHA-256 was verified as
`6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9`, and
the workflow passed with no finding. The action interfaces were checked against
their pinned official `action.yml` definitions; pnpm setup uses the exact
12.15.0 manager, Node 22.13.0 and a required lockfile.

## Conditions before rerunning PR #12

1. [x] An authorized owner provisions `CI_DB_PASSWORD` and
   `CI_BETTER_AUTH_SECRET` with new CI-only random values.
2. [x] The reviewed `quality-contract-change-approved` label is created and
   applied by an authorized maintainer.
3. [x] The release work is committed and pushed under the owner's explicit GO.
4. [ ] The new five checks run against that exact immutable SHA.
5. [x] Protected-branch contexts are reconciled to the five exact job names and
   verified through read-back.

## First post-push CI findings

The first run against `20edaaa48c66615041a26d62fefe14b0ce6d0f19`
produced two actionable configuration failures:

1. GitHub rejected the dependency-review action because the repository's
   dependency graph and vulnerability alerts were disabled. Vulnerability
   alerts were enabled by the owner-authorized release process so GitHub can
   initialize the dependency graph; the check must still pass on rerun.
2. The static job passed floor enforcement, feature documentation, both secret
   scans, lint, TypeScript, 66/66 unit tests, dependency audit, contracts and
   i18n, then failed during Next.js page-data collection because the hardened
   production auth configuration correctly rejected a missing canonical URL.
   The workflow now supplies the non-routable HTTPS origin
   `https://ci.cyberdoc.invalid` to production-build validation. The same
   environment passed the Next.js 16.4.3 build locally.

The release remains NO-GO until the rerun proves all five required checks on the
new immutable head. No merge, tag or deployment has been performed.
