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

The release candidate is on Next.js 16.4.6 and uses pnpm 12.15.0. Its enforced
local pipeline covers secrets, lint, types, dependency audit, contracts,
translations, production build and performance budgets. PR #13 also proves the
migrations, data checks and complete critical E2E/UX matrix on PostgreSQL 17.

Production status is currently **NO-GO pending operational evidence**: application,
container and PostgreSQL CI are green, but the supported target still needs a
witnessed deployment and backup/restore rollback, monitoring proof, and approved
privacy/retention decisions. See the authoritative Go/No-Go document below.

The selected v1 production target is Vercel with Neon PostgreSQL and a private
Vercel Blob store. The local/container filesystem remains available for
development and recovery. Rollout is still gated on provisioned private storage,
deployed PDF/document smoke and backup/restore evidence; see
[ADR 0008](docs/decisions/0008-vercel-production-target.md).

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

1. Use Node `22.17.0` (the version in `.node-version` and CI; the image uses Node 22)
2. Install dependencies: `pnpm install`
3. Configure environment variables (`.env`, `.env.local`)
4. Run database migrations and seed data
5. Start dev server: `pnpm run dev`

CyberDoc is pinned to Node 22.17.0 for reproducibility and pnpm 12.15.0 through
the `packageManager` field. Node 26 is outside the supported engine range.
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

