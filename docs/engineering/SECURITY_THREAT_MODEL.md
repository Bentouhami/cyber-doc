# CyberDoc security threat model

Last reviewed: 2026-10-31

## Scope and assets

This model covers the Next.js application, Better Auth sessions, PostgreSQL data,
DOCX template ingestion, HTML/PDF rendering, locally persisted generated files and
the CI/deployment supply chain.

Protected assets include credentials and sessions, employee/admin privileges,
personas and identity data, generated documents, payment state, templates, audit
events and deployment secrets.

## Trust boundaries

1. Browser to Next.js pages and API routes.
2. Better Auth cookie/session to CyberDoc's active-user and role policy.
3. API input to Zod/manual validation and Prisma.
4. Imported DOCX or template HTML/CSS to preview and Chromium PDF rendering.
5. Persisted file paths to the local storage filesystem.
6. Repository and lockfile to package installation, CI and deployment.

## STRIDE register

| Threat | Abuse case | Control/status |
| --- | --- | --- |
| Spoofing/elevation | Reuse a session after an account is disabled or deleted | Resolved: centralized active-user policy and transactional session revocation; permissions smoke 44/44 |
| Elevation | Public user self-registers outside the employee administration flow | Resolved: Better Auth public signup disabled and tested |
| Tampering/DoS | Malformed employee payload or oversized password reaches hashing/Prisma | Resolved: strict centralized Zod schemas, 8–128 password bound, normalized email/names/roles and contract tests |
| Spoofing/CSRF | A production auth request or redirect is accepted from an unintended localhost or malformed origin | Resolved: canonical production URL required, no hardcoded production localhost origins, exact optional origins and fail-closed URL validation |
| Tampering/injection | Invalid paging values reach Prisma as `NaN` or negative limits | Resolved: bounded integer parsing and structured `400`; critical smoke coverage |
| Information disclosure | Internal ORM/path errors leak through API bodies or raw server logs | Resolved for application API handlers: generic public 500 responses and structured logs limited to route, operation and coarse error type |
| Tampering/XSS | Imported or requested template HTML executes in a same-origin preview | Resolved: server allowlist at every persistence boundary and render boundary, strict preview CSP, and sandboxed iframes |
| Tampering/DoS | A mislabeled, oversized, chunked, zip-bomb or macro-enabled employee upload reaches DOCX extraction | Resolved: declared-length preflight plus a hard streamed multipart bound before parsing, 10 MiB file bound, ZIP/DOCX structural checks, entry/count decompression bounds and VBA rejection |
| Elevation/disclosure | A valid session loses its employee/admin role but retains document or raw-template reads | Resolved: database-backed explicit role guards on PII/document reads; raw template assets are admin-only; adverse unit/smoke coverage |
| SSRF | Template HTML or CSS asks the preview/PDF browser to fetch an internal or external URL | Resolved for template content: URL-bearing HTML is removed, CSS URL/import primitives are rejected, preview connections are blocked, and PDF rendering permits only `about:`, `data:` and `blob:` protocols |
| Denial of service | Chromium leaks or waits indefinitely during PDF generation | Resolved for the renderer: 15-second bounds and unconditional browser cleanup |
| Tampering/XSS | An injected inline script bypasses the application CSP | Resolved: per-request nonce propagated through the Next proxy, `strict-dynamic`, no production script `unsafe-inline`/`unsafe-eval`, and response/unit regression checks |
| Tampering/disclosure | Persisted paths escape storage or another resource through symlinks | Resolved for served documents/assets: DB relation supplies ownership evidence, realpath containment and regular-file checks reject traversal/symlink chains; generated-file parents are checked and targets created exclusively |
| Repudiation | Sensitive mutations lack complete, queryable audit evidence | Open product work: `AUD-001` remains partial |
| Supply chain | Compromised package script or leaked credential reaches GitHub | Controlled: pnpm allow-build policy, frozen lockfile, audit, internal scan and Gitleaks |

## Current blocking work

Changes to authentication, uploads, CORS, rate limiting or collection of new
personal data remain security-sensitive changes requiring explicit review and
abuse-case tests. A future move to object storage must preserve resource ownership,
non-guessable object identifiers and the same generic-error contract.

## API error and filesystem policy

Unexpected API failures use `lib/api-error.ts`. Public `500` bodies contain only a
stable operation-level message. Server logs are single JSON events and never
include the exception message, stack, request payload, resource identifier, path,
PII, credential or token. Expected `400`/`404` outcomes are handled before the
unexpected-error boundary.

`services/storageSecurity.ts` treats a database path as untrusted despite its local
origin. A file may be served only when the authenticated resource lookup proves the
owning document/template relation, the normalized relative path is at least one
level below the allowlisted root, both root and target resolve with `realpath`, no
intermediate/final symlink changes the intended path, and the target is a regular
file. Generated files receive the equivalent parent check and exclusive creation.

## Template-content policy

`sanitize-html` 2.18.1 runs only on the server. Its explicit allowlist preserves
document text, headings, lists and tables while excluding executable/embedded
content and URL attributes. The CSS policy is fail-closed: it accepts flat rules
and allowlisted print-oriented declarations, and discards the complete stylesheet
when an at-rule, URL primitive, legacy expression/behavior or unsupported syntax
is present. Existing stored templates are sanitized again before API detail output,
preview and PDF rendering; this provides migration-free defense in depth while new
writes persist canonicalized content.

The dependency is pinned because 2.18.1 fixes the nested discarded-iframe recursion
DoS present in 2.18.0 and removes the unnecessary `deepmerge` dependency. The
project Node floor (`>=22.13`) satisfies the library floor (`>=22.12`).

Employee DOCX uploads are written only after ZIP/DOCX validation, with exclusive
creation under the persistent storage root. Multipart input is stream-bounded before
`formData()` materialization even when `Content-Length` is absent or false. Runtime reads use the owning database
relation and allowlisted roots. Reviewed legacy assets under `templates_docs` are
packaged for seeded records; uploaded assets remain outside Git on the mounted volume.

## Verification evidence

- `pnpm run smoke:permissions`: 44/44 after the active-user lifecycle and audit-boundary changes.
- `pnpm run quality:fast`: lint, types, dependency audit and both secret scanners.
- `tests/unit/template-content-security.test.ts`: scripts, handlers, unsafe schemes,
  `srcset`, SVG/MathML, CSS URL/import/expression/behavior, allowed document content.
- `tests/unit/api-error.test.ts`: coarse classification without message/property leakage.
- `tests/unit/storage-security.test.ts`: traversal, realpath containment, symlinked
  reads/writes and response-filename hardening.
- `tests/unit/docx-upload-security.test.ts` and `template-asset-storage.test.ts`:
  bounded DOCX ingestion, hostile archive rejection and persistent asset retrieval.
- `pnpm exec tsx scripts/performance/pdf-render-check.ts`: PDF signature, embedded
  resource behavior, network denial and repeated timing.

Never place scanner findings, credentials, tokens or personal records in this
document.
