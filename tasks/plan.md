# Implementation Plan: CyberDoc Production Readiness

## Overview

Bring the documented CyberDoc v1 scope to a production-ready state without
inventing unapproved product behavior. Completion means every capability in
`docs/features/README.md` is either complete with evidence or explicitly removed
from the release scope by a reviewed decision. Security, performance,
accessibility, operations and tests are deliverables, not follow-up work.

## Team and ownership

| Role                     | Responsibility                                         | Required evidence                                     |
| ------------------------ | ------------------------------------------------------ | ----------------------------------------------------- |
| Integration lead         | Architecture, task ordering, cross-cutting review      | Green quality gates and reviewed diff                 |
| Security lead            | Threat model, authz, validation, secrets, supply chain | Abuse-case tests and zero blocking findings           |
| Performance lead         | Repeatable baselines, bottleneck analysis, budgets     | Before/after measurements or documented baseline      |
| QA and architecture lead | Capability matrix, test gaps, maintainability          | Automated behavior evidence and architecture findings |

All contributors follow `AGENTS.md`, preserve unrelated work, use pnpm only,
update canonical feature documentation with behavior changes, and do not commit
or push without explicit authorization.

## Architecture decisions

- Treat the existing documented v1 feature catalogue as the product scope. New
  product features require a separate specification.
- Deliver vertical, independently verifiable slices; do not combine dependency
  upgrades, refactors and behavior changes into one change.
- Measure performance before optimizing. Revert experiments that do not beat
  measurement noise.
- Fix authorization and validation at the API boundary, never only in the UI.
- Add tests around existing behavior before high-risk refactors.

## Dependency graph

```text
Baseline and capability audit
├── Security threat model ──> blocking security fixes ──> security regression tests
├── Performance baseline ──> measured fixes ──> performance budget
├── Test inventory ──> unit/integration foundation ──> coverage policy
└── Product gaps ──> activity audit completion ──> release documentation
                                      └──────────────> final production gate
```

## Task list

The executable checklist is maintained in `tasks/todo.md`.

### Phase 1: Evidence and blocking risks

- Audit the documented product surface against routes, schema, permissions and tests.
- Produce a lightweight STRIDE threat model and fix proven critical/high issues.
- Establish repeatable frontend, API and database performance baselines.
- Record architecture hotspots and split only when a tested slice requires it.

### Checkpoint: Blocking risks

- No unresolved critical/high security finding.
- Baselines are reproducible and stored without secrets or personal data.
- `pnpm run quality:fast` remains green.

### Phase 2: Test and product completeness

- Extend the focused Node test foundation from query parsing and user access
  policy to additional high-risk pure logic and API boundaries as those slices
  are implemented. Repository-wide coverage is not yet measured.
- Complete the documented activity-audit capability or explicitly rescope it through an ADR.
- Add automated accessibility checks for critical routes.
- Close verified contract, i18n, mobile and error-path gaps.

### Checkpoint: Product candidate

- Every catalogue capability has automated evidence and canonical documentation.
- No skipped critical test and no undocumented release exception.
- Production build and database migration checks pass.

### Phase 3: Performance and operational hardening

- Implement only optimizations supported by before/after data.
- Define stable budgets for bundle size and critical user journeys.
- Verify security headers, deployment configuration, backup/restore and rollback.
- Add privacy/retention and operational ownership where personal data is stored.

### Checkpoint: Release ready

- `pnpm run quality:prepush` passes from a clean, frozen install.
- Performance budgets pass under documented conditions.
- Release, rollback and post-deploy checks have current evidence.
- A five-axis independent review has no unresolved blocking finding.

## Risks and mitigations

| Risk                                    | Impact | Mitigation                                                                             |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Large dirty working tree mixes concerns | High   | Preserve existing changes; keep each new slice small and report touched files          |
| Undefined meaning of “complete”         | High   | Use the canonical v1 catalogue; require specs for net-new behavior                     |
| Optimizing without production traffic   | Medium | Start with reproducible synthetic/API baselines and do not claim RUM results           |
| Security changes alter auth behavior    | High   | Add abuse-case regression tests and run real-database E2E                              |
| Very large UI/API files                 | Medium | Extract only behind existing behavior tests, one bounded slice at a time               |
| Local Docker unavailable                | Medium | Validate configuration statically now and require CI/container evidence before release |

## Open questions

- Production hosting, public domain, traffic expectations and observability provider
  are not yet documented; deployment-specific SLO and RUM work depends on them.
- Legal retention periods and the owner of privacy requests require a product/legal
  decision before automated retention or deletion behavior can be finalized.
