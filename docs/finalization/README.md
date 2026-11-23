# CyberDoc Finalization Docs

This folder contains the end-to-end project health audit and finalization plan.

## Current release authority

Use these files for the current `release/v1.0.0-candidate` decision:

- `../../tasks/todo.md` — live production-readiness work and acceptance criteria;
- `rc-smoke-report.md` — latest verified technical evidence;
- `rc-open-issues.md` — current blocking conditions and risks;
- `rc-go-no-go.md` — authoritative release decision;
- `deploy-runbook.md` and `backup-restore-checklist.md` — operations procedure;
- `release-notes-v1.0.0-rc.md` — current runtime and product summary.

Files and evidence dated March 2026 are historical records. Their old npm
commands, dependency versions, result counts and GO statements describe the
state at that time and must not be reused as current instructions. CyberDoc now
uses pnpm exclusively; see the root `README.md` and `AGENTS.md`.

## Files

- `2026-03-18-project-context-and-health-audit.md`
- `2026-03-18-gap-matrix-and-enhancement-plan.md`
- `2026-03-18-finalization-checklist.md`
- `project-master-plan.md`
- `cahier-des-charges-v1.md`
- `mvp-execution-todo.md`
- `pre-feature-discovery-checklist.md`
- `feature-service-matrix.md`
- `pr-checklist.md`
- `issue-board-priority-map.md`
- `branch-protection-policy.md`
- `deploy-runbook.md`
- `environment-reference.md`
- `backup-restore-checklist.md`
- `release-notes-v1.0.0-rc.md`
- `production-release-checklist.md`
- `release-commit-freeze-checklist.md`
- `post-release-monitoring-checklist.md`
- `v1.1-backlog-prioritized.md`
- `release-closure-note-template.md`

## How to use

1. Read the health audit to understand current architecture and status.
2. Use the gap matrix to prioritize fixes by severity and impact.
3. Execute the finalization checklist phase by phase until release-ready.
4. Use `project-master-plan.md` as the live execution tracker (owner/status/due).

## Product context and historical steering docs

Use these documents for product history and the earlier baseline. Resolve any
status conflict in favor of the current release authority listed above:

- `../project-state/mission-and-product-scope.md`
- `../project-state/feature-inventory.md`
- `../project-state/current-state-audit-2026-03-19.md`
- `../project-state/recovery-plan-to-release.md`
