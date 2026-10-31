# CyberDoc engineering quality process

## The delivery loop

Every change follows the same loop:

1. **Understand** — read `AGENTS.md` and follow its mandatory reading order; inspect the current Git diff before editing.
2. **Design** — identify affected contracts, permissions, personal data, migrations, abuse cases and the canonical file under `docs/features/`.
3. **Implement** — make the smallest complete change, update the feature documentation and preserve unrelated work.
4. **Verify locally** — run `pnpm run quality:fast` during development and relevant targeted tests.
5. **Verify before push** — the tracked pre-push hook runs `pnpm run quality:prepush` and blocks on any failure.
6. **Verify before merge** — GitHub CI repeats the checks from a clean install and an isolated PostgreSQL database.
7. **Review** — inspect dependency and lockfile changes, migrations, authorization, error handling, and the full diff.
8. **Adversarial review** — for money, roles, storage and multi-step state, ask
   what a validly authenticated but malicious or stale client can contradict;
   add a regression that fails before the fix.
9. **Merge and observe** — merge only required green checks; deploy through a reversible release and check runtime logs.

Install the local hook once per clone with:

```bash
pnpm run hooks:install
```

Install Gitleaks once on every developer workstation. On Windows:

```powershell
winget install --id Gitleaks.Gitleaks --exact
```

`pnpm run security:gitleaks` scans tracked working changes and every commit not yet
present on the configured upstream (falling back to `origin/main` for a new
branch). The internal `release:secret-scan` also scans
candidate untracked files. GitHub repeats the commit scan with the official
Gitleaks Action before any build or E2E job. Findings are always redacted and
must never be uploaded as build artifacts.

`--no-verify` is reserved for an operational emergency. A bypassed push must not be
merged until the normal gate passes.

Changing `CONSTRAINTS.md` is intentionally blocked by default. A deliberate
contract update must be reviewed by the code owner; locally it requires
`QUALITY_ALLOW_CONSTRAINT_CHANGE=1`, and a pull request requires the maintainer-only
label `quality-contract-change-approved`.

## One-time GitHub repository setup

Create these Actions secrets with random CI-only values:

- `CI_DB_PASSWORD`
- `CI_BETTER_AUTH_SECRET`

If the repository is transferred from a personal GitHub account to an
organization, also create `GITLEAKS_LICENSE` as required by Gitleaks Action.

Protect `main`, `dev`, and release branches. Require pull requests, one approval,
CODEOWNER review for owned files, resolved conversations, and these status checks:

- `Static, security and build gates`
- `Gitleaks secret scan`
- `Dependency review`
- `Production container targets`
- `Database and critical E2E gates`

Disable force-pushes and direct deletion of protected branches. The repository
settings are the enforcement layer; the workflow file alone cannot prevent an
administrator from merging a red pull request.

After changing workflow job names or repository rules, run
`pnpm run release:github-protection`. It is read-only and fails when `dev` or
`main` still references obsolete contexts or lacks a required protection.

## Lessons converted into rules

### Repository and tooling

- Confirm the active project path before analysis or modification.
- CyberDoc is a root-level Next.js application. Stale instructions referring to an ASDHO monorepo, Symfony backend, or `frontend/` directory are invalid.
- pnpm 12 and `pnpm-lock.yaml` are authoritative. Do not mix pnpm resolution with npm, Yarn or Bun in CI or release work.
- The quality floor blocks foreign lockfiles and a missing or incorrectly pinned pnpm configuration.
- Verify the real stable package version from the registry and consult the matching official migration guide before upgrading.

### Secret incident response

- Stop the push immediately; never copy a finding into chat, logs, issues, or reports.
- Revoke or rotate the credential first. Deleting it from the latest file does not make a committed credential safe.
- Replace local configuration with an environment-variable reference and remove the literal from the working tree.
- Determine which branches, forks, caches, releases, and CI artifacts contain it.
- Purge published history only through a separately reviewed operation; history rewriting and force-pushing require explicit authorization and team coordination.
- Do not add broad Gitleaks allowlists. A narrow fingerprint exception requires proof of a false positive, an owner, and an expiry.

