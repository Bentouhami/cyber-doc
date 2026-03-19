# RC Open Issues

Date: 2026-03-19  
Branch: `release/rc-checklist`

## Blocking

- None identified from automated checks.

## Non-Blocking

1. `baseline-browser-mapping` update warning during lint/build.
   - Impact: none on runtime behavior.
   - Suggested fix: update dev dependency in a maintenance PR.

## Candidate Risks To Watch During Manual Smoke

1. Auth/session transitions across role-protected pages.
2. Template import/update edge cases with JSON metadata fields.
3. Payment arithmetic correctness in multi-copy scenarios.
4. Print/download behavior under repeated requests.

## Defect Log Template

Use this format for each newly discovered issue:

- ID:
- Severity: (Blocker / Major / Minor)
- Area:
- Steps to reproduce:
- Expected:
- Actual:
- Proposed fix:
- Owner:
- Status:

