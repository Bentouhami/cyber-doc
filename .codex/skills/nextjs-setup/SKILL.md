---
name: nextjs-setup
description: Scaffold a Next.js 16 project with TypeScript, Tailwind CSS, ESLint, and Prettier. Use when asked to initialize, bootstrap, or set up a Next.js app repository, tooling, or base configs.
---

# Next.js 16 Setup

Use this skill when a user asks to create a new Next.js 16 project scaffold with TypeScript, TailwindCSS, ESLint, and Prettier, including base configs and editor settings.

## Triggering phrases

- "Initialize a Next.js 16 project with TypeScript, ESLint, Prettier, TailwindCSS"
- "Create Next.js project scaffold"
- "Set up a new Next.js app with Tailwind and linting"
- "Bootstrap a Next.js 16 repo"

## Instructions

1. Confirm target directory, project name, and package manager (default to npm if unspecified).
2. Scaffold the app directory with `create-next-app` and TypeScript enabled.
3. Initialize git if requested and add a clean initial commit after configs are in place.
4. Install and configure TailwindCSS (postcss + tailwind config).
5. Install and configure ESLint + Prettier with consistent rules and formatting.
6. Create or update `tsconfig.json` with strict settings and path aliases as needed.
7. Add recommended VS Code settings under `.vscode/settings.json`.
8. Verify linting and formatting commands in `package.json` scripts.

## Rules

- Prefer the Next.js 16 app router and `app/` directory layout.
- Use TypeScript for all source files.
- Keep lint/format scripts deterministic and fast.
- Avoid adding extra dependencies beyond the required toolchain unless requested.

## Example output

```md
Created the Next.js 16 scaffold with Tailwind, ESLint, and Prettier:
- Configured `tailwind.config.ts` and `postcss.config.mjs`
- Added `eslint-config-next` plus Prettier integration
- Added `.vscode/settings.json` for format-on-save
```

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": ["typescript", "typescriptreact"]
}
```
