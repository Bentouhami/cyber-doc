---
id: ADM-001
title: Gestion des employés
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-10-24
---

# Gestion des employés

## Résumé

L’administration permet de consulter, créer, modifier, activer, désactiver et
supprimer des comptes employés avec leurs rôles.

## Périmètre utilisateur

Le parcours principal est `/admin/employees`. Il comprend la liste, le formulaire
de création et la modification des informations, rôles et mots de passe.

## Règles métier

- E-mail, prénom, nom, mot de passe initial et rôles sont requis à la création.
- L’e-mail est normalisé en minuscules, limité à 254 caractères et unique sans
  distinction de casse.
- Les noms sont nettoyés, bornés à 100 caractères et refusent les caractères de
  contrôle. Les rôles sont une liste non vide de noms normalisés et bornés.
- Le mot de passe comporte 8 à 128 caractères, avec au moins une majuscule, une
  minuscule et un chiffre. La même politique alimente Zod, l’administration et les
  limites Better Auth.
- La mise à jour d’un mot de passe remplace les hashes applicatif et Better Auth.
- La désactivation, la suppression logique et le changement de mot de passe
  révoquent toutes les sessions du compte dans la même transaction.
- La suppression ne peut pas retirer le compte administrateur courant.

## Architecture et données

UI dans `app/admin/employees` et `components/admin/employee-form.tsx`; API dans
`app/api/users`; données dans `User`, `UserRole`, `Role` et `Account`.

## API et contrats

`GET|POST /api/users` et `GET|PATCH|DELETE /api/users/[userId]`. Les deux mutations
JSON utilisent les schémas stricts centralisés de `lib/user-validation.ts` : les
champs inconnus, types ambigus, payloads vides et mots de passe faibles sont rejetés.
Création réussie : `201`; doublon : `409`; entrée invalide : `400`; accès
insuffisant : `401/403`.

## Permissions et sécurité

Toutes les mutations sont admin-only. Les réponses excluent `passwordHash` et le
hash du compte credential. L’identité de l’administrateur courant provient du
provider de profil partagé, notamment pour les protections contre l’auto-suppression
et l’auto-désactivation.

## Erreurs et cas limites

Rôle inconnu, e-mail dupliqué, suppression de soi-même et mise à jour concurrente
doivent échouer sans compte partiellement configuré. Les erreurs publiques utilisent
des codes stables et ne reproduisent jamais une valeur de mot de passe ni une erreur
ORM interne.

## Tests et preuves

`pnpm run smoke:admin` teste le rendu et le cycle création, modification, suppression.
`pnpm run smoke:permissions` teste le cycle actif/inactif, la révocation de session,
le changement de mot de passe et le refus de reconnexion après suppression.
`tests/unit/user-validation.test.ts` couvre normalisation, limites, complexité,
caractères de contrôle, rôles invalides, champs inconnus et confusion de types;
`pnpm run check:contracts` prouve que POST et PATCH valident le JSON reçu.

## Exploitation

Les mutations critiques créent une activité. Le seed maintient un admin et un
employee de test de manière idempotente.

## Historique

- 2026-10-24 — Réutilisation du profil partagé dans la gestion des employés.
- 2026-10-24 — Correction de l’invariant Better Auth lors de la création.
- 2026-10-24 — Révocation transactionnelle des sessions lors des mutations sensibles.
- 2026-10-24 — Validation Zod centralisée et politique de mot de passe partagée.
