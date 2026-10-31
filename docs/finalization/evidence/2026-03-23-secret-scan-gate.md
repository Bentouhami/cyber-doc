# 2026-03-23 - Secret Scan Gate

## Scope

Add and validate a pre-release secret scanning gate to prevent accidental credential leaks.

## Implemented

- Script: `scripts/release/secret-scan.mjs`
- npm command: `npm run release:secret-scan`
- Included in release docs:
  - `production-release-checklist.md`
  - `deploy-runbook.md`

## Result

- Command execution: `npm run release:secret-scan`
- Outcome: `no secrets found`
- Scanned files: `404`
- Report: `tmp/secret-scan/results.json`

## Notes

- Scanner excludes non-release/system skill directories and placeholder-like example snippets.
- This gate is now required before any release push/tag.
