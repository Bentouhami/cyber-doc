# Branch Protection Policy (`dev` / `main`)

Date: 2026-03-23  
Scope: Enforce PR-only merge and minimum quality gates.

## Required for `dev`

- Require pull request before merging.
- Require at least 1 approval.
- Dismiss stale approvals on new commits.
- Require conversation resolution before merge.
- Require status checks to pass:
  - frontend CI workflow (includes lint/type-check/build/critical checks).
- Do not allow force pushes.
- Do not allow branch deletion.

## Required for `main`

- Require pull request before merging.
- Require at least 1 approval (recommended: 2 when available).
- Require status checks to pass:
  - frontend CI workflow.
- Restrict who can push directly (maintainers only).
- Do not allow force pushes.
- Do not allow branch deletion.
- Prefer merge from `dev` release PR only.

## Merge Rules

- No direct commits to `dev` or `main`.
- Every production change must be traceable to a PR with:
  - updated docs/evidence,
  - green CI checks.

## Validation Checklist

- [x] Branch rules exist in GitHub for `dev`. (2026-03-23)
- [x] Branch rules exist in GitHub for `main`. (2026-03-23)
- [ ] Test direct push to protected branch is rejected.
- [ ] Test merge without approvals is rejected.
- [ ] Test merge with failing checks is rejected.
