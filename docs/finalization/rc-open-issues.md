# RC Open Issues

Date: 2026-03-22  
Branch: `dev`

## Blocking

None currently reproduced on automated smoke as of 2026-03-22.

Evidence:
- `tmp/admin-smoke/results.json` -> passCount 26, failCount 0
- `tmp/documents-smoke/results.json` -> passCount 13, failCount 0
- `tmp/ux-check/results.json` -> passCount 28, failCount 0

Resolved historical blockers:
- RC-001 (auth/session): resolved (login/authenticated flows pass in smoke).
- RC-002 (route protection): resolved (protected routes and APIs pass via authenticated probes).
- RC-005 (security headers): resolved (`next.config.ts` now defines CSP + standard security headers).

## Non-Blocking (Open)

1. ID: RC-004  
   Severity: Major  
   Area: UX simplification (employee/admin forms)  
   Current state: Resolved. Latest UX route check reports `fieldWarning=false` on critical routes after label/placeholder + wording cleanup.  
   Impact: Form clarity improved for non-technical staff on `/admin/*` and `/documents/create`.  
   Proposed fix: Keep route-level UX check in regression suite.  
   Owner: You + Codex  
   Status: Resolved

2. ID: RC-006  
   Severity: Minor  
   Area: Test depth (regression safety)  
   Current state: A unified critical E2E runner exists (`npm run test:e2e:critical`) and chains smoke suites. CI wiring is in place (`.github/workflows/frontend.yml`). Restricted Windows sandbox support is now available via opt-in fallback `SMOKE_ALLOW_EPERM_SKIP=1`.  
   Impact: Future regressions can slip between manual/smoke runs.  
   Proposed fix: Keep CI execution on Linux Playwright profile and use the fallback flag only for restricted local environments.  
   Owner: You + Codex  
   Status: Monitoring

## Candidate Risks To Watch During Manual Smoke

1. Payment arithmetic correctness in multi-copy scenarios.
2. Template import edge cases on complex `.docx` files.
3. Persona identity collision when no CIN is provided and names are close.

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

