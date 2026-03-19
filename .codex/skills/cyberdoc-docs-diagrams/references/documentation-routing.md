# Documentation routing (CyberDoc)

## 1) Principles

- `/docs` is the canonical location for active project documentation.
- Do not create active documentation in `Documentation/`, `doc/`, or ad-hoc root folders.
- Keep docs close to current architecture (Next.js fullstack, route handlers, services, Prisma).
- Use concise links between functional docs, technical docs, and diagrams.

## 2) Canonical targets

- Project overview: `docs/analysis/README.md`
- Product/functional docs: `docs/analysis/*`
- Data model and schema docs: `docs/analysis/data-model/*`
- Templates and document feature docs: `docs/templates-md/*` and related module folders
- Prototype/UX references: `docs/prototype/*`

## 3) Routing by change type

| Change type | Typical code zones | Documentation targets |
| --- | --- | --- |
| Next.js UI/UX feature | `app/**`, `components/**`, `hooks/**` | `docs/analysis/*` or feature-specific folder under `docs/` |
| API route contract | `app/api/**/route.ts`, `services/**`, `mappers/**`, `types/**` | `docs/analysis/*` + contract notes |
| Auth/session/security | `app/api/auth/**`, `lib/auth*`, `components/providers/**`, `middleware.ts`/`proxy.ts` | `docs/analysis/*` with security section |
| Data model / Prisma changes | `prisma/schema.prisma`, `prisma/migrations/**` | `docs/analysis/data-model/*` |
| Testing/quality flow | test configs, CI scripts | `docs/analysis/*` and workflow notes in `docs/` |

## 4) Diagram placement

- Feature-level diagrams: place near related feature docs in `docs/`.
- Cross-cutting architecture diagrams: place in shared architecture doc sections under `docs/analysis/`.
- Data model diagrams: place under `docs/analysis/data-model/`.

## 5) Quick decision rule

1. If it explains one feature, put it in that feature's `docs/` area.
2. If it applies across features, put it in a shared `docs/analysis/` location.
3. If it is obsolete but useful, keep it clearly labeled as archive in `docs/`.

## 6) Definition of Done

- [ ] Target file/folder selected under `/docs`
- [ ] Links point to current paths
- [ ] Contract/security/ops impacts documented where relevant
- [ ] No active doc created outside `/docs`
