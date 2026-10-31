# Branch Protection Policy (`dev` / `main`)

Date: 2026-10-31
Scope: Enforce PR-only merge and minimum quality gates.

## Required for `dev`

- Require pull request before merging.
- Require at least 1 approval.
- Dismiss stale approvals on new commits.
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
- Require at least 1 approval (recommended: 2 when available).
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
  `quality-contract-change-approved` label; removing or self-approving the guard
  is forbidden.

The label must exist at repository level and be applied to PR #12 by an
authorized maintainer only after reviewing the constraints diff. Verify both
conditions without mutation using `pnpm run release:github-label`.

## Validation Checklist

- [x] Branch rules exist in GitHub for `dev` and `main` and enforce one approval,
  admins, no force-push and no deletion. (read-only verification 2026-10-30)
- [ ] Replace obsolete required contexts `Frontend CI` and `Backend CI` on both
  branches with the five exact current job names above. The legacy backend
  workflow belongs to another project and has been removed from this repository.
  `pnpm run release:github-protection` currently reproduces 14 blocking findings
  (five missing and two obsolete contexts on each branch).
- [ ] Test direct push to protected branch is rejected.
- [ ] Test merge without approvals is rejected.
- [ ] Test merge with failing checks is rejected.

## Safe reconciliation procedure

Preview the exact before/after state. This command is read-only:

```powershell
pnpm run release:github-protection:plan
pnpm run release:github-secrets
pnpm run release:github-label
```

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