### Dependency upgrades

- Direct dependencies must never use the unbounded `latest` specifier.
- `next`, `@next/env`, and `eslint-config-next` use the same exact stable
  version; the repository floor guard blocks drift between them.
- Upgrade related packages as a compatibility set: Next.js/React/types, Prisma client/CLI/adapter, Better Auth, ESLint config, and Zod consumers.
- A successful install is not evidence of compatibility. Run type-check, lint, build, audit, migrations, and authenticated E2E flows.
- Never use forced audit remediation automatically. Review the advisory, dependency path, fix version, lockfile diff, and runtime reachability.
- Remove development-only packages when they create an avoidable vulnerable transitive graph.

### Authentication and database evolution

- Authentication library upgrades can change stored-data semantics. Better Auth 1.7 credential accounts require `Account.accountId` to match the owning user ID.
- Any semantic data-model change requires both code changes and a forward migration for existing rows.
- Seed data must be idempotent and must use the same invariants as production CRUD routes.
- Compilation cannot validate authentication. Test guest, employee, and admin flows against a real database.

### Next.js and runtime behavior

- Treat generated Next.js agent rules as intentional project files; `next dev` recreates them.
- Dynamic filesystem reads need explicit output tracing so production bundles contain required assets without tracing the whole repository.
- Validate navigation through the Next router rather than browser-level assignments when the App Router owns the transition.
- React effects must not synchronously mirror derived state; derive during render or defer genuine external synchronization.

### Test infrastructure

- Focused pure-logic tests use the Node 22 test runner through the existing
  `tsx` runtime. `pnpm run test:unit` is part of `quality:fast`; the initial
  suite covers integer query-boundary parsing and user lifecycle access policy.
  This establishes a runner, not a repository-wide coverage claim.
- A test runner must wait for server readiness instead of sleeping for an assumed duration.
- Start one server per suite group, terminate the exact process tree, and always write a final machine-readable report.
- CI must provision, migrate, and seed its own database. “Database unavailable” is a failure, not an allowed skip.
- Browser binaries are explicit CI dependencies.
- The critical browser suite runs the pinned direct `@axe-core/playwright`
  dependency on every FR/AR desktop/mobile route fixture. Critical and serious
  WCAG-tagged violations fail the suite; reports retain rule metadata and CSS
  targets only, never HTML or field values.
- CI builds both production container targets. The one-shot `migrator` must
  succeed before the minimal standalone `runner` starts; the runner must never
  treat a missing migration tool as success.
- The API contract audit parses each exported mutation handler with the TypeScript
  AST and follows values derived from `request.json()` to a schema parser or an
  explicit conditional guard. A schema elsewhere in the route file is not proof
  that a handler validates its body. Passing, failing and mixed-handler fixtures
  run automatically with every `check:contracts` execution.

## Pull request review checklist

- The change has a clear user-facing purpose and no unrelated edits.
- The relevant `docs/features/*.md` file documents behavior, contracts, security, edge cases, tests and history.
- A new feature has a new indexed feature file; an expensive architectural choice has an ADR.
- New inputs are schema-validated and protected endpoints check permissions.
- Schema changes include migrations and backward/forward compatibility notes.
- New dependencies are necessary, maintained, audited, and reflected in `pnpm-lock.yaml`.
- No secrets, personal data, tokens, or password hashes appear in logs or diffs.
- Both `pnpm run release:secret-scan` and `pnpm run security:gitleaks` pass with zero findings.
- Error paths are tested; no empty catch, skipped test, or suppression hides a failure.
- French, Arabic, mobile, keyboard, PDF/download, and RTL behavior are tested when affected.
- `pnpm run quality:prepush` passes before approval.
