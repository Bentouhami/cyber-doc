---
name: asdhoconnect-nextjs-feature-scaffold
description: Scaffold a Next.js 16 feature with pages, components, frontend services, and Zod DTOs following ASDHO-CONNECT conventions. Use when starting a new frontend feature.
metadata:
  short-description: Scaffold Next.js feature with services and Zod DTOs
---

# Next.js Feature Scaffold

## Scope

- App Router page.
- UI component using shadcn/ui.
- Frontend service layer.
- Zod DTO and typed API calls.

## Workflow

1. Identify route, feature name, and data contract.
2. Create Zod schema and TypeScript types.
3. Add frontend service that calls API routes.
4. Create page and component with loading/error states.
5. Wire data flow without business logic in UI.

## Output

- File list with paths.
- Example usage and expected data shape.

## Safety

- Never place business logic in components.
- Never bypass frontend service layer.
- Never return unvalidated data to UI.

## Definition of Done

- [ ] Zod schema and types created.
- [ ] Frontend service added.
- [ ] Page and component created.
- [ ] Loading/error states handled.

## References

See `references/scaffold-checklist.md`.
