# Archived because fully covered by skill: asdhoconnect-auth-session-network
# Skill: `.codex/skills/asdhoconnect-auth-session-network/SKILL.md`
# Date: 2025-12-30

---
description: Auth Entra + refresh + réseau (Next.js 16) — flux pro et UX
---

# Auth / Refresh / Réseau — implémentation pro (Next.js 16 + API Platform)

Tu travailles sur **ASDHO-CONNECT**. Objectif : un flux d’auth robuste qui **ne freeze pas**, **n’affiche pas de toasts fantômes**, et reste **sécurisé**.

## Contraintes

- Respecte `../../rules/global_rules.md` et `../../rules/asdho_operational_rules.md`.
- Ne pas exécuter de commandes lentes ; proposer les commandes si besoin.
- Pas de fuite technique dans les messages user-facing.

## Contexte connu

- Cookies : `ASDHO_APP` (token app) et `ASDHO_REFRESH` (refresh).
- Routes proxys Next.js : `/api/v1/identity/me` et `/api/v1/identity/token/refresh`.

## Scénarios à gérer (obligatoires)

> Définis des codes stables et testables.

### S1 — Aucun cookie

- `ASDHO_APP` ❌ et `ASDHO_REFRESH` ❌
- Comportement : rester silencieux, aucun toast.
- `/api/v1/identity/me` : `401` RFC7807 avec `code: "no_session"`.

### S2 — Refresh seul

- `ASDHO_APP` ❌ et `ASDHO_REFRESH` ✅
- Comportement : tenter un refresh **une seule fois**.
- Si backend unreachable : toast réseau/VPN.
- Si refresh 401/403 : logout silencieux.

### S3 — Utilisateur connecté

- `ASDHO_APP` ✅ (refresh optionnel)
- Comportement : appels normaux, sur `401` → refresh 1 fois, sinon erreur.
- Si `502/504/fetch failed` : toast réseau/VPN.

## Travail demandé

1. **Audit** des fichiers existants (front) liés à ces flows.
2. Implémenter une **gestion globale** des problèmes de session/réseau :
   - bus d’évènements (ex : `notifySessionIssue`)
   - provider UI (Sonner) avec **déduplication**
   - hook réseau `online/offline` (optionnel mais recommandé)
3. Mettre à jour les proxys Next.js pour :
   - répondre en RFC7807 (y compris backend unreachable)
   - différencier `no_session` vs `refresh_possible`
4. Mettre à jour le client API (`frontend/lib/api/client.ts`) pour :
   - tenter refresh 1 fois sur 401 (sauf `no_session`)
   - notifier sur `502/504/fetch failed` uniquement si S2/S3
   - ne pas faire de retries infinis
5. Ajouter une **doc** : `Documentation/architecture/auth-network-refresh.md`
   - résumé, scénarios, fichiers impactés, tests manuels.

## Définition “backend unreachable”

Détecter :

- `fetch` qui lève (ECONNREFUSED, UND_ERR_SOCKET, etc.)
- réponses `502` / `504` des proxys

> Attention : `navigator.onLine` ne garantit pas l’accès au backend ; c’est un signal UI “offline”, pas une preuve de disponibilité serveur.

## Format attendu (réponse Codex)

- Liste précise des fichiers modifiés, avec explications courtes.
- Patchs minimalistes et reviewables.
- Doc Markdown prête à commit.
- Plan de tests manuels reproductibles.

