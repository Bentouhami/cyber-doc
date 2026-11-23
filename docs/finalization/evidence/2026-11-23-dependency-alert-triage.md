# Dependency Alert Triage

Date: 2026-11-23
Release revision: `90cb595d6810519313e5c5fdf9105e78136e6950`

## Result

The release candidate has no known production dependency vulnerability according
to the committed pnpm lockfile:

- `pnpm audit --prod --audit-level high`: **no known vulnerabilities**;
- direct runtime versions: Next.js `16.4.6`, Zod `4.6.7`;
- PR #13 dependency review: **pass**;
- PR #13 static/security/build gates: **pass**.

GitHub reported 115 open Dependabot alerts on the default `dev` branch at the
time of this check: 8 critical, 56 high, 47 medium and 4 low. Their manifests
still describe the historical Next.js 15 dependency graph; representative fixed
versions are older than the candidate's Next.js 16.4.6. These alerts therefore
do not contradict the candidate lockfile audit.

No alert was dismissed or waived. Dependabot evaluates the default branch, so the
open-alert count must be checked again after the reviewed candidate is merged into
`dev`; only GitHub's subsequent default-branch analysis can prove that the stale
alerts have closed.
