# Security checklist

- Route handlers have explicit authn/authz checks.
- Ownership checks enforced where needed.
- Response DTOs expose only required fields.
- Errors do not leak sensitive data.
- Cookies use `Secure`, `HttpOnly`, and `SameSite` as applicable.
- CORS rules are explicit and minimal.
