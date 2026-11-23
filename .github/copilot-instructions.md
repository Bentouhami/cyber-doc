# CyberDoc coding-agent instructions

This file is only a GitHub Copilot adapter. The vendor-neutral contract in
`AGENTS.md` is authoritative and must be read first.

CyberDoc is a root-level Next.js App Router application backed by PostgreSQL and
Prisma. It is not an ASDHO monorepo and has no Symfony `backend/` or nested
`frontend/` application.

Before changing code:

1. Read `AGENTS.md`, then follow its mandatory reading order.
2. Inspect the existing Git diff and preserve unrelated user changes.
3. Use pnpm and `pnpm-lock.yaml` as the authoritative dependency graph.
4. Read the matching Next.js 16 documentation under `node_modules/next/dist/docs/`.
5. Identify and update the canonical file under `docs/features/`.

Implementation rules:

- Validate API input with Zod and enforce authorization on every protected route.
- Treat authentication, roles, personal data, generated documents, payments, and file paths as security-sensitive.
- Add a forward Prisma migration for every schema or stored-data semantic change.
- Keep seed behavior idempotent and aligned with production CRUD behavior.
- Preserve French and Arabic translations, RTL behavior, mobile layouts, and keyboard navigation.
- Never add suppressions, skipped tests, empty catches, hard-coded secrets, or unreviewed dependencies to make a check pass.
- Never print or persist detected secret values; use environment variables and treat any committed credential as compromised.
- Create a feature document from `docs/features/_template.md` for new behavior and an ADR for expensive-to-reverse decisions.

Verification:

- During work: `pnpm run quality:fast` and targeted tests.
- Before handoff or push: `pnpm run quality:prepush`.
- A change is not mergeable until all required GitHub checks pass.
