---
name: nextjs-test-generation
description: Generate Playwright or Jest/Testing Library tests for Next.js components, pages, and routes. Use when asked to add tests, create test scaffolds, or validate UI behavior.
---

# Next.js Test Generation

Use this skill when a user asks to generate or scaffold tests for existing Next.js 16 components, pages, or API routes.

## Triggering phrases

- "Generate tests for this component"
- "Add integration tests for a page route"
- "Create Playwright tests for this flow"
- "Write Jest tests for this Next.js component"

## Instructions

1. Identify whether the request is unit (Jest/Testing Library) or E2E (Playwright).
2. Locate target files and their dependencies; confirm app router routing.
3. Choose a test location:
   - Adjacent `__tests__/` folder for component tests
   - `app/<route>/tests/` for route-level integration tests
4. Generate tests that assert visible UI, routing outcomes, and key side effects.
5. Prefer user-focused assertions and avoid brittle implementation checks.
6. Add minimal setup helpers when required (test utils, render wrappers).
7. Provide a short note on how to run the tests.

## Test generation rules

- Use Testing Library for React unit tests and Playwright for E2E flows.
- Keep test names descriptive and aligned with user intent.
- Mock network calls only when necessary; prefer integration tests for real flows.
- Mirror route structure in test paths for clarity.

## Examples

```md
Added tests:
- `components/__tests__/ProfileCard.test.tsx` for profile rendering
- `app/settings/tests/settings-route.spec.ts` for route navigation
Run:
- `npm run test` (unit)
- `npx playwright test` (e2e)
```

```ts
// components/__tests__/ProfileCard.test.tsx
import { render, screen } from "@testing-library/react";
import ProfileCard from "../ProfileCard";

test("shows user name", () => {
  render(<ProfileCard name="Avery" />);
  expect(screen.getByText("Avery")).toBeInTheDocument();
});
```

## Scripts

Use `scripts/generate-tests.mjs` to automate test skeleton creation. Update it to parse file paths, choose test frameworks, and emit test templates for components or routes.
