# ADR-005: Migrer de npm vers pnpm 12

## Statut

Accepté

## Date

2026-10-24

## Contexte

Le dépôt contenait simultanément `package-lock.json`, `pnpm-lock.yaml` et une
configuration `pnpm-workspace.yaml`, alors que `package.json` imposait npm. Cette
situation rendait `pnpm install` impossible et entretenait deux représentations
potentiellement divergentes du graphe de dépendances.

## Décision

Adopter pnpm 12.15.0 comme gestionnaire unique. `pnpm-lock.yaml` devient le seul
lockfile, `pnpm-workspace.yaml` contient la politique des scripts de build et le
champ `packageManager` impose la même version localement, dans GitHub Actions et
dans Docker. Les installations propres utilisent `--frozen-lockfile`.

Les scripts de build des dépendances sont refusés par défaut et seuls les paquets
nécessaires au runtime sont autorisés dans `allowBuilds`. Les agent skills fournis
par des paquets sont désactivés : les instructions IA doivent provenir uniquement
des fichiers de gouvernance revus dans ce dépôt.

Le premier audit pnpm a également exposé des versions transitives vulnérables que
l’ancien lockfile ne signalait pas. Des overrides limités aux plages affectées
imposent les versions corrigées; ils devront être retirés lorsque leurs dépendances
parentes les résoudront nativement.

## Alternatives considérées

### Conserver npm et supprimer les fichiers pnpm

Rejetée à la demande du propriétaire du projet, qui souhaite standardiser le
workflow sur pnpm.

### Supporter npm et pnpm en parallèle

Rejetée car deux lockfiles peuvent résoudre des versions différentes et rendent
les audits, builds et reproductions CI non déterministes.

### Utiliser une version pnpm non épinglée

Rejetée car les versions majeures de pnpm peuvent modifier le format du lockfile
et le comportement des installations CI.

## Conséquences

- Tous les contributeurs utilisent `pnpm install` et `pnpm run <script>`.
- CI et Docker échouent si le lockfile n’est pas synchronisé.
- Un nouveau paquet avec un script d’installation doit recevoir une autorisation
  explicite après revue de son contenu.
- `package-lock.json` est supprimé et ne doit pas être régénéré.
- Le quality floor bloque les lockfiles npm, Yarn ou Bun et vérifie le pin pnpm.
- Une future migration de gestionnaire exigera un nouvel ADR et une validation
  complète du pipeline pré-push.
