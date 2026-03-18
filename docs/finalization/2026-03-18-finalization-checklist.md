# CyberDoc End-to-End Finalization Checklist

Date: 2026-03-18

Use this as the execution tracker from current state to production-ready state.

## A) Build and static quality

- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] Temporary/generated artifacts (`tmp/**`) are excluded from compile/lint scope
- [ ] No blocking warnings in CI baseline

## B) API and data contracts

- [ ] All API routes validate input/output with explicit schemas
- [ ] Prisma JSON writes use safe typed helpers (no nullable mismatch)
- [ ] Decimal-based monetary fields are normalized before arithmetic
- [ ] Activity log writes are typed and consistent in every route

## C) Security and access controls

- [ ] Every protected API route enforces auth/user role checks
- [ ] Admin-only actions are blocked for non-admin users
- [ ] Document and template ownership/authorization rules documented
- [ ] Sensitive logs and responses reviewed for leakage

## D) Functional quality

- [ ] Template lifecycle works end-to-end (create/edit/import/validate/render-test)
- [ ] Document lifecycle works end-to-end (generate/view/duplicate/payment/print/download)
- [ ] User/employee management flows work for admin users
- [ ] i18n and RTL behavior validated on key pages

## E) Testing

- [ ] Minimal automated tests exist for critical flows
- [ ] Regression cases added for previously failing routes
- [ ] Manual QA checklist executed (happy path + error path)

## F) Documentation

- [ ] Root README updated to current stack and scripts
- [ ] API contract index documented in `/docs`
- [ ] Data model docs aligned with current Prisma schema
- [ ] Release runbook + rollback runbook documented

## G) Release readiness

- [ ] Migrations verified for target environment
- [ ] Environment variables documented and validated
- [ ] Deployment procedure rehearsed
- [ ] Rollback procedure tested
- [ ] Release notes prepared

## Done definition

Mark project finalization complete only when all sections A->G are checked and verified.
