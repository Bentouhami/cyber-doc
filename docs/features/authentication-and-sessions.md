---
id: AUTH-001
title: Authentification et sessions
status: production-candidate
owners: fullstack/security
last-reviewed: 2026-11-23
---

# Authentification et sessions

## Résumé

CyberDoc authentifie les employés par nom d’utilisateur ou e-mail avec le même mot
de passe, puis maintient leur session côté serveur avec Better Auth et Prisma.

## Périmètre utilisateur

Le formulaire `/` ouvre une session et redirige vers l’espace autorisé. La
déconnexion ferme la session. L’inscription publique n’est pas un parcours produit.

## Règles métier

- L’utilisateur doit exister, être actif et posséder un compte `credential`.
- Le nom d’utilisateur est unique, normalisé en minuscules et limité à 3–30
  caractères alphanumériques, points ou underscores.
- Le mot de passe est toujours stocké sous forme de hash.
- La politique partagée impose 8 à 128 caractères, une majuscule, une minuscule et
  un chiffre pour les créations et remplacements administratifs; les limites
  Better Auth sont explicitement alignées à 8/128.
- `Account.accountId` d’un compte credential est égal à `User.id`.
- L’inscription publique est rejetée à la frontière HTTP avant Better Auth et tout
  accès base; les comptes sont créés par un administrateur.
- Une désactivation, une suppression logique ou un changement de mot de passe
  révoque immédiatement toutes les sessions du compte.
- Chaque connexion réussie par nom d'utilisateur ou e-mail crée un événement
  `LOGIN` daté, lié à l'employé et à la session; les tentatives échouées ne sont
  pas enregistrées comme des connexions.

## Architecture et données

Points clés : `lib/auth.ts`, `lib/auth-client.ts`, plugin username Better Auth,
`lib/prisma.ts`, modèles Prisma `User`, `Account` et `Session`. La migration attribue
un identifiant stable à chaque compte existant; le propriétaire peut ensuite le
remplacer par un nom convivial.

## API et contrats

Better Auth expose `/sign-in/email` et `/sign-in/username` sous `/api/auth/[...all]`.
`GET /api/users/me` renvoie
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
génériques. Après connexion, seules les destinations internes commençant par `/`
sont acceptées; les URL externes, protocol-relative ou malformées retombent sur
`/documents`. Les mots de passe, hashes et jetons ne doivent jamais être journalisés.
En production, une URL canonique d’authentification est obligatoire. Seule son
origine et les origines exactes optionnelles de `BETTER_AUTH_TRUSTED_ORIGINS` sont
approuvées; les origines localhost de confort ne sont ajoutées qu’en développement.
Les URL non HTTP(S), avec credentials, query/fragment ou origine additionnelle avec
un chemin sont rejetées au démarrage; un hôte public HTTP est refusé en production.
Better Auth active son limiteur par défaut en production (3 requêtes de connexion
par fenêtre de 10 secondes), mais son stockage mémoire et la résolution de
`x-forwarded-for` ne constituent pas encore le contrat final multi-instance/proxy.
Le passage au stockage PostgreSQL partagé, le seuil plus long et les CIDR de proxy
doivent être explicitement approuvés et testés avant exposition de l'origine.

## Erreurs et cas limites

Compte ou nom d’utilisateur absent, compte désactivé, mot de passe invalide, session
expirée et ancienne forme de hash sont traités avec la même erreur générique sans
divulguer l’existence d’un compte. Si le profil courant
ne peut pas être vérifié, la garde reste fermée, affiche une erreur accessible et
permet de relancer le chargement sans exposer le contenu protégé.

## Tests et preuves

`smoke:permissions` vérifie aussi le refus de l’inscription publique, le blocage
d’un compte désactivé ou supprimé et la révocation des sessions après désactivation,
suppression et changement de mot de passe. Les smokes admin et documents ouvrent
également des sessions réelles avec une base migrée et seedée, puis le smoke admin
vérifie la présence de l'événement `LOGIN` correspondant.

## Exploitation

`BETTER_AUTH_SECRET`, l’URL publique et `DATABASE_URL` sont fournis par
l’environnement. `BETTER_AUTH_TRUSTED_ORIGINS` est une liste séparée par des virgules
et reste vide pour un déploiement same-origin. Une modification du schéma Better
Auth exige une migration. En production, le seed exige explicitement
`SEED_ADMIN_EMAIL`, `SEED_OWNER_USERNAME` et `SEED_ADMIN_PASSWORD`; il ne fournit
aucun compte ou mot de passe de démonstration. Une nouvelle exécution du seed ne
modifie ni l’identité, ni les identifiants, ni les sessions d’un compte existant.

## Historique

- 2026-11-23 — Refus de l’inscription publique déplacé avant Better Auth pour ne
  jamais ouvrir de transaction sur ce parcours interdit.
- 2026-11-23 — Limiteur Better Auth existant audité; stockage partagé, fenêtre de
  connexion et proxy de confiance identifiés comme gate de production.
- 2026-11-23 — Bootstrap de production explicite et seed idempotent sans mutation
  des comptes ou sessions existants.
- 2026-11-23 — Journal `LOGIN` écrit après chaque authentification réussie.
- 2026-11-23 — Connexion par nom d’utilisateur ou e-mail via le plugin Better Auth,
  migration des comptes existants et formulaire FR/AR sans inscription publique.
- 2026-10-24 — Client de session aligné sur l’origine courante du navigateur.
- 2026-10-24 — Résultats de profil obsolètes ignorés et erreur de garde récupérable.
- 2026-10-24 — Chargement du profil consolidé en une requête initiale par session.
- 2026-10-24 — Alignement Better Auth 1.7 et documentation canonique.
- 2026-10-24 — Politique utilisateur actif et révocation immédiate des sessions.
- 2026-10-24 — Origines de production fail-closed et limites mot de passe explicites.
