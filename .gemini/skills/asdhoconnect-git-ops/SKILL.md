---
name: asdhoconnect-git-ops
description: Execute ASDHO-CONNECT Git operations using the repository’s approved workflow.
metadata:
  short-description: Git split/cleanup workflow wrapper
---

# Purpose

Wrap the approved Git workflow from the existing prompt and enforce minimal, safe execution.

## When to use

- Branch splitting, cleanup, backup, or PR prep.
- Any task that references the ASDHO Git workflow.

## Workflow (concise)

1) Read the reference guide.
2) Follow the step order exactly.
3) Avoid destructive commands unless explicitly requested.
4) Keep output minimal (file paths + one-line purpose only).

## References

See `references/workflow-summary.md` and `.codex\prompts\_archived\asdho_git_split.md`.

## Output policy

Do not echo file contents unless explicitly requested.

## Definition of Done

- [ ] Workflow steps followed in order.
- [ ] No destructive commands run without explicit approval.
- [ ] Output stays minimal.
