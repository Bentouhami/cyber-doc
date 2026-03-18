---
name: cyberdoc-nextjs-feature-scaffold
description: Scaffold a Next.js 16 fullstack feature with App Router pages, route handlers, Zod schemas, and typed service access.
metadata:
  short-description: Scaffold Next.js fullstack feature with services and Zod
---

# Next.js Feature Scaffold

## Scope

- App Router page.
- UI component(s) using existing project UI patterns.
- Feature service layer (`services/*`) for client calls.
- Route handler(s) under `app/api/**/route.ts` when backend logic is needed.
- Zod schema(s) and typed DTOs.

## Workflow

1. Identify route, feature name, and data contract.
2. Create Zod schema and inferred TypeScript types.
3. Add route handler(s) with input/output validation.
4. Add frontend service that calls route handler(s) via typed contracts.
5. Create page and component with loading/error/empty states.
6. Keep business logic in service/route layer, not UI.

## Output

- File list with paths.
- Example usage and expected data shape.

## Safety

- Never place business logic in components.
- Never bypass frontend service layer.
- Never accept or return unvalidated data.

## Definition of Done

- [ ] Zod schema and types created.
- [ ] Route handler(s) added when required by the feature.
- [ ] Frontend service added.
- [ ] Page and component created.
- [ ] Loading/error/empty states handled.

## References

See `references/scaffold-checklist.md`.
