---
id: AUD-001
title: Journal d’activité
status: partial
owners: product/fullstack
last-reviewed: 2026-10-24
---

# Journal d’activité

## Résumé

CyberDoc conserve une trace légère des actions importantes afin d’identifier
l’auteur et la ressource concernée.

## Périmètre utilisateur

Les créations et modifications sensibles alimentent le journal. Les administrateurs
peuvent le consulter depuis `/admin/activity` ou interroger l’API. Les rapports,
l’export et la politique de conservation restent hors du périmètre actuel.

## Règles métier

- Une activité possède un type, un auteur, une ressource et une date.
- Les mutations critiques créent l’activité dans la même opération logique.
- Les logs ne contiennent ni secret, ni hash, ni contenu personnel complet.

## Architecture et données

Modèles Prisma `ActivityLog` et `ActivityType`; écritures présentes dans les routes
utilisateurs, documents et modèles selon les opérations prises en charge. Les
index composites suivent l'ordre stable `(createdAt DESC, id DESC)` et préfixent
cet ordre par `userId`, `activityTypeId` ou `resourceType` pour les filtres exacts.

## API et contrats

`GET /api/activity-logs` est admin-only. La route accepte `page` et `pageSize`
bornés, ainsi que `q`, `activityType`, `resourceType`, `userId`, `from` et `to`.
Elle renvoie une page stable triée par date puis identifiant décroissants.

## Interface

La page admin fournit recherche, filtres par type d’activité, type de ressource,
auteur et période, ainsi qu’une taille de page bornée et une pagination. Les
filtres appliqués sont conservés dans l’URL. La vue utilise une table sur écran
large et des cartes sur mobile; elle couvre les états chargement, vide et erreur.
Les libellés et dates sont disponibles en français et arabe, avec direction RTL.

## Permissions et sécurité

L’écriture utilise l’identité de session, jamais un auteur fourni par le client.
La consultation est réservée aux administrateurs et minimise la réponse : aucun
user-agent, e-mail, payload, secret, hash ou jeton n’est retourné.

## Erreurs et cas limites

Type d’activité absent, ressource supprimée, transaction échouée et volume croissant
nécessitent une stratégie explicite; aucun échec ne doit exposer le payload sensible.

## Tests et preuves

Les smokes admin et documents exercent plusieurs chemins producteurs.
`smoke:permissions` prouve les réponses `401/403`, la pagination admin, la
minimisation, le filtre de type et le rejet des bornes invalides. Le benchmark
temporaire `pnpm exec tsx scripts/performance/activity-log-query-benchmark.ts`
mesure les plans avant/après sur 250 000 lignes sans modifier les tables produit.
`smoke:admin` prouve le rendu, la recherche vide et le passage à la page suivante.
Le smoke UX exécute la route en français/arabe et desktop/mobile, y compris RTL,
clavier, débordement horizontal et violations Axe critiques/sérieuses.

## Exploitation

Le produit et le responsable légal doivent encore définir la durée de rétention,
les règles de purge, le besoin d’export et ses formats/droits, ainsi que les seuils
de supervision. Son statut reste `partial` jusque-là; l’interface et l’API ne
constituent pas un dispositif de conformité ou une politique de conservation. La pagination profonde
reste proportionnelle à l'offset et la recherche `q` avec `contains` impose encore
un parcours séquentiel; passer à un curseur ou ajouter `pg_trgm` exige d'abord des
mesures d'usage réelles.

## Historique

- 2026-10-24 — Interface admin FR/AR, responsive, filtrable et paginée ajoutée avec preuves E2E/UX.
- 2026-10-24 — Index de tri et filtres exacts justifiés sur 250 000 lignes synthétiques.
- 2026-10-24 — API admin paginée, filtrable et minimisée ajoutée avec preuves de permissions.
- 2026-10-24 — État réel et limites de l’audit documentés.
