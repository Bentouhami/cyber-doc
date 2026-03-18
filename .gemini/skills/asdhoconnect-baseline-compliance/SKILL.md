---
name: asdhoconnect-baseline-compliance
description: Final compliance gate against ASDHO-CONNECT baseline before declaring work done.
metadata:
  short-description: Final baseline compliance checklist and report
---

# Baseline Compliance Gate

## Purpose

Validate compliance with the ASDHO-CONNECT baseline before declaring a task complete.

## When to use

- End of any task that touches code, config, docs, scripts, CI, or security.

## Inputs

- Recent changes
- Affected modules
- Files touched

## Workflow

1. Determine scope of changes (frontend/backend/docs/scripts/CI).
2. Architecture checks (no business logic in UI, flows respected).
3. Security checks (API Platform security rules, least privilege, no sensitive output).
4. Data contract checks (DTOs explicit, Zod alignment, types/enums/nullability).
5. Documentation checks (updated under /Documentation, PlantUML updated if needed).
6. Scripting checks (PowerShell + Bash, safe-by-default) if scripts affected.
7. CI checks (lint/typecheck/tests status, known failures acknowledged).
8. Output policy check (silent writer rules).
9. Produce a final compliance report and required fixes if any.

## Output format

- Checklist with ✅/❌ per category.
- If any ❌: list exact actions required to reach compliance.
- If all ✅: declare “COMPLIANT — READY TO MERGE/SHIP”.

## Do not

- Do not skip any category when relevant files were touched.
- Do not mark compliant if required follow-ups are missing.
- Do not include secrets or tokens in output.

## Definition of Done

- All categories pass OR explicit follow-up tasks are created and tracked.

## References

See `references/baseline-checklist.md` and `references/end-of-task-workflow.md`.
