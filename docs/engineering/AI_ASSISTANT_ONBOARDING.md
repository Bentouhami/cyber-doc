# Universal AI assistant onboarding

This guide applies to any AI assistant or automation working on CyberDoc. It does
not assume a specific vendor, model, IDE, plugin, or command-line client.

## Bootstrap protocol

An assistant must start at the repository root and read, in order:

1. `AGENTS.md`;
2. `CONSTRAINTS.md`;
3. `docs/engineering/QUALITY_PROCESS.md`;
4. `AGENT.md`;
5. the affected `docs/features/*.md` files and relevant ADRs.

If the assistant cannot read one of these files completely, it must report that
limitation before changing code. Instructions copied into a prompt or stored in a
tool-specific file do not replace the repository sources.

## Tool-adapter policy

Files such as `GEMINI.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, IDE
rules, or hosted-agent prompts are discovery adapters. They should point to
`AGENTS.md` instead of duplicating the complete process. If an adapter conflicts
with `AGENTS.md`, the repository contract wins unless the human user explicitly
changes the contract.

## Package manager

CyberDoc uses pnpm exclusively:

```text
Local install: pnpm install
Clean/CI install: pnpm install --frozen-lockfile
Development: pnpm run dev
Iteration gate: pnpm run quality:fast
Pre-push gate: pnpm run quality:prepush
```

The root `package.json` pins pnpm and `pnpm-lock.yaml` is authoritative. Do not
run npm, Yarn or Bun, and do not update multiple lockfiles. Migrating package
managers requires a dedicated ADR, clean lockfile regeneration, CI changes and a
full pre-push verification.

## Required assistant output

At handoff, report:

- what changed and why;
- which files contain the implementation and documentation;
- the exact checks executed and their outcome;
- remaining risks, external actions or secrets that need rotation;
- whether a commit, push, pull request or external mutation occurred.

Never include secret values, personal data, password hashes or session tokens in
the handoff.
