---
id: SEC-001
title: Autorisations et rôles
status: production-candidate
owners: fullstack/security
last-reviewed: 2026-10-31
---

# Autorisations et rôles

## Résumé

Le contrôle d’accès distingue les rôles `admin` et `employee` et protège les pages
ainsi que chaque API sensible.

## Périmètre utilisateur

Les administrateurs gèrent employés et modèles. Les employés utilisent les modèles,
personas et documents sans pouvoir administrer les comptes ou le catalogue.

## Règles métier

- Une page masquée ne constitue jamais une autorisation.
- Toute route protégée vérifie la session puis le rôle côté serveur.
- Toute autorisation vérifie également que le compte est activé, non désactivé et
  non supprimé à partir de l’identité immuable de session.
- Un utilisateur ne peut pas retirer son propre dernier rôle administrateur.

## Architecture et données

Les rôles sont persistés par `Role` et `UserRole`. `proxy.ts`, `lib/admin-auth.ts`
et `lib/permissions.ts` portent les contrôles partagés.

## API et contrats

Une session absente produit `401`; un rôle insuffisant produit `403`. Les routes
admin conservent cette distinction pour permettre un diagnostic fiable.

## Permissions et sécurité

Les décisions utilisent les rôles issus de la base, jamais une valeur fournie par le
client. Les listes de documents, créateurs et statuts ainsi que les aperçus et
téléchargements exigent explicitement `employee` ou `admin`; une session valide sans
ces rôles reçoit `403`. Les assets DOCX bruts de modèle restent admin-only. Les
changements de rôle sont réservés aux administrateurs.

## Erreurs et cas limites

Sessions expirées ou révoquées, utilisateur désactivé ou supprimé, rôle inconnu et
tentative d’auto-destitution sont refusés sans modification partielle.

## Tests et preuves

`pnpm run smoke:permissions` couvre invité, employee et admin sur les principales API,
y compris les référentiels documentaires et le refus d’asset brut. Le test unitaire
`tests/unit/permissions.test.ts` couvre aussi le drift vers aucun rôle ou un rôle inconnu.

## Exploitation

Les refus `401/403` sont observables sans inclure de données personnelles. Toute
nouvelle route doit rejoindre la matrice de permissions du smoke test.

## Historique

- 2026-10-31 — Gardes explicites et tests adverses de dérive de rôle sur les lectures PII/documents.
- 2026-10-24 — Formalisation de la frontière admin/employee.
- 2026-10-24 — Refus centralisé des comptes inactifs sur pages et API.
