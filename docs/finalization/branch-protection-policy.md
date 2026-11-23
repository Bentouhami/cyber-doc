# Branch Protection Policy (`dev` / `main`)

Date: 2026-11-23
Scope: Enforce PR-only merge and automated quality gates for a single maintainer.

## Required for `dev`

- Require pull request before merging.
- Do not require another approving reviewer while the Cyber Owner is the sole maintainer.
- Require conversation resolution before merge.
- Require status checks to pass:
  - `Static, security and build gates`
  - `Gitleaks secret scan`
  - `Dependency review`
  - `Production container targets`
  - `Database and critical E2E gates`
- Do not allow force pushes.
- Do not allow branch deletion.

## Required for `main`

- Require pull request before merging.
- Do not require another approving reviewer while the Cyber Owner is the sole maintainer.
- Require status checks to pass:
  - the same five checks required for `dev`.
- Restrict who can push directly (maintainers only).
- Do not allow force pushes.
- Do not allow branch deletion.
- Prefer merge from `dev` release PR only.

## Merge Rules

- No direct commits to `dev` or `main`.
- Every production change must be traceable to a PR with:
  - updated docs/evidence,
  - green CI checks.
- A reviewed `CONSTRAINTS.md` change requires the maintainer-only
  `quality-contract-change-approved` label as an explicit owner decision record.

The label must exist at repository level and be applied to any release PR that
changes `CONSTRAINTS.md`, by an authorized maintainer only after reviewing that
diff. Verify both conditions without mutation using `pnpm run release:github-label`.

## Validation Checklist

- [x] Branch rules exist for `dev` and `main`; admins are enforced, strict checks,
  linear history and conversation resolution are required, and force-push/deletion
  are disabled. (read-only verification 2026-11-23)
- [x] Both branches require the five exact current job names above; no obsolete
  `Frontend CI` or `Backend CI` context remains.
- [x] Required CI secret names `CI_DB_PASSWORD` and `CI_BETTER_AUTH_SECRET` exist;
  values were not read.
- [x] `required_approving_review_count` remains `0` by explicit Cyber Owner decision
  on 2026-11-23 because this is a single-maintainer repository. The protection
  checker and synchronizer validate only the five required CI contexts.
- [ ] Test direct push to protected branch is rejected.
- [ ] Test merge with failing checks is rejected.

## Safe reconciliation procedure

Preview the exact before/after state. This command is read-only:

```powershell
pnpm run release:github-protection:plan
pnpm run release:github-secrets
pnpm run release:github-label
```

The label check resolves the pull request for the current branch and fails when
there is no matching PR. To audit a specific pull request explicitly, run
`pnpm run release:github-label -- --pr <number>`; no historical PR is hard-coded.

An authorized repository owner may then apply the plan. The command requires
both the exact repository identity and an explicit environment confirmation, and
it reads the protection state back after each change:

```powershell
$env:CYBERDOC_GITHUB_PROTECTION_APPLY = "I_UNDERSTAND"
pnpm run release:github-protection:apply -- --repository Bentouhami/cyber-doc
Remove-Item Env:CYBERDOC_GITHUB_PROTECTION_APPLY
pnpm run release:github-protection
```

Do not run the apply command from an untrusted checkout or with a repository name
that has not been independently verified using `gh repo view`.

The strict database/browser job also requires repository Actions secrets named
`CI_DB_PASSWORD` and `CI_BETTER_AUTH_SECRET`. The read-only secret audit checks
only whether those names exist; GitHub never returns their values. An authorized
owner must provision independent, randomly generated CI-only values before the
release revision is pushed. Production credentials are forbidden in CI.

Preview the secret-name changes without generating or sending any value:

```powershell
pnpm run release:github-secrets:plan
```

After explicit owner authorization, create only missing values with the guarded
command below. It uses the operating system cryptographic generator, produces
URL-safe values, sends them to `gh` through standard input instead of process
arguments, never prints them, and verifies only the resulting names:

```powershell
$env:CYBERDOC_GITHUB_SECRET_APPLY = "I_UNDERSTAND"
pnpm run release:github-secrets:apply -- --repository Bentouhami/cyber-doc
Remove-Item Env:CYBERDOC_GITHUB_SECRET_APPLY
pnpm run release:github-secrets
```

Existing values are preserved. Rotation additionally requires `--rotate` and must
follow the incident/change-management procedure.
