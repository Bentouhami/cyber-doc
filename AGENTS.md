# CyberDoc instructions for every AI assistant

These instructions are vendor- and tool-agnostic. They apply to every coding
assistant, IDE agent, CLI agent, autonomous worker, and human contributor. A
tool-specific file may add integration details, but it cannot weaken or override
this contract.

## Mandatory reading order

Before changing the repository, read:

1. this file;
2. `CONSTRAINTS.md` — the enforceable shipping contract;
3. `docs/engineering/QUALITY_PROCESS.md` — the delivery and incident process;
4. `AGENT.md` — current architecture and product memory;
5. the affected canonical file under `docs/features/` and relevant ADRs under
   `docs/decisions/`.

The universal onboarding guide is
`docs/engineering/AI_ASSISTANT_ONBOARDING.md`.

## Repository contract

- This is a root-level Next.js application, not a monorepo.
- Use **pnpm only**. `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml`
  are authoritative; use `pnpm install` locally and
  `pnpm install --frozen-lockfile` for clean/CI installs.
- Do not run npm, Yarn, Bun, or regenerate their lockfiles unless an accepted ADR
  explicitly migrates the whole repository.
- Inspect the current Git diff before editing and preserve unrelated work.
- Never commit, push, merge, rewrite history, or weaken a gate unless the user has
  authorized that action.

## Delivery loop

1. Understand the request, current behavior, contracts, permissions, data and
   security impact.
2. Make the smallest complete change and update the canonical documentation in
   the same change.
3. Run focused checks while iterating and `pnpm run quality:fast` before handoff.
4. For security, financial, storage, authorization or lifecycle changes, add an
   adverse test that fails under the previous behavior; a happy path is not enough.
5. Run a fresh-context correctness/security/architecture/performance review, then
   `pnpm run quality:prepush`, before proposing a push or merge.
6. Do not hide failures with suppressions, skips, broad allowlists, deleted tests,
   or reduced thresholds.

## Security and secrets

- Never expose a Gitleaks finding in chat, logs, reports, issues, or commits.
- Revoke or rotate a detected credential and replace the literal with an
  environment-variable reference before continuing.
- Protect resources at the API boundary, validate untrusted input, and never rely
  on UI visibility as authorization.

## Documentation

- Every product behavior change updates its canonical `docs/features/*.md` file.
- Every expensive-to-reverse decision receives a sequential ADR.
- Documentation, tests, migrations and operational notes are part of the feature,
  not follow-up work.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
