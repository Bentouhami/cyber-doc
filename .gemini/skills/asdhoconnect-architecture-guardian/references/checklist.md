# Architecture checklist

- UI components contain no business logic.
- Pages only orchestrate data flow and rendering.
- Frontend services own API calls and mapping.
- API routes are thin and forward to backend.
- Backend controllers/resources delegate to services.
- Repositories only handle persistence.
- DTOs and Zod schemas are explicit and aligned.
