# CyberDoc Gap Matrix and Enhancement Plan

Date: 2026-03-18

## Priority matrix

| Priority | Gap | Impact | Evidence | Action |
| --- | --- | --- | --- | --- |
| P0 | TypeScript does not pass | Blocks reliable release | `npm run type-check` fails across routes/services | Stabilize TS + Prisma types, exclude non-prod `tmp/**` from compile |
| P0 | Monetary type mismatches | Risk of wrong payment calculations | Decimal vs number errors in payment/document routes | Introduce shared money helpers and Decimal-safe arithmetic |
| P0 | Prisma JSON contract mismatches | Runtime and persistence inconsistency | Multiple JSON assignment errors in templates/documents | Add typed JSON mapper layer and safe coercion functions |
| P1 | Lint gate fails | CI gate instability | Internal `<a>` link issue | Replace with `next/link`, enforce lint clean baseline |
| P1 | `any` usage in critical pages/routes | Reduced safety and refactor risk | Multiple `as any` occurrences | Replace with DTOs and explicit inferred types |
| P1 | Missing API contract documentation | Slower integration and regressions | No full endpoint catalog | Generate API contract index in docs |
| P1 | No coherent test matrix | Unknown regression coverage | No workflow-to-test mapping | Define unit/integration/e2e matrix + minimal suite |
| P2 | Documentation drift | Team confusion | Stack versions outdated in README | Update technical docs to current stack |
| P2 | Operational runbook missing | Deployment/incident risk | No release/rollback playbook | Add release, backup, rollback, incident docs |
| P2 | Security verification not formalized | Inconsistent hardening | Controls exist but no audit checklist | Add endpoint-level security checklist |

## Enhancement plan by phase

## Phase 1: Stabilize build and typing (P0)

Goals:
- `npm run lint` passes
- `npm run type-check` passes

Actions:
1. Exclude non-production temp extraction files from TypeScript build scope.
2. Fix Prisma JSON typing through explicit helper conversions.
3. Normalize Decimal arithmetic for payment/amount fields.
4. Fix activity log relation typing in route handlers.
5. Fix NextResponse body typing for Buffer payloads.

Exit criteria:
- Zero TS errors
- Zero lint errors

## Phase 2: Contract and data safety hardening (P0/P1)

Goals:
- Route payload and DB mapping become consistent and explicit.

Actions:
1. Define shared DTO schema modules for templates/documents/payments.
2. Add mapper layer to separate Prisma shape from API response shape.
3. Remove `any` in highest-risk files first (`app/api/documents/*`, templates routes, admin template pages).
4. Add centralized money/JSON utility helpers in `lib/`.

Exit criteria:
- No `any` in critical API route files
- Contract docs match runtime behavior

## Phase 3: Test and regression safety (P1)

Goals:
- Critical business flows protected by automated tests.

Minimum coverage targets:
1. Auth + role gate tests (admin vs employee)
2. Template CRUD and validation tests
3. Document generation + duplicate + payment tests
4. Download/print API behavior tests

Exit criteria:
- Test suite exists and passes in CI mode
- Manual validation checklist documented and executed

## Phase 4: Documentation and operations finalization (P1/P2)

Goals:
- Project can be operated and handed over safely.

Actions:
1. Update root README with real stack and commands.
2. Add API endpoint catalog under docs.
3. Add release runbook (deploy, rollback, migration order, backup).
4. Add environment and secrets policy.
5. Add troubleshooting and incident response guide.

Exit criteria:
- Docs align with codebase
- New contributor can setup, run, validate, release from docs only

## Phase 5: Production readiness gate (final)

Release gate checklist:
- Lint and type-check pass
- Critical tests pass
- Migrations reviewed
- Security checklist completed
- Documentation updated
- Release notes prepared
- Rollback plan validated

Final status target:
- COMPLIANT, RELEASE-READY
