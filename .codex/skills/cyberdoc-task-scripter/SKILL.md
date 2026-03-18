---
name: cyberdoc-task-scripter
description: Generate safe PowerShell and Bash script templates for common CyberDoc tasks (lint, tests, build, Prisma migrations).
metadata:
  short-description: Safe script templates for repeatable tasks
---

# Task Scripter

## Scope

- PowerShell and Bash templates.
- Safety guards: dry-run and confirmation.
- Common tasks: dev start, lint, tests, build, Prisma migrations.

## Workflow

1. Identify the task and target module.
2. Generate scripts with safe defaults.
3. Add prompts for confirmation on risky operations.
4. Provide usage examples.

## Output

- Script templates with comments.
- Usage instructions.

## Safety

- Never run destructive commands by default.
- Always include a confirmation step.
- Prefer dry-run modes when possible.

## Definition of Done

- [ ] Scripts include safety guardrails.
- [ ] Both PowerShell and Bash versions provided.
- [ ] Usage examples included.

## References

See `references/task-list.md`.
For issue+codebase implementation audits, use:
`../cyberdoc-task-delivery-pipeline/scripts/generate_task_analysis_report.py`.
