---
name: asdhoconnect-architecture-guardian
description: Enforce ASDHO-CONNECT architecture rules and detect misplaced logic. Use when reviewing or implementing code that must respect the frontend and backend layer boundaries.
metadata:
  short-description: Enforce architecture boundaries and propose minimal refactors
---

# Architecture Guardian

## Scope

- Enforce frontend flow: pages/components -> frontend-services -> API routes.
- Enforce backend flow: API Platform -> backend-services -> repositories -> Doctrine.
- Ensure DTOs and Zod validation are explicit.
- Flag business logic placed in UI or controllers.

## When to use

- Pre-refactor audits or global quality reviews.
- Architecture conformance checks in frontend or backend modules.
- Folder structure, naming, and layering consistency checks.

## Workflow

1. Identify touched files and map them to layers.
2. Detect boundary violations (logic in UI, direct DB in controllers, etc.).
3. Propose minimal refactors to move logic to the correct layer.
4. If data contracts are affected, list DTO/Zod updates needed.

## Output

- Bullet list of violations with file references.
- Minimal refactor plan with file moves or new service locations.

## Do not

- Do not introduce or change business logic without explicit request.
- Do not run commands with side effects (tests, migrations, builds).
- Do not rewrite large sections; prefer minimal extraction/refactor steps.

## Safety

- Never move code across layers without preserving behavior.
- Never delete logic; refactor by extraction only.
- Never change API contracts without listing breaking impacts.

## Definition of Done

- [ ] Layering violations listed with file paths.
- [ ] Minimal refactor steps provided.
- [ ] Contract impacts identified.

## References

See `references/checklist.md`.
