---
id: SEC-001
title: Autorisations et rôles
status: production-candidate
owners: fullstack/security
last-reviewed: 2026-11-23
---

# Autorisations et rôles

## Résumé

Le contrôle d’accès distingue les rôles `owner`, `responsible` et `employee` et
protège les pages ainsi que chaque API sensible. Le rôle historique `admin` reste
accepté uniquement pendant la transition des bases existantes.

## Périmètre utilisateur

Le propriétaire gère toute l’application et désigne les responsables délégués. Un
responsable gère les employés, les modèles et le back-office, mais ne peut jamais
modifier ou supprimer le propriétaire. Les employés utilisent les modèles, personas
et documents sans pouvoir administrer les comptes ou le catalogue.

## Règles métier

- Une page masquée ne constitue jamais une autorisation.
- Toute route protégée vérifie la session puis le rôle côté serveur.
- Toute autorisation vérifie également que le compte est activé, non désactivé et
  non supprimé à partir de l’identité immuable de session.
- Le rôle `owner` ne peut être créé, transféré ou retiré par les APIs de gestion.
- Seul le propriétaire peut attribuer ou retirer le rôle `responsible`.
- Un responsable peut gérer uniquement des comptes `employee`.
- Le compte propriétaire ne peut jamais être désactivé ou supprimé.

## Architecture et données

Les rôles sont persistés par `Role` et `UserRole`. `proxy.ts`, `lib/admin-auth.ts`
et `lib/permissions.ts` portent les contrôles partagés.

## API et contrats

Une session absente produit `401`; un rôle insuffisant produit `403`. Les routes
admin conservent cette distinction pour permettre un diagnostic fiable.

## Permissions et sécurité

Les décisions utilisent les rôles issus de la base, jamais une valeur fournie par le
client. Les listes de documents, créateurs et statuts ainsi que les aperçus et
téléchargements exigent explicitement un employé ou un rôle de gestion; une session
valide sans ces rôles reçoit `403`. Les assets DOCX bruts de modèle restent réservés
au propriétaire et aux responsables. Les décisions de gestion des comptes sont
centralisées et revalidées côté API.

## Erreurs et cas limites

Sessions expirées ou révoquées, utilisateur désactivé ou supprimé, rôle inconnu et
tentative d’auto-destitution sont refusés sans modification partielle.

## Tests et preuves

`pnpm run smoke:permissions` couvre invité, employee et owner sur les principales API,
y compris les référentiels documentaires et le refus d’asset brut. Les tests unitaires
`permissions.test.ts` et `management-role-policy.test.ts` couvrent la hiérarchie, la
protection du propriétaire et les attributions interdites.

## Exploitation

Les refus `401/403` sont observables sans inclure de données personnelles. Toute
nouvelle route doit rejoindre la matrice de permissions du smoke test.

## Historique

- 2026-11-23 — Remplacement du rôle admin par owner/responsible, migration des
  comptes existants et protection serveur du propriétaire.
- 2026-10-31 — Gardes explicites et tests adverses de dérive de rôle sur les lectures PII/documents.
- 2026-10-24 — Formalisation de la frontière admin/employee.
- 2026-10-24 — Refus centralisé des comptes inactifs sur pages et API.
