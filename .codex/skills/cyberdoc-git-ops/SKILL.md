---
name: cyberdoc-git-ops
description: Execute safe Git operations for CyberDoc using a minimal, non-destructive workflow.
metadata:
  short-description: Safe Git branch/split/cleanup workflow wrapper
---

# Purpose

Apply a strict Git workflow that prioritizes safety, small scope, and traceable delivery.

## When to use

- Branch splitting, cleanup, backup, or PR prep.
- Any task that needs disciplined branch hygiene and scoped commits.

## Workflow (concise)

1) Read the reference guide.
2) Verify repo hooks setup (`core.hooksPath` + `.githooks`) before running Git ops.
3) Follow the step order exactly.
4) Avoid destructive commands unless explicitly requested.
5) Keep output minimal (file paths + one-line purpose only).
6) Bash quoting: wrap paths containing parentheses or wildcards in single quotes (e.g. `'app/(inventory)/...'`, `'components/inventory-ui/materials/*'`) to avoid shell expansion errors.

## References

See `references/workflow-summary.md`.
For structured task audit output (scope + evidence + verdict), use:
`.codex/skills/cyberdoc-task-delivery-pipeline/scripts/generate_task_analysis_report.py`.

## Output policy

Do not echo file contents unless explicitly requested.

## Definition of Done

- [ ] Workflow steps followed in order.
- [ ] No destructive commands run without explicit approval.
- [ ] Output stays minimal.
