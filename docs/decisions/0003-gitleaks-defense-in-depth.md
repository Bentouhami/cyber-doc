# ADR 0003 — Secret detection in depth with Gitleaks

- Status: accepted
- Date: 2026-10-24

## Context

A literal API credential was found in tracked Git history. A source-tree regex
scan alone cannot reliably cover provider-specific token formats, commit history,
and deleted values. Conversely, scanning every local directory includes ignored
environment files and generated build caches that must not be uploaded or treated
as repository content.

## Decision

CyberDoc uses three blocking layers:

1. the internal scanner checks candidate working-tree text files, including
   relevant untracked files, without persisting matched values;
2. the local Gitleaks CLI scans tracked changes and commits not present on the
   configured upstream before push;
3. `gitleaks/gitleaks-action@v3` scans GitHub push and pull-request commits before
   downstream CI jobs.

Gitleaks uses its maintained default rules through `.gitleaks.toml`, full
redaction, and no SARIF artifact upload. Broad path/rule allowlists are forbidden.
Historical remediation remains a separate, explicitly authorized operation
because rewriting shared Git history is destructive.

## Consequences

- Developers install the Gitleaks CLI once per workstation.
- A missing CLI or any finding blocks local push.
- GitHub CI blocks builds and merges before secrets can move further through the
  delivery pipeline.
- A real finding requires credential rotation even after the literal is removed.
