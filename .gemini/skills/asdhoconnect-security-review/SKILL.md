---
name: asdhoconnect-security-review
description: Review security in ASDHO-CONNECT across Symfony API Platform and Next.js. Use when changing auth, roles, permissions, serialization groups, or data exposure.
metadata:
  short-description: Security review for API Platform and frontend
---

# Security Review

## Scope

- Roles and ownership checks.
- API Platform exposure (operations, groups, filters).
- Error handling and logging hygiene.
- Cookies, headers, CORS, and token handling.

## When to use

- Any auth/role/permission change.
- New or modified API Platform operations/resources.
- Changes affecting data exposure, error handling, or logging.

## Workflow

1. Identify endpoints and resources changed.
2. Verify security expressions per operation.
3. Check serialization groups for least privilege.
4. Validate frontend handling of auth and errors.
5. List risks and required fixes.

## Output

- Findings ordered by severity with file paths.
- Required changes and optional hardening steps.

## Do not

- Do not relax access control to make tests pass.
- Do not expose secrets, tokens, or internal identifiers in output.
- Do not suggest bypassing security checks.

## Safety

- Never include secrets or tokens in outputs.
- Never propose disabling security checks.
- Never suggest weakening access control for convenience.

## Definition of Done

- [ ] Operation-level security reviewed.
- [ ] Serialization groups reviewed.
- [ ] Frontend auth flow reviewed.
- [ ] Risks and fixes listed.

## References

See `references/checklist.md`.
