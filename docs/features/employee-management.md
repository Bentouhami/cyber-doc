---
id: ADM-001
title: Gestion des employés
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-11-23
---

# Gestion des employés

## Résumé

L’administration permet de consulter, créer, modifier, activer, désactiver et
supprimer des comptes employés avec leurs rôles.

## Périmètre utilisateur

Le parcours principal est `/admin/employees`. Il comprend la liste, le formulaire
de création et la modification des informations, rôles et mots de passe. Les
filtres disposent de libellés accessibles et les champs de gestion conservent une
hauteur tactile minimale dans les deux langues.

## Règles métier

- Nom d’utilisateur, e-mail, prénom, nom, mot de passe initial et rôle sont requis
  à la création.
- Le nom d’utilisateur est normalisé en minuscules, unique et limité aux lettres,
  chiffres, points et underscores sur 3–30 caractères.
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
- Le propriétaire peut créer des employés et désigner un responsable délégué.
- Un responsable délégué ne peut créer et gérer que des employés.
- Le compte propriétaire ne peut être modifié par un responsable, désactivé,
  supprimé ou privé de son rôle.

## Architecture et données

UI dans `app/admin/employees` et `components/admin/employee-form.tsx`; API dans
`app/api/users`; données dans `User`, `UserRole`, `Role` et `Account`.

## API et contrats

`GET|POST /api/users` et `GET|PATCH|DELETE /api/users/[userId]`. Les deux mutations
JSON utilisent les schémas stricts centralisés de `lib/user-validation.ts` : les
champs inconnus, types ambigus, payloads vides et mots de passe faibles sont rejetés.
Création réussie : `201`; e-mail ou nom d’utilisateur dupliqué : `409`; entrée
invalide : `400`; accès insuffisant : `401/403`.

## Permissions et sécurité

Toutes les mutations exigent `owner` ou `responsible`, puis appliquent la hiérarchie
des rôles à la cible et aux rôles demandés. Les réponses excluent `passwordHash` et le
hash du compte credential. L’identité de l’administrateur courant provient du
provider de profil partagé, notamment pour les protections contre l’auto-suppression
et l’auto-désactivation.

## Erreurs et cas limites

Rôle inconnu, attribution owner interdite, modification du propriétaire par un
responsable, e-mail ou nom d’utilisateur dupliqué, suppression de soi-même et mise à jour concurrente
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

- 2026-11-24 — Filtres employés restructurés, champs tactiles et commande de
  visibilité du mot de passe rendue accessible en français et en arabe.
- 2026-11-23 — Ajout des rôles propriétaire/responsable et des protections de
  délégation dans l’API et l’interface bilingue.
- 2026-11-23 — Ajout du nom d’utilisateur unique dans le CRUD, les DTOs et la
  migration des comptes existants.
- 2026-10-24 — Réutilisation du profil partagé dans la gestion des employés.
- 2026-10-24 — Correction de l’invariant Better Auth lors de la création.
- 2026-10-24 — Révocation transactionnelle des sessions lors des mutations sensibles.
- 2026-10-24 — Validation Zod centralisée et politique de mot de passe partagée.
