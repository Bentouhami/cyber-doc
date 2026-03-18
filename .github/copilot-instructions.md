<!-- Copilot instructions for ASDHO-Connect -->
# ASDHO-Connect — Copilot / AI coding agent instructions

This file gives focused, actionable guidance so an AI coding agent (Copilot, coding assistant) can be productive quickly in this repository.

Overview
- Monorepo with two main services:
  - `backend/`: Symfony 7 + API Platform (PHP). Source in `backend/src`, config in `backend/config`, public entry `backend/public`.
  - `frontend/`: Next.js 15 (TypeScript), app router under `frontend/app`, components in `frontend/components`.
- Docker is used for development: top-level `docker-compose.yml` and `docker/` folder.

What to change and where (high-value locations)
- API endpoints and domain logic: `backend/src/` (Controllers, Entity, Repository, DTOs). Look for `ApiResource` annotations/config in `backend/config/` and `Entity` classes in `backend/src/Entity`.
- Frontend pages / UI components: `frontend/app/` (app-router), `frontend/components/`, and `frontend/lib/` for shared helpers.
- Migrations & fixtures: `backend/migrations/`, `data/fixtures/`.
- Docker/dev scripts: top-level `docker-compose.yml`, `docker/` directory and `compose.example.yaml` in `backend/`.

Developer workflows (exact commands)
- Start full dev stack (build images, run services): from repo root
  - `docker compose up --build` (dev environment exposes frontend :3000, backend :8000, phpMyAdmin :8081)
- Backend (inside container):
  - Run tests: `docker compose exec backend ./bin/phpunit`
  - Symfony console: `docker compose exec backend php bin/console <command>` (e.g., `cache:clear`, `doctrine:migrations:migrate`)
  - Apply PHP-CS-Fixer: `docker compose exec backend vendor/bin/php-cs-fixer fix`
- Frontend (local host or container depending on dev):
  - Install & dev: `cd frontend && npm install && npm run dev`
  - Build / start / lint: `cd frontend && npm run build|start|lint`
  - Tests: `cd frontend && npm test`

Project conventions & patterns (what to follow)
- PHP / Symfony
  - Entities live in `backend/src/Entity`. API resources use ApiPlatform patterns; prefer DTOs for complex payloads.
  - Tests use PHPUnit and ApiPlatform `ApiTestCase`; add API tests in `backend/tests/Api`.
  - Use project-wide PHP-CS-Fixer style before PRs.
- Frontend
  - App router structure (`frontend/app`) - co-locate components and page-specific CSS near usage.
  - PascalCase React components, TypeScript with strict-ish typing in `frontend/`.
  - ESLint + Prettier enforced. Run `npm run lint` and `npx prettier --write .` as needed.

## Règles rapides (Copilot)
- Docs : tout sous `/Documentation/...` (00-11, 99-archives), pas de nouveaux dossiers sans demande.
- Archi : frontend-service → API routes → backend-service → repository → DB (pas de patterns exotiques).
- Modules : Orders, Inventory, Identity, Notifications, Admin, New Workers alignés sur les specs.
- Auth : Entra ID + JWT/refresh, provisioning Graph ; voir `/Documentation/08-auth-and-security/*`.
- API : contrats/routage à maintenir dans `/Documentation/02-architecture/23-api-routing-and-contracts.md`.
- Data : MCD/MLD/MPD dans `/Documentation/05-database/diagrams/*`.
- DevOps : Coolify/env/secrets `/Documentation/06-devops-and-environments/*`, CI GitHub `/Documentation/07-ci-and-testing/*`.
- Qualité : lint/tests obligatoires (ESLint/Prettier/PHPCS/PHPStan/Jest/PhpUnit).
- Pas de renommage/arborescence nouvelle sans demande explicite.
- Français, pro, réponses actionnables.

Integration points and external dependencies
- Authentication: Entra ID (Microsoft) SSO est documenté dans `/Documentation/08-auth-and-security/` (SSO flow, rôles, JWT, provisioning). Valider les tokens côté backend.
- Database: MySQL via Docker; schema and fixtures under `schema.sql`, `data/`, and `backend/migrations`.
- API contract: voir `/Documentation/02-architecture/23-api-routing-and-contracts.md` (routes + contrats) ; suivre ces attentes lors des changements d’endpoint.

Files to inspect for context before code changes
- `/Documentation/README.md` — index doc central.
- `/Documentation/00-overview/00-project-summary.md` — résumé domaine + principales entités.
- `backend/config/`, `backend/src/`, `frontend/app/`, `frontend/components/` — primary edit locations.

- Examples (concrete patterns to copy)
- Add an API Platform resource: créer `backend/src/Entity/MyEntity.php` (annoté `ApiResource`) + `backend/src/Repository/MyEntityRepository.php`. Ajouter migration `backend/migrations/` et fixtures `data/fixtures/`. Mettre à jour la doc si contrat change (`/Documentation/02-architecture/23-api-routing-and-contracts.md`).
- Add a frontend page: create `frontend/app/my-feature/page.tsx` and put UI in `frontend/components/MyFeature/` with PascalCase component names and corresponding CSS module or Tailwind classes (Tailwind config in `frontend/tailwind.config.ts`).

Edge-cases & constraints to be careful about
- Secrets: `.env.exemple` exists—never write secrets into repo. Use container env or CI secrets.
- CORS & auth: backend enforces origin restrictions; when calling APIs from the frontend in dev, ensure `CORS_ALLOW_ORIGIN` includes your host.
- DB migrations: run migrations in the backend container; do not manually edit `vendor/` files.

When to open a PR vs make small changes locally
- Small docs, typo fixes, or UI text tweaks: branch from `dev` and raise a small PR with screenshots. Run `npm run lint` and backend tests before PR.
- Any API/DB model/contract change: add migrations, API tests, update `Analyses/API_Contract.md`, and include a migration in `backend/migrations/` plus updated fixtures.

If uncertain, where to look / who to ask
- Docs centrales : `/Documentation/**` (architecture, contrats API, auth, data model, modules).
- SSO/auth : `/Documentation/08-auth-and-security/*` (SSO flow, rôles, JWT, provisioning).

Finish
- Keep changes minimal and run lint/tests in the relevant service. After adding or changing API resources, update migrations and include matching API tests in `backend/tests/`.

If any instruction here is unclear or you want more details on a specific subsystem, say which area (backend, frontend, docker, auth) and I'll expand.
