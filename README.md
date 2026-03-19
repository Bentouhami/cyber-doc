# CyberDoc

CyberDoc is a Next.js fullstack platform for cybercafes to create, print, and track legal/administrative documents in Arabic/French workflows.

## What We Are Trying to Accomplish

Deliver a stable MVP where:

- admins manage templates and employees,
- employees generate/preview/print/duplicate documents fast,
- cash payment details are recorded accurately,
- all actions are traceable (history, logs, stats),
- the project is release-ready with clean quality gates.

## Current Stack

- Next.js 16 App Router + React 19 + TypeScript
- Prisma + PostgreSQL
- Better Auth (session-based auth)
- Tailwind v4 + shadcn/ui + Radix UI
- i18next (Arabic/French localization)

## Current Reality

The repository now contains most target features, but `dev` still needs stabilization work after branch consolidation (lint/type-check/runtime integration fixes).

See the latest project steering docs:

- [Project Mission](docs/project-state/mission-and-product-scope.md)
- [Feature Inventory](docs/project-state/feature-inventory.md)
- [Current State Audit (2026-03-19)](docs/project-state/current-state-audit-2026-03-19.md)
- [Recovery Plan to Release](docs/project-state/recovery-plan-to-release.md)

## Quick Start

1. Install dependencies: `npm install`
2. Configure environment variables (`.env`, `.env.local`)
3. Run database migrations and seed data
4. Start dev server: `npm run dev`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run type-check`
- `npm run start`

