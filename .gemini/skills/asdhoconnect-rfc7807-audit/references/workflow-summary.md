# RFC7807 audit summary

Purpose: standardize API errors to RFC7807 across backend and frontend.

Key rules:

- Use the existing audit prompt as the source of truth.
- Prefer read-only discovery first.
- Avoid leaking sensitive details in client responses.
- Propose minimal patches + tests.

Source prompt:

- `.codex/prompts/api/asdho_api_errors_audit.md`
