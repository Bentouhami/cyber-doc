# Architecture checklist

- UI components contain no business logic.
- Pages only orchestrate data flow and rendering.
- Frontend services own API calls and mapping.
- Route handlers are thin and delegate business rules to server services.
- Server services own business rules and orchestration.
- Prisma/data access layer only handles persistence concerns.
- DTOs and Zod schemas are explicit and aligned.
