# Documentation routing (ASDHO-CONNECT)

## 1) Principes

- `/Documentation` est la source de vérité unique pour la documentation active.
- Les points d'entrée métier sont désormais les dossiers module-first :
  - `Documentation/orders/`
  - `Documentation/identity/`
  - `Documentation/inventory/`
  - `Documentation/notifications/`
  - `Documentation/shared/`
- Les dossiers numérotés restent valides uniquement pour le transverse, le global, l'ops, le testing ou l'historique utile.
- Ne pas recréer de structure active dans `docs/`, `doc/` ou `Documentation_REFACTORED/`.
- `Documentation/09-business-modules/` est legacy et ne reste actif que pour `NewWorkers`.
- `Analyses/` n'est pas une source documentaire canonique.

## 2) Cibles canoniques principales

### Entrées globales

- `Documentation/README.md`
- `Documentation/00-overview/00-project-summary.md`
- `Documentation/00-overview/01-services-and-roles.md`
- `Documentation/00-overview/02-glossary.md`
- `Documentation/00-overview/03-project-structure.md`
- `Documentation/00-overview/04-conventions-and-style.md`

### Modules actifs

- Orders : `Documentation/orders/README.md`
- Identity : `Documentation/identity/README.md`
- Inventory : `Documentation/inventory/README.md`
- Notifications : `Documentation/notifications/README.md`
- Shared : `Documentation/shared/README.md`

### Transverse / global

- Architecture transverse : `Documentation/02-architecture/*`
- Backend global : `Documentation/03-backend/*`
- Frontend global : `Documentation/04-frontend/*`
- Base de données globale : `Documentation/05-database/*`
- DevOps / environnements : `Documentation/06-devops-and-environments/*`
- CI / testing : `Documentation/07-ci-and-testing/*`, `Documentation/12-testing/*`
- Notes opérationnelles globales : `Documentation/10-operational-notes/*`
- Outillage documentaire : `Documentation/11-tools-and-scripts/*`

## 3) Routage par type de changement

| Type de changement | Zones de code typiques | Documentation à mettre à jour |
| --- | --- | --- |
| Feature Orders | `frontend/app/(orders)/**`, `backend/src/Entity/Orders/**`, `backend/src/Service/Orders/**`, `backend/src/State/Orders/**` | `Documentation/orders/README.md` + sous-docs `architecture/`, `backend/`, `frontend/`, `security/`, `operations/`, `issues-and-fixes/` |
| Feature Identity / auth | `frontend/app/api/v1/identity/**`, `frontend/services/identity.ts`, `backend/src/Controller/Identity/**`, `backend/src/Service/Identity/**`, `backend/src/Entity/Identity/**` | `Documentation/identity/README.md` + `architecture/`, `backend/`, `frontend/`, `security/` |
| Feature Inventory | `frontend/app/(inventory)/**`, `frontend/services/inventory.ts`, `backend/src/Entity/Inventory/**`, `backend/src/Service/Inventory/**`, `backend/src/State/Inventory/**` | `Documentation/inventory/README.md` + `architecture/`, `backend/`, `frontend/`, `security/`, `operations/` |
| Feature Notifications | `frontend/app/api/v1/admin/notifications/**`, `frontend/services/notifications.ts`, `backend/src/Entity/Notifications/**`, `backend/src/Service/Notifications/**` | `Documentation/notifications/README.md` + `architecture/`, `backend/`, `frontend/`, `security/`, `overview/` |
| Interaction transverse | flux entre plusieurs modules | `Documentation/shared/README.md` + `Documentation/shared/interactions/*` |
| Contrat API transverse | API Platform, routes, conventions DTO/Zod | `Documentation/02-architecture/23-api-routing-and-contracts.md`, `Documentation/04-frontend/42-api-consumption-strategy.md`, `Documentation/04-frontend/43-zod-types-and-validation.md` |
| Doctrine / modèle de données global | entités, migrations, relations | `Documentation/03-backend/33-doctrine-and-entities.md`, `Documentation/05-database/*` |
| DevOps / env / déploiement | compose, Dockerfile, Coolify, env | `Documentation/06-devops-and-environments/*` |
| CI / tests | workflows, suites, stratégie qualité | `Documentation/07-ci-and-testing/*`, `Documentation/12-testing/*` |
| NewWorkers | `backend/src/Entity/NewWorkers/**`, `frontend/services/new-workers.ts`, `frontend/components/New-workers/**` | conserver le flux legacy `Documentation/09-business-modules/new-workers/*` |

## 4) Diagrammes

- Diagrammes de module : dans le dossier `diagrams/` du module concerné quand il existe
  - ex. `Documentation/orders/diagrams/`
  - ex. `Documentation/inventory/diagrams/`
  - ex. `Documentation/notifications/diagrams/`
- Diagrammes transverses : `Documentation/02-architecture/diagrams/` ou `Documentation/05-database/diagrams/`
- `Documentation/09-business-modules/diagrams/` ne reste pertinent que pour `NewWorkers`

## 5) Règle de décision rapide

1. Si le lecteur cherche un module métier précis, documenter dans le dossier du module.
2. Si l'information s'applique à plusieurs modules, documenter dans `shared/` ou dans un dossier global transverse.
3. Si le document n'est plus une source active, archiver sous `Documentation/99-archives/`.
4. Si un legacy doc contient encore de la valeur, migrer seulement l'information utile vers la cible canonique actuelle.

## 6) Definition of Done

- [ ] Le bon dossier module-first ou global a été choisi
- [ ] Aucune doc active n'a été créée hors `/Documentation`
- [ ] Les liens pointent vers la structure actuelle
- [ ] Les impacts sécurité / contrats / ops sont documentés au bon endroit
- [ ] Les anciens emplacements ne sont pas réintroduits dans les références
