---
name: asdhoconnect-task-scripter
description: Generate safe PowerShell and Bash script templates for common ASDHO-CONNECT tasks like lint, tests, and migrations.
metadata:
  short-description: Safe script templates for repeatable tasks
---

# Task Scripter

## Scope

- PowerShell and Bash templates.
- Safety guards: dry-run and confirmation.
- Common tasks: dev start, lint, tests, migrations.

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
