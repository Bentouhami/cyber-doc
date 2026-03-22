# Issue Board Priority Map (MVP Release)

Date: 2026-03-23  
Scope: Operational issue board alignment for release and immediate post-release.

## Priority Definitions

- `Blocker`: Prevents safe release or breaks core service for users.
- `Major`: Does not block release but significantly degrades operations.
- `Minor`: Improvement or low-risk follow-up.

## Active Board

| ID | Title | Priority | Type | Source | Owner | Status | Next Action |
|---|---|---|---|---|---|---|---|
| OPS-001 | Enforce PR-only merges on `dev` and `main` | Blocker | Process | `project-master-plan:P1-4` | Bentouhami/Codex | DONE | Branch protection applied via GitHub API on 2026-03-23 |
| OPS-002 | Execute release merge + tag `v1.0.0` | Blocker | Release | `project-master-plan:P8-1` | Bentouhami | IN_PROGRESS | Commit freeze checklist/audit prepared; waiting frozen candidate set |
| OPS-003 | Production migrate + post-deploy smoke | Blocker | Release | `project-master-plan:P8-2` | Bentouhami | TODO | Execute deploy runbook + smoke |
| OPS-004 | 24-48h production monitoring | Major | Ops | `project-master-plan:P8-3` | Bentouhami | TODO | Run monitoring checklist and record evidence |
| OPS-005 | Archive release evidence and closure note | Major | Release | `project-master-plan:P9-1` | Bentouhami/Codex | TODO | Publish closure evidence doc |
| OPS-006 | Build v1.1 prioritized backlog | Minor | Product | `project-master-plan:P9-2` | Bentouhami/Codex | TODO | Promote non-MVP items with impact estimates |

## Resolved From RC

- `RC-001` auth/session instability -> resolved.
- `RC-002` route protection gaps -> resolved.
- `RC-004` UX simplification gaps -> resolved.
- `RC-005` security headers -> resolved.
- `RC-006` regression safety depth -> mitigated with critical runner + CI.

## Board Cadence

- Update this file in every release/ops PR.
- Re-triage open items daily until `OPS-003` and `OPS-004` are complete.
