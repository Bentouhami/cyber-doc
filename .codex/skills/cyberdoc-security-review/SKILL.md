---
name: cyberdoc-security-review
description: Review security in CyberDoc Next.js fullstack across route handlers, auth/session, role checks, and data exposure.
metadata:
  short-description: Security review for Next.js fullstack
---

# Security Review

## Scope

- Roles and ownership checks.
- Route handler exposure and method-level authorization.
- Error handling and logging hygiene.
- Cookies, headers, CORS, and token handling.

## When to use

- Any auth/role/permission change.
- New or modified route handlers/resources.
- Changes affecting data exposure, error handling, or logging.

## Workflow

1. Identify endpoints and resources changed.
2. Verify authorization checks per HTTP method and route.
3. Check response DTO shaping for least privilege.
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

- [ ] Route-level and method-level security reviewed.
- [ ] Response field exposure reviewed.
- [ ] Frontend auth flow reviewed.
- [ ] Risks and fixes listed.

## References

See `references/checklist.md`.
