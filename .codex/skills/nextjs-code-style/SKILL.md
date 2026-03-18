---
name: nextjs-code-style
description: Enforce and explain Next.js app router coding conventions, including file structure, naming, and client/server component boundaries. Use when asked to review Next.js code style, folder layout, or component conventions.
---

# Next.js Code Style

Use this skill when a user wants a review or enforcement of Next.js 16 app router conventions, naming, and client/server component rules.

## Triggering phrases

- "Check code style for Next.js app folder"
- "Review component naming and imports"
- "Enforce Next.js file structure conventions"
- "Audit app router layout and naming"

## Instructions

1. Scan the `app/` directory layout and verify `layout.tsx` and `page.tsx` placement.
2. Verify file and folder naming rules (kebab-case folders, PascalCase components).
3. Confirm client components include `'use client'` only when necessary.
4. Verify server components avoid client-only APIs and side effects.
5. Check import ordering, alias usage, and consistent barrel export patterns.
6. Note any violations and suggest concrete fixes with file paths.

## Code style rules

- Keep route segments in `app/` and avoid mixing with legacy `pages/` unless intentional.
- Use `layout.tsx` for shared structure; avoid heavy logic in layouts.
- Place route-level loading and error UI in `loading.tsx` and `error.tsx`.
- Use `'use client'` only when hooks or browser APIs are required.
- Prefer `components/` for shared UI and `app/<route>/components/` for route-scoped UI.

## Example output

```md
Style findings:
- `app/dashboard/page.tsx`: Uses `useState` but missing `'use client'`.
- `app/blog/post.tsx`: Non-route file under `app/` should move to `app/blog/components/Post.tsx`.
- `components/button.tsx`: Rename to `components/Button.tsx` for PascalCase component naming.
```
