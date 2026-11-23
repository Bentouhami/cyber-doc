# GitHub Governance Audit — 2026-11-23

Repository: `Bentouhami/cyber-doc`
Local branch: `release/v1.0.0-candidate`
Audited release head: `7b94375959b5221fda4fc261ddbcad3f25fefc3f`

## Remote state

- GitHub authentication and read access succeeded outside the restricted sandbox.
- PR #13 is open from `release/v1.0.0-candidate` to `dev`, mergeable and carries
  the `quality-contract-change-approved` label.
- Its Gitleaks, dependency review, static/build, production-container and
  database/critical-E2E checks completed successfully on the audited release head.
- Vercel preview and GitGuardian checks also completed successfully.

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

PR run `45204065750` and push run `45204054894` cover the audited Next.js 16.4.6
release head. They prove the repository CI boundary, not target deployment,
durable storage, backup/restore, monitoring or organizational approval.

## Quality-label guard

- `release:github-label` no longer targets historical PR #12. Without `--pr`, it
  resolves the single open pull request for the current branch.
- The check now rejects a missing or ambiguous current-branch pull request and
  rejects an explicitly selected pull request unless its state is `OPEN`.
- Verified for PR #13: the current open PR and approval label resolve correctly;
  an explicitly selected merged PR remains rejected.
- This removes the previous false-green path without requiring human approvals in
  the Cyber Owner's single-maintainer workflow.
