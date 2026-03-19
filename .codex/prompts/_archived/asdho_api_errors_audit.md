# Archived because fully covered by skill: asdhoconnect-rfc7807-audit

## Skill: `.codex/skills/asdhoconnect-rfc7807-audit/SKILL.md`

## Date: 2025-12-30

---

## description: Audit + standardisation des erreurs API (RFC7807) — ASDHO-CONNECT

---

## Audit RFC7807 — erreurs API (backend + frontend)

Tu travailles sur **ASDHO-CONNECT** (Symfony 7 / API Platform + Next.js 16). Objectif : **standardiser** toutes les erreurs au format **RFC7807** (`application/problem+json`).

## Contexte / contraintes

- Respecte `../../rules/global_rules.md` et `../../rules/asdho_operational_rules.md`.
- Ne pas exécuter de commandes lentes ou modifiant l’état (tu proposes, je lance).
- Ne pas exposer de détails sensibles dans les réponses client.

## Ce que tu dois produire

1. Une **liste des endpoints** (backend + proxys Next.js) qui ne respectent pas RFC7807.
2. Un **patch** (ou une proposition de patchs) pour standardiser :
   - `422` validation avec `violations`
   - `401/403/404/409/500` conformes
3. Une **checklist de tests** (manuels + tests API si pertinent) pour valider les changements.
4. Un court **document Markdown** à ajouter dans `Documentation/architecture/` (nom proposé : `api-problem-details-rfc7807.md`).

## Méthode demandée (pas à pas)

### 1) Cartographier les points d’entrée

- Backend : contrôleurs, processors, state providers, listeners, normalizers.
- Frontend : routes `frontend/app/api/**` et client fetch (`frontend/lib/api/**`).

## Commandes autorisées (lecture uniquement)

PowerShell :

```powershell
rg -n "application/problem\+json|problem\+json|violations|ConstraintViolationList|throw new|NextResponse\.json\(" "C:\Projects\DEV\ASDHO-CONNECT-CLEAN"
```

Git Bash / WSL :

```bash
rg -n "application/problem\+json|problem\+json|violations|ConstraintViolationList|throw new|NextResponse\.json\(" "/c/Projects/DEV/ASDHO-CONNECT-CLEAN"
```

### 2) Identifier les anti-patterns

- JSON ad-hoc : `{ "error": ... }`, `{ "message": ... }` sans RFC7807.
- Statuts incohérents (ex: règles métier en 400 au lieu de 422/409, 500 qui leak).
- Frontend qui “devine” les erreurs ou masque un 4xx/5xx.

### 3) Proposer le standard (backend)

- Décrire **où** centraliser : listener/normalizer `ProblemDetailsNormalizer` ou équivalent.
- Rappeler les champs : `type`, `title`, `status`, `detail`, `code`, `violations`.
- Proposer une table `code` stable (ex : `no_session`, `refresh_possible`, `stock_conflict`, etc.).

### 4) Proposer le standard (frontend)

- Les proxys Next.js doivent **retourner** `application/problem+json` quand le backend est unreachable ou renvoie une erreur déjà RFC7807.
- Le client API doit parser RFC7807, conserver `status`, et ne pas leak de contenu.

## Livrable — format attendu

### A) Résultats d’audit (Markdown)

- Endpoints impactés :
  - Backend : liste + fichier + fonction
  - Frontend : route proxy + client
- Pour chaque point :
  - Statut actuel
  - Problème
  - Correction proposée

### B) Patch

- Diff minimal et reviewable.
- Respecter les conventions d’imports, nommage, structure du repo.

### C) Tests

- Liste de tests manuels reproductibles.
- Si tu ajoutes des tests automatisés : expliquer leur placement.

## Notes de sécurité

- Messages côté UI : *neutres* (pas d’IP/port/stack).
- Logs serveur uniquement pour la cause technique.
