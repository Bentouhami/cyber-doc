# ADR-006: Séparer les migrations et imposer des images immuables

## Statut

Accepté

## Date

2026-10-30

## Contexte

L’ancien conteneur d’application annonçait des migrations au démarrage mais son
image standalone ne contenait pas Prisma CLI et pouvait les ignorer silencieusement.
Compose taguait aussi l’application `latest`, ce qui empêchait de prouver quelle
révision avait été testée ou de sélectionner précisément l’image de rollback.

Une migration de schéma et le démarrage du serveur ont des responsabilités et des
profils de risque différents. La première doit terminer une fois, avec un outil
privilégié et une preuve; le runtime doit rester minimal et ne jamais modifier le
schéma implicitement.

## Décision

- Le Dockerfile produit une cible `migrator` contenant Prisma et une cible
  `runner` contenant uniquement le runtime Next.js standalone.
- Compose exécute `migrate` comme service one-shot et ne démarre `web` qu’après
  sa réussite.
- `CYBERDOC_IMAGE` et `CYBERDOC_MIGRATOR_IMAGE` sont des références immuables
  (digest ou tag SHA) construites depuis la même révision. `latest` est interdit.
- Les migrations descendantes ne sont jamais automatiques. Un changement de
  schéma incompatible utilise une procédure approuvée avec sauvegarde/restauration.
- CI doit construire les deux cibles; un build local sans Docker ne constitue pas
  une preuve de release.

## Alternatives considérées

### Migrer dans l’entrypoint de l’application

Rejetée: plusieurs réplicas peuvent lancer la migration en concurrence, un échec
peut être masqué, et le runtime doit embarquer des outils inutiles après démarrage.

### Utiliser `latest`

Rejetée: le tag est mutable, empêche la reproduction de la preuve et rend le
rollback ambigu.

### Exécuter les migrations manuellement sans artefact dédié

Rejetée comme chemin normal: la commande et les dépendances peuvent différer de
la révision déployée et la preuve opérationnelle devient fragile.

## Conséquences

- Le déploiement doit fournir deux références d’image et vérifier qu’elles
  correspondent à la même révision.
- Un échec du migrateur bloque le serveur.
- Le rollback applicatif sélectionne explicitement l’image précédente; la base
  n’est restaurée que selon le runbook et une preuve de sauvegarde vérifiée.
- La CI et la protection de branche doivent exiger le job
  `Production container targets`.
- Les secrets et l’URL de base restent injectés au runtime, jamais dans l’image.
