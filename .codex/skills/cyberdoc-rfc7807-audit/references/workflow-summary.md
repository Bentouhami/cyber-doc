# RFC7807 audit summary

Purpose: standardize API errors to RFC7807 across backend and frontend.

Key rules:

- Cover all route handlers under `app/api/**/route.ts`.
- Prefer read-only discovery first.
- Avoid leaking sensitive details in client responses.
- Propose minimal patches + tests.
- Ensure frontend service/client handles Problem Details consistently.
