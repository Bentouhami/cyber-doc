# CyberDoc Frontend Tokens and Components

## Tokens and Theme

- Global tokens and Tailwind layers: `app/globals.css`
- Tailwind config (if needed): `tailwind.config.ts`
- Design tokens: prefer `bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `bg-muted`.

## UI Foundations (shadcn/ui)

- UI primitives: `components/ui/*`
- Dialogs, inputs, selects, buttons: reuse existing shadcn components first.
- Utility helper: `lib/utils` (`cn` class helper)

## Shared Layout and UX

- Page header: `components/shared/page-header.tsx`
- Page skeleton/loading: `components/shared/page-skeleton.tsx`
- Sidebar shell: `components/ui/sidebar.tsx`

## Feature Examples

- Feature UI components: `components/*`
- Services and DTOs: `services/*`, `types/*`, `mappers/*`

## Data and Validation Patterns

- API client: `lib/*` or `services/*`
- Zod schemas and types: `types/*`, `mappers/*`, feature-local schemas
- React Query usage: `hooks/*` (if used in the project)

## Styling and Icons

- Icons: `lucide-react`
- Toasts: `sonner` with `components/ui/sonner.tsx` if present

## Notes

- Keep page components under 150-200 lines; move logic to hooks and UI to components.
- Prefer existing patterns from nearby routes before introducing new layout structures.
