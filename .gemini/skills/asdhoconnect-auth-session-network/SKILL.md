---
name: asdhoconnect-auth-session-network
description: Audit and document auth/session/network behavior using the existing prompt.
metadata:
  short-description: Auth/session/network diagnostics wrapper
---

## Purpose

Wrap the approved auth/session/network prompt for consistent diagnostics and documentation.

## When to use

- Session issues, auth refresh, proxy/network failures.
- Any change touching authentication or session handling.

## Workflow (concise)

1) Read the reference guide.
2) Identify auth/session/network touchpoints.
3) Produce findings and proposed fixes.
4) Document in /Documentation (no secrets).

## References

See `references/workflow-summary.md` and `.codex/prompts/architecture/asdho_context_refresh.md`.

## Output policy

Do not echo file contents unless explicitly requested.

## Definition of Done

- [ ] Findings scoped to auth/session/network.
- [ ] No secrets in outputs.
- [ ] Documentation target identified.
