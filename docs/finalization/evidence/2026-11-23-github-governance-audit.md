# GitHub Governance Audit — 2026-11-23

Repository: `Bentouhami/cyber-doc`
Local branch: `release/v1.0.0-candidate`
Local committed HEAD / remote branch head: `93b3264e46a84cd0fd3f3935d0f7d2ff3ba2fed2`

## Remote state

- GitHub authentication and read access succeeded outside the restricted sandbox.
- PR #12 is merged into `dev`; it is not an open release PR.
- The PR's final SHA was `93b3264`; its Gitleaks, dependency review, static/build,
  production-container and database/critical-E2E checks completed successfully.
- There is no open pull request for the current uncommitted working-tree changes.

## Secrets and branch protection

- Required secret names `CI_DB_PASSWORD` and `CI_BETTER_AUTH_SECRET` exist. Their
  values were not and cannot be read by the audit.
- `main` and `dev` both require strict up-to-date checks, linear history,
  conversation resolution and the five current CI contexts.
- Admin enforcement is enabled; force pushes and branch deletion are disabled.
- Both branches require zero approving reviews. On 2026-11-23, the Cyber Owner
  explicitly retained that configuration because this is a single-maintainer
  repository. The checker and guarded synchronizer now validate only the five
  required CI contexts and do not mutate review counts.

## Boundary of evidence

The green PR #12 checks prove only the historical committed SHA `93b3264`. They do
not cover the current local Next.js 16.4.6, product, data, security or operations
changes. Fresh evidence requires an authorized commit/push and a new pull request;
none was created or modified by this read-only audit.

## Quality-label guard

- `release:github-label` no longer targets historical PR #12. Without `--pr`, it
  resolves the single open pull request for the current branch.
- The check now rejects a missing or ambiguous current-branch pull request and
  rejects an explicitly selected pull request unless its state is `OPEN`.
- Verified on this branch: the implicit check exits with code 1 because no open
  pull request exists; `--pr 12` also exits with code 1 because PR #12 is merged.
- This removes the previous false-green path. No label or pull request was changed.
