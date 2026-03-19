---
name: cyberdoc-task-delivery-pipeline
description: Run a strict end-to-end task delivery pipeline from qualification to merge and closure for CyberDoc (issue tracker agnostic, Jira optional).
metadata:
  short-description: Qualification to merge execution pipeline
---

# Purpose

Provide one repeatable delivery pipeline for implementation tasks so work stays auditable, safe, and merge-ready.

This skill is architecture-first and delivery-rigorous:
- Use `senior-architect` reasoning for boundaries, contracts, and trade-offs.
- Use `senior-devops` reasoning for CI parity and release safety.

# When to use

- At the start of any issue/task/subtask.
- Before branch creation and implementation.
- During delivery prep (tests, docs, PR, merge, tracker updates).
- When analyzing a parent task and subtasks to determine done vs missing work.

# Mandatory inputs

- Issue identifier (Jira key, GitHub issue, or internal task id).
- Target module/feature area.
- Task type (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`).

# Pipeline

1) Qualification gate
- Confirm issue exists and scope is explicit.
- Confirm parent/dependency chain when applicable.
- Verify blockers are resolved before coding.

2) Architecture and scope framing
- Identify impacted layers/files (UI, route handlers, services, Prisma, docs, CI).
- List invariants and risk points (auth, contracts, migrations, side effects).
- Define in-scope and out-of-scope.

3) Branch and workspace gate
- Start from latest `dev` (or project integration branch).
- Create scoped branch with consistent naming.
- Detect and isolate unrelated local changes safely.

4) Implementation plan
- Define concrete, short steps: code, tests, hardening, docs, manual checks.

5) Implementation
- Apply minimal changes that satisfy acceptance criteria.
- Keep business logic out of UI components.

6) Test strategy and execution
- Add/update targeted tests, then run broader checks.
- Keep local checks aligned with CI expectations.

7) Hardening checklist
- Input validation and error handling.
- Auth/permission checks where required.
- Contract integrity (Zod/types/DTO/route payloads).
- Data safety when schema or migrations change.

8) Manual validation
- Provide scenario list with expected visible outcomes.
- Include negative/error paths.

9) Documentation updates
- Update canonical docs under `/docs`.
- Record behavior, contracts, and validation strategy.
- Keep traceability to issue id.

10) Delivery prep
- Stage only related files.
- Write clear commit messages with issue linkage when applicable.
- Prepare PR title/description and merge notes.

11) Closure
- Merge only after checks pass.
- Update task/issue status to done.
- Return to integration branch and confirm clean status.

# Output contract

For each task, output these sections:
- `Scope Tree`
- `Implementation Plan`
- `Test Plan (Auto + Manual)`
- `Documentation Impact`
- `Git Commands`
- `PR Package`
- `Issue Tracker Actions`
- `Task Done Recap`

`Task Done Recap` must include:
- `Need`
- `Issue`
- `Goal`
- `Solution`
- `Important`
- `Priority` (`P1`/`P2`/`P3`)

# Guardrails

- Never create a task branch from another task branch.
- Never close an issue without merged code + passing checks + updated docs.
- Never skip manual scenarios for user-visible behavior changes.
- Never run destructive commands unless explicitly requested.
- Keep tracker-specific commands optional; if Jira is used, use `atlassian-acli-jira`.

# References

- `.codex/skills/cyberdoc-git-ops/SKILL.md`
- `references/pipeline-checklist.md`
- `references/quick-commands.md`
- `references/skill-starter-map.md`

# Bundled resources

- `scripts/generate_task_kickoff.py`
- `scripts/generate_pr_merge_package.py`
- `scripts/generate_git_commands.py`
- `scripts/generate_task_analysis_report.py`
- `scripts/detect_task_overlap.py`

Legacy optional (Jira-focused):
- `scripts/run_task_pipeline.ps1`
- `scripts/generate_jira_transition_commands.py`
- `scripts/generate_jira_description.py`

# Definition of Done

- [ ] Issue qualified and dependencies clear.
- [ ] Branch created from integration branch with clean scope.
- [ ] Implementation complete with hardening checks.
- [ ] Tests added/updated and passing.
- [ ] Manual validation scenarios executed/reviewed.
- [ ] Documentation updated under `/docs`.
- [ ] PR prepared and merged.
- [ ] Issue moved to `Done/Closed`.
- [ ] `Task Done Recap` delivered.
