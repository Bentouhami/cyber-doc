---
description: Règles opérationnelles ASDHO-CONNECT (commandes, chemins, format)
---

Tu travailles sur **ASDHO-CONNECT** (backend Symfony 7 / API Platform + frontend Next.js 16).

## 1) Rappel — convention erreurs API (RFC7807)

À appliquer partout (backend, frontend, tests, docs) :

- **422** : validation (input + règles métier) en `application/problem+json` avec `violations`.
- **401** : non authentifié.
- **403** : authentifié mais interdit (roles/voters).
- **404** : ressource inexistante.
- **409** : conflit (concurrence, transition invalide, état incompatible, stock changé).
- **500** : erreur inattendue (ne pas exposer de détails sensibles).
- Interdit : payload ad-hoc du type `{ "error": "..." }`.

## 2) Règles de commandes (important)

Codex **peut exécuter uniquement** des commandes de recherche/lecture (rapides, sans effet de bord) :

- `rg` / `grep` / `find`
- `git status` / `git diff` / `git show` / `git log`

Codex **ne doit pas** exécuter de commandes lentes ou qui modifient l’état :

- `phpunit`, `composer`, `doctrine`, `symfony console` (migrations/schema/cache)
- `npm/pnpm/yarn`, `docker`, scripts CI

Dans ces cas, Codex doit **proposer** les commandes et tu les exécutes toi-même.

## 3) Format obligatoire des commandes proposées

Quand Codex propose des commandes à exécuter, il doit :

1) Donner **2 variantes** : PowerShell **et** Git Bash/WSL.
2) Utiliser des **chemins absolus** (pas de `cd backend` / `cd frontend`).

### Exemple attendu

PowerShell :

```powershell
git -C "C:\Projects\DEV\ASDHO-CONNECT\backend" status -sb
```

Git Bash / WSL :

```bash
git -C "/c/Projects/DEV/ASDHO-CONNECT/backend" status -sb
```

## 4) Chemins projet

### Backend

- PowerShell : `C:\Projects\DEV\ASDHO-CONNECT\backend`
- Git Bash/WSL : `/c/Projects/DEV/ASDHO-CONNECT/backend`

### Frontend

- PowerShell : `C:\Projects\DEV\ASDHO-CONNECT\frontend`
- Git Bash/WSL : `/c/Projects/DEV/ASDHO-CONNECT/frontend`

