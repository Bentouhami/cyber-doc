---
name: nextjs-frontend-excellence
description: Create or refactor ASDHO-CONNECT Next.js 16 App Router frontend pages/components with shadcn/ui, Tailwind CSS v4, Zod validation, strict TypeScript, and distinctive professional UI/UX. Use for feature/page/component UI work, refactors, performance/accessibility improvements, or design upgrades in ASDHO-CONNECT frontend.
---

# Next.js Frontend Excellence (ASDHO-CONNECT)

## Scope

- Build or refactor pages, layouts, and components in `frontend/app` and `frontend/components`.
- Apply ASDHO-CONNECT UI patterns, strict TypeScript, Zod validation, and shadcn/ui composition.
- Improve UX, performance, and accessibility while keeping code modular and testable.

## Workflow

1. Inspect existing patterns in nearby pages/components before inventing new UI.
2. Decide Server vs Client components. Default to Server Components, add `use client` only when needed.
3. Use Zod as source of truth for validation and types. No `any` types.
4. Extract reusable components/hooks/utils for large files; keep pages as orchestration layers.
5. Add `loading.tsx` and `error.tsx` for async views and robust error states.
6. Optimize performance with memoization, code-splitting, and light client bundles.
7. Validate accessibility (semantic tags, aria labels, focus states, keyboard flow).

## ASDHO-CONNECT Conventions

- Use `PageHeader`, `PageSkeleton`, and existing UI patterns before creating new ones.
- Prefer design tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `bg-muted`.
- Use `cn` helper for conditional classes and `lucide-react` icons.
- Use `sonner` for toasts and `ApiError` for API failures.
- Prefer TanStack Query for client-side fetching and caching.
- Use existing routes from `frontend/lib/routes/*` when linking.
- Keep file size under 300 lines and split responsibilities by component/hook.

## References

- Tokens and components map: `references/asdho-frontend-tokens-components.md`

## UI/UX Direction

- Respect existing design system and layout patterns. Do not introduce a new theme unless requested.
- Avoid default-looking layouts; keep typography, spacing, and hierarchy intentional.
- Avoid generic purple-on-white defaults and Inter/Roboto unless already in use.
- If new typography is needed, add fonts via `next/font` and wire tokens in `globals.css`.
- Use consistent spacing scale (4, 6, 8, 12, 16) and touch-friendly targets.
- Provide clear empty, loading, and error states with helpful actions.

## Performance and Quality

- Use dynamic imports for heavy dialogs/modals.
- Use `useMemo`/`useCallback` for expensive calculations and stable handlers.
- Keep client bundle small: avoid wide imports, prefer named imports.
- Use `date-fns` for date formatting (French locale when needed).

## Security and Validation

- Validate all external data and form inputs with Zod.
- Never use `dangerouslySetInnerHTML`.
- Sanitize user-provided strings before rendering if needed.

## Output Checklist

- [ ] Strict TypeScript, no `any`.
- [ ] Zod schemas for inputs and API payloads.
- [ ] `loading.tsx` and `error.tsx` where applicable.
- [ ] Accessibility verified (semantic tags, aria labels, focus).
- [ ] Consistent UI with ASDHO-CONNECT components and tokens.
- [ ] Code split and refactored for maintainability.
