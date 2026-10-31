# Main Needs Recheck - Employee Simplification Focus

Date: 2026-03-22
Scope: MVP needs from `docs/finalization/cahier-des-charges-v1.md`

## Executed checks
- `npm run lint` -> pass
- `npm run type-check` -> pass
- `npm run build` -> pass
- `npm run i18n:audit` -> pass
- `node scripts/admin-smoke-runner.mjs` -> pass (26/0)
- `node scripts/documents-smoke-runner.mjs` -> pass (13/0)
- `node scripts/ux-route-check-runner.mjs` -> pass (28/0)
- `npm run check:data` -> pass (report generated)

## Functional needs status (EF)

- EF-01 Auth & access: DONE
  - Login/session/role redirects pass in current smoke outputs.
- EF-02 Employee management (Admin): DONE
  - CRUD create/update/delete and safeguards verified by admin smoke.
- EF-03 Template management (Admin): DONE (MVP scope)
  - Create/edit/duplicate/archive/import + duplicate guard + override verified.
- EF-04 Client search (Employee): DONE
  - Existing client search/reuse covered in documents smoke.
- EF-05 Document creation (Employee): DONE
  - Guided new/existing flow and participant selection covered in smoke.
- EF-06 Persona persistence/enrichment: DONE
  - Persisted participants + enrichment + history link covered in smoke.
- EF-07 Export/print/download: DONE
  - Download and print-view checks are passing in documents smoke.
- EF-08 i18n and language consistency: PARTIAL+
  - i18n keys audit passes and routes render correctly FR/AR RTL.
  - Language guard with override is working.
  - Remaining simplification work: field wording/labels/placeholder consistency for non-technical users.

## Non-functional needs status (ENF)

- ENF-01 quality gate: DONE
- ENF-02 performance: PARTIAL (no regression alarm; no web-vitals target evidence yet)
- ENF-03 reliability: DONE (Zod validation and smoke coverage on critical flows)
- ENF-04 security: PARTIAL (auth checks good; explicit security headers still pending)
- ENF-05 maintainability: PARTIAL+ (good layering exists; add Playwright regression tests for long-term safety)

## Top remaining priorities (ordered)

1. UX simplification final pass for non-technical employees
   - `/documents/create` labels, helper text, and error copy polish.
2. Security hardening headers in `next.config.ts`
   - CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
3. Regression suite (Playwright)
   - Cover critical employee happy paths in CI.

## Conclusion
Current product is functionally MVP-ready for day-to-day employee usage.
Remaining work is primarily hardening and usability polish, not core feature completion.
