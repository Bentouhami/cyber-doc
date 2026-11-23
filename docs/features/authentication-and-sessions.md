---
id: AUTH-001
title: Authentification et sessions
status: production-candidate
owners: fullstack/security
last-reviewed: 2026-10-24
---

# Authentification et sessions

## Résumé

CyberDoc authentifie les employés et administrateurs par e-mail et mot de passe,
puis maintient leur session côté serveur avec Better Auth et Prisma.

## Périmètre utilisateur

Le formulaire `/` ouvre une session et redirige vers l’espace autorisé. La
déconnexion ferme la session. L’inscription publique n’est pas un parcours produit.

## Règles métier

- L’utilisateur doit exister, être actif et posséder un compte `credential`.
- Le mot de passe est toujours stocké sous forme de hash.
- La politique partagée impose 8 à 128 caractères, une majuscule, une minuscule et
  un chiffre pour les créations et remplacements administratifs; les limites
  Better Auth sont explicitement alignées à 8/128.
- `Account.accountId` d’un compte credential est égal à `User.id`.
- L’inscription publique Better Auth est désactivée; les comptes sont créés par un
  administrateur.
- Une désactivation, une suppression logique ou un changement de mot de passe
  révoque immédiatement toutes les sessions du compte.

## Architecture et données

Points clés : `lib/auth.ts`, `lib/auth-client.ts`, `lib/prisma.ts`, modèles Prisma
`User`, `Account` et `Session`. La migration d’alignement Better Auth préserve les
comptes existants.

## API et contrats

Better Auth est exposé sous `/api/auth/[...all]`. `GET /api/users/me` renvoie
l’utilisateur courant et ses rôles ou `401` sans session valide. Le provider de
profil racine est l’unique client initial de cette route; gardes, en-têtes et pages
réutilisent son état et sa fonction de rafraîchissement au lieu de dupliquer les
requêtes. Chaque chargement porte le sujet de session et une génération; un résultat
obsolète ne peut donc pas remplacer le profil d'une session plus récente.
Le client Better Auth utilise l’origine courante du navigateur puisque l’API est
same-origin; un alias local ou un hôte de prévisualisation ne peut donc pas envoyer
la requête de session vers un autre domaine et perdre son cookie.

## Permissions et sécurité

Les cookies de session sont gérés par Better Auth. Une politique centrale exige
`activatedAt`, interdit `deactivatedAt` et `deletedAt`, puis elle est appliquée à
la connexion, aux pages protégées et aux API. Les erreurs de connexion restent
génériques. Les mots de passe, hashes et jetons ne doivent jamais être journalisés.
En production, une URL canonique d’authentification est obligatoire. Seule son
origine et les origines exactes optionnelles de `BETTER_AUTH_TRUSTED_ORIGINS` sont
approuvées; les origines localhost de confort ne sont ajoutées qu’en développement.
Les URL non HTTP(S), avec credentials, query/fragment ou origine additionnelle avec
un chemin sont rejetées au démarrage; un hôte public HTTP est refusé en production.

## Erreurs et cas limites

Compte absent, désactivé, mot de passe invalide, session expirée et ancienne forme
de hash sont traités sans divulguer l’existence d’un compte. Si le profil courant
ne peut pas être vérifié, la garde reste fermée, affiche une erreur accessible et
permet de relancer le chargement sans exposer le contenu protégé.

## Tests et preuves

`smoke:permissions` vérifie aussi le refus de l’inscription publique, le blocage
d’un compte désactivé ou supprimé et la révocation des sessions après désactivation,
suppression et changement de mot de passe. Les smokes admin et documents ouvrent
également des sessions réelles avec une base migrée et seedée.

## Exploitation

`BETTER_AUTH_SECRET`, l’URL publique et `DATABASE_URL` sont fournis par
l’environnement. `BETTER_AUTH_TRUSTED_ORIGINS` est une liste séparée par des virgules
et reste vide pour un déploiement same-origin. Une modification du schéma Better
Auth exige une migration.

## Historique

- 2026-10-24 — Client de session aligné sur l’origine courante du navigateur.
- 2026-10-24 — Résultats de profil obsolètes ignorés et erreur de garde récupérable.
- 2026-10-24 — Chargement du profil consolidé en une requête initiale par session.
- 2026-10-24 — Alignement Better Auth 1.7 et documentation canonique.
- 2026-10-24 — Politique utilisateur actif et révocation immédiate des sessions.
- 2026-10-24 — Origines de production fail-closed et limites mot de passe explicites.
