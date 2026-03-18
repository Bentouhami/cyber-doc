# ASDHO Frontend Tokens and Components

## Tokens and Theme

- Global tokens and Tailwind layers: `frontend/app/globals.css`
- Tailwind config (if needed): `frontend/tailwind.config.ts`
- Design tokens: prefer `bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `bg-muted`.

## UI Foundations (shadcn/ui)

- UI primitives: `frontend/components/ui/*`
- Dialogs, inputs, selects, buttons: reuse existing shadcn components first.
- Utility helper: `frontend/lib/utils` (`cn` class helper)

## Shared Layout and UX

- Page header: `frontend/components/shared/page-header.tsx`
- Page skeleton/loading: `frontend/components/shared/page-skeleton.tsx`
- Sidebar shell: `frontend/components/ui/sidebar.tsx`

## Orders Module Examples

- Orders UI components: `frontend/components/orders/*`
- Orders routes map: `frontend/lib/routes/orders.ts`
- Orders services and DTOs: `frontend/services/orders.ts`

## Data and Validation Patterns

- API client: `frontend/lib/api/client.ts`
- Zod schemas and types: `frontend/types/*` and `frontend/lib/api/*`
- React Query usage: `frontend/hooks/*` (examples: `use-user.tsx`, `use-pagination-setting.ts`)

## Styling and Icons

- Icons: `lucide-react`
- Toasts: `sonner` with `frontend/components/ui/sonner.tsx` if present

## Notes

- Keep page components under 150-200 lines; move logic to hooks and UI to components.
- Prefer existing patterns from nearby routes before introducing new layout structures.
