---
name: nextjs-16-best-practices
description: Apply Next.js 16.0.10 best practices for performance, security, DTOs/mappers, Zod validation, and Prisma usage. Use when asked to review, harden, or standardize a Next.js 16 codebase.
---

# Next.js 16 Best Practices

## Triggering phrases

- "Review Next.js 16 performance and security"
- "Harden a Next.js 16 app"
- "Standardize DTOs and mappers"
- "Add Zod validation and Prisma best practices"

## Scope

- Next.js 16 App Router performance and security
- DTO and mapper patterns to isolate DB models
- Zod schema validation for inputs and DTOs
- Prisma usage best practices

## Workflow

1. Confirm the target app uses Next.js 16.0.10 and App Router.
2. Run a quick architecture pass:
   - Identify server vs client components.
   - Identify data access boundaries and API routes.
   - Identify DTO and mapper usage.
3. Apply the checklists below and report concrete fixes with file paths.

## Performance checklist

- Prefer Server Components for data fetching; avoid client fetch when possible.
- Use `next/font` for fonts and avoid external font loading.
- Avoid large client bundles; split heavy components with dynamic imports.
- Use `useReportWebVitals` for real-user metrics when needed.
- Avoid blocking work in route handlers; keep responses small and paginated.

## Security checklist

- Add security headers in `next.config.*`: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- Require authentication and role checks for all protected routes and actions.
- Use `proxy.ts` for request interception (rename `middleware.ts` if present).
- Validate all inputs in API routes and server actions.
- Do not expose secrets to client bundles; only use `NEXT_PUBLIC_*` for safe values.

## DTO and mapper checklist

- Create DTO types for API outputs and inputs.
- Map Prisma models to DTOs (avoid leaking internal fields).
- Keep mapping logic in `mappers/` or `services/`.
- Use DTOs in route responses for stable API contracts.

## Zod validation checklist

- Define Zod schemas for request bodies and query params.
- Use `.safeParse()` to return structured errors.
- Use enums for constrained strings; use `.refine()` for custom rules.
- Do not pass unvalidated input to Prisma queries.

## Prisma checklist

- Use a service layer; avoid Prisma calls directly in UI components.
- Select only fields needed to reduce response size.
- Keep transactions short and avoid network calls inside them.
- Use least-privilege database credentials for runtime.

## Scripts

- Run `scripts/audit-best-practices.mjs --root <path>` to generate a baseline report and highlight missing checks.
- Update the script to scan for security headers, auth gates, missing Zod validation, and Prisma usage in UI files.

## Example output

```md
Findings:
- Add CSP and security headers in `next.config.ts`.
- Move Prisma queries from `app/api/...` into `services/` and map to DTOs in `mappers/`.
- Add Zod schema validation for POST bodies in `app/api/...`.
- Reduce client-side fetching in `app/...` by moving data fetching to Server Components.
```
