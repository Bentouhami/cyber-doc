# RC Smoke Report

Date: 2026-10-31
Branch: `release/v1.0.0-candidate`
Scope: production-hardening baseline and critical regression suite

Canonical detailed evidence:
`docs/finalization/evidence/2026-10-31-integrated-gate.md`.

## 1) Verified Quality Gates

The following command completed successfully on Windows with Node.js 24.15.0
and pnpm 12.15.0:

```powershell
$env:QUALITY_ALLOW_CONSTRAINT_CHANGE = "1"
pnpm run quality:prepush
```

Results:

- lint, TypeScript, feature-document contract and repository floor: PASS;
- unit tests: 66/66 PASS;
- API contract self-tests: 4/4 PASS, 17/17 handlers inspected;
- FR/AR i18n audit: 486 used keys, no missing key;
- production build and seven deterministic gzip budgets: PASS;
- Prisma migration status: 11 migrations applied and schema current;
- dependency audit: no known high-severity vulnerability;
- internal secret scan and Gitleaks scan: PASS;
- critical E2E aggregate: 4/4 suites PASS, no skip.

`QUALITY_ALLOW_CONSTRAINT_CHANGE=1` is required in this working tree because the
performance limits in `CONSTRAINTS.md` were deliberately updated and measured.
It does not bypass lint, tests, dependency, secret, build, budget, migration or
browser checks.

## 2) Critical Browser Evidence

Latest generated reports under `tmp/`:

- permissions smoke: 50 PASS, 0 FAIL;
- admin smoke: 39 PASS, 0 FAIL;
- documents smoke: 31 PASS, 0 FAIL;
- UX/accessibility route checks: 32 PASS, 0 FAIL;
- Axe serious/critical violations: 0 across the tested FR/AR desktop/mobile matrix;
- horizontal overflow failures: 0.

The reports intentionally avoid storing secrets, form values and personal data.

## 3) Runtime and Deployment Evidence

- `pnpm install --frozen-lockfile --ignore-scripts`: PASS.
- Next.js standalone production server: root and a generated static CSS asset
  returned HTTP 200 after a production build.
- Compose configuration defines separate one-shot migration and minimal runtime
  services, health checks, required secrets and non-public database networking.
- Container image build: **not yet proven** because Docker is unavailable in the
  local verification environment. CI builds the `migrator` and `runner` targets
  and now launches Chromium inside the built runner to create a real PDF; that
  exact-revision job still needs to be observed green.
- Backup/restore exercise and deployed-environment post-deploy smoke: **pending**.

## 4) Current Release Assessment

The locally executable engineering gates are green, but this is not sufficient
for a production GO. Release remains conditional on:

1. a green container-build CI job;
2. a witnessed database backup/restore and rollback exercise;
3. product/legal decisions for PII and activity-log retention/export/deletion;
4. target configuration validation, including trusted origins, durable storage
   and an active printer where printing is enabled;
5. named product, QA, security/privacy and operations sign-off.
