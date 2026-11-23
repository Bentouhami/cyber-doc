# 2026-10-31 — GitHub Governance Audit

## Scope

Read-only verification of the release PR, its current revision/checks, and the
protection rules applied to `dev` and `main` in `Bentouhami/cyber-doc`.

## Observed state

- Local branch: `release/v1.0.0-candidate`.
- Local HEAD: `369de8086fe9fd910571e3c9c3e1d560ecab34e1`.
- Open PR: #12, release branch into `dev`.
- PR head: the same historical commit above; the reviewed working-tree changes
  are not committed or pushed.
- PR merge state: blocked and review required.
- Latest historical `critical-smoke` check: failed on 2026-03-26.
- Both protected branches still require `Frontend CI` and `Backend CI`.
- The current workflow instead exposes five named checks, producing 14 policy
  mismatches across the two branches.
- The Actions secrets inventory contains neither `CI_DB_PASSWORD` nor
  `CI_BETTER_AUTH_SECRET`; values were not and cannot be read by the audit.
- The repository and PR #12 both lack the maintainer-only
  `quality-contract-change-approved` label required for the reviewed constraints
  change.

## Reproducible checks

```powershell
gh repo view --json nameWithOwner,defaultBranchRef,url
gh pr view 12 --json headRefOid,mergeStateStatus,reviewDecision,statusCheckRollup
pnpm run release:github-protection
pnpm run release:github-protection:plan
pnpm run release:github-secrets
```

The check command fails closed until the policy is corrected. The plan command
is read-only and printed this replacement for both branches:

- before: `Frontend CI`, `Backend CI`;
- after: `Static, security and build gates`, `Gitleaks secret scan`,
  `Dependency review`, `Production container targets`, and
  `Database and critical E2E gates`.

## Safe remediation prepared

`scripts/release/github-protection-sync.mjs` performs a dry run by default. Its
write mode requires all of the following:

1. the `--apply` argument;
2. an explicit `--repository owner/name` matching the current repository;
3. `CYBERDOC_GITHUB_PROTECTION_APPLY=I_UNDERSTAND`;
4. successful read-back verification after every updated branch.

The refusal path was tested: `--apply` without the repository identity exited
non-zero before any GitHub write. No protection rule was changed during this
audit. Application remains reserved for an explicitly authorized repository
owner.

The secret-name audit also fails closed until both CI-only secrets are created.
Production database or authentication credentials must never be reused for this
purpose.

The prepared `github-ci-secret-sync.mjs` procedure is dry-run-first and
preserves existing values unless rotation is separately requested. Its write
mode requires an exact repository identity and explicit environment confirmation;
generated values travel through process standard input and are never logged.

## Authorized remediation

On 2026-10-31, after explicit owner GO:

- new random CI-only values were generated and sent through standard input for
  `CI_DB_PASSWORD` and `CI_BETTER_AUTH_SECRET`; values were never printed and
  the name-only audit confirms both exist;
- the `quality-contract-change-approved` label was created with a maintainer-
  approval description and applied to PR #12 after reviewing the constraint and
  performance-budget contract;
- `dev` and `main` required contexts were replaced with the five current job
  names while preserving the other protection settings;
- read-back checks confirm both branches enforce all five contexts and the label
  and secret-name audits pass.

No commit, push, merge, tag or deployment was performed during these settings
changes. Exact-revision CI evidence remains pending until the release commit is
pushed.
