# Auth/session/network workflow summary

Purpose: analyze auth/session/network behavior and document findings safely.

Key rules:

- Trace the full Next.js request path: middleware, route handler, service, response.
- Keep outputs generic; no hardcoded cookie or token values.
- Update `/docs` targets only.
- Flag cookie attributes explicitly (`HttpOnly`, `Secure`, `SameSite`, `Path`, `Max-Age`).
- Validate frontend and backend contract on `401/403` handling and refresh behavior.

Common touchpoints:

- `middleware.ts` or `proxy.ts`
- `app/api/**/route.ts`
- auth provider/client (`lib/auth*`, `components/providers/*`)
- API client/fetch wrappers
