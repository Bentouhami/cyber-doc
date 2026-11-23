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

The release candidate is on Next.js 16.4.3 and uses pnpm 12.15.0. Its enforced
local pipeline covers secrets, lint, types, dependency audit, contracts,
translations, production build, migrations and critical E2E flows.

Production status is currently **NO-GO pending external evidence**: the exact
release commit still needs green container CI, corrected GitHub required-check
contexts, a witnessed backup/restore rollback, and approved privacy/retention
decisions. See the authoritative Go/No-Go document below.

The supported v1 production target is the immutable container deployment with
persistent PostgreSQL and document volumes. Vercel is preview-only because the
current document/PDF storage contract requires durable filesystem semantics; see
[ADR 0007](docs/decisions/0007-supported-production-deployment-target.md).

See the current release steering documents:

- [Production-readiness checklist](tasks/todo.md)
- [RC technical evidence](docs/finalization/rc-smoke-report.md)
- [RC open issues](docs/finalization/rc-open-issues.md)
- [RC Go/No-Go](docs/finalization/rc-go-no-go.md)

Historical product context:

- [Project Mission](docs/project-state/mission-and-product-scope.md)
- [Feature Inventory](docs/project-state/feature-inventory.md)
- [Current State Audit (2026-03-19)](docs/project-state/current-state-audit-2026-03-19.md)
- [Recovery Plan to Release (March 2026 baseline)](docs/project-state/recovery-plan-to-release.md)

## Quick Start

1. Install dependencies: `pnpm install`
2. Configure environment variables (`.env`, `.env.local`)
3. Run database migrations and seed data
4. Start dev server: `pnpm run dev`

CyberDoc is pinned to pnpm 12.15.0 through the `packageManager` field.
`pnpm-lock.yaml` is the only dependency lockfile; npm, Yarn and Bun are unsupported
because mixing package managers can create a dependency graph different from CI.

## AI assistants and coding agents

Every assistant—Codex, Gemini, Claude, Copilot, Cursor, Windsurf, or another
tool—must start with [AGENTS.md](AGENTS.md). It is the vendor-neutral contract;
tool-specific instruction files are adapters only. See the
[universal onboarding guide](docs/engineering/AI_ASSISTANT_ONBOARDING.md) for the
required context, delivery loop, security response and verification commands.

## Scripts

- `pnpm run dev`
- `pnpm run build`
- `pnpm run lint`
- `pnpm run type-check`
- `pnpm run quality:fast`
- `pnpm run quality:prepush`
- `pnpm run release:github-protection` (read-only GitHub settings audit)
- `pnpm run release:github-protection:plan` (read-only reconciliation preview)
- `pnpm run release:github-secrets` (required CI secret-name audit; values are never read)
- `pnpm run release:github-label` (maintainer constraint-approval label audit)
- `pnpm run start`

