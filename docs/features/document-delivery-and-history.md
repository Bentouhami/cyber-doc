---
id: DOC-002
title: Historique, aperçu et délivrance des documents
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-11-23
---

# Historique, aperçu et délivrance des documents

## Résumé

Les utilisateurs consultent les documents générés, ouvrent leur détail et aperçu,
téléchargent le PDF, impriment ou dupliquent un document existant.

## Périmètre utilisateur

Pages `/documents`, `/documents/[documentId]` et `/print`, avec recherche et filtres
par statut, modèle, type de document, catégorie, créateur et dates.
L'historique d'un client existant possède aussi ses propres filtres type/catégorie
et une pagination serveur; il ne s'arrête plus aux douze premiers documents.

## Règles métier

- La liste est paginée et filtrée côté serveur.
- L'historique d'une personne est paginé et filtré par type/catégorie côté serveur.
- Les paramètres `page` et `pageSize` doivent être des entiers positifs bornés;
  une valeur invalide est rejetée avec `400` avant toute requête Prisma.
- Les identifiants numériques de filtre sont bornés à la capacité `Int` de
  PostgreSQL afin qu'une valeur excessive produise `400`, jamais une erreur Prisma.
- Le téléchargement sert uniquement le fichier associé au document demandé.
- La duplication crée une copie brouillon indépendante avec une nouvelle identité
  documentaire, puis ouvre immédiatement le formulaire prérempli pour permettre
  sa modification avant génération.
- Une nouvelle version ne modifie jamais le document source: elle crée une nouvelle
  identité dans la même série, incrémente son numéro et marque la précédente comme
  remplacée. Toutes les versions restent consultables.
- Seule la version actuelle peut être remplacée. Deux remplacements concurrents du
  même document sont sérialisés; le second est refusé avec `409`.
- L’impression est une action auditable distincte du téléchargement.

## Architecture et données

Dashboard et détail sous `components/documents`; `Document.versionGroupId`,
`versionNumber`, `previousVersionId` et `supersededAt` matérialisent la chaîne de
versions. Routes de détail, aperçu,
téléchargement, impression et duplication sous `app/api/documents/[documentId]`.

## API et contrats

`GET /api/documents`, `GET|PATCH /api/documents/[documentId]`, puis sous-routes
`preview`, `download`, `print` et `duplicate`. Un identifiant absent produit `404`.
La génération avec `sourceDocumentId` crée la version suivante. Un modèle différent
ou une source déjà remplacée produit `409` sans altérer l'historique.

## Permissions et sécurité

La liste, les référentiels, l’aperçu et le téléchargement vérifient explicitement le
rôle `employee` ou `admin` après relecture de l’utilisateur actif en base. Toutes les
opérations exigent une session et les rôles autorisés. Les chemins de
fichier persistés sont lus depuis la relation document autorisée, normalisés puis
résolus avec `realpath` sous la racine réelle de stockage. Un chemin absolu,
traversant, un fichier non régulier ou toute chaîne de symlinks/junctions est
refusé. Les écritures vérifient aussi le parent réel et utilisent une création
exclusive pour ne pas suivre un lien apparu sur la cible. Les noms de téléchargement
sont neutralisés avant insertion dans `Content-Disposition`. L’aperçu HTML
est servi sans cache avec une CSP dédiée qui interdit scripts, connexions, objets,
formulaires et navigation de base. Les iframes sont sandboxées; la vue d’impression
n’autorise que l’origine nécessaire au déclenchement de l’impression et les boîtes
de dialogue.

## Erreurs et cas limites

Fichier absent, document supprimé, PDF invalide, filtres inconnus, duplication
partielle, source de version absente, modèle incompatible ou source déjà remplacée
doivent rester récupérables et ne pas exposer de chemin interne. Une
erreur serveur renvoie uniquement un message public stable; le journal contient un
événement JSON avec route, opération et catégorie d’erreur, sans message brut,
chemin, identifiant personnel, payload ni secret.

## Tests et preuves

`smoke:documents` vérifie l’historique client, l’aperçu HTML et sa CSP, le
téléchargement PDF, la vue et la mutation d’impression, la duplication avec une
nouvelle identité, la création d'une version 2, le refus d'un second remplacement
de la version obsolète, l’immutabilité et les réponses `404`; `check:ux` ouvre liste et
détail sur mobile et desktop. Le smoke admin vérifie aussi les headers de
confinement de l’aperçu et les attributs sandbox du détail et de l’impression.
`tests/unit/storage-security.test.ts` couvre traversée, lecture autorisée, symlink
sortant, parent d’écriture symlinké et injection dans le nom téléchargé.

## Exploitation

Les erreurs de délivrance sont journalisées côté serveur sans données personnelles.
Le stockage local doit être remplacé ou monté durablement en environnement distribué.
Le smoke document crée des documents, personas et historiques d’impression. Comme
l’API publique ne propose pas de suppression technique de ces ressources, le
rapport `tmp/documents-smoke/results.json` liste leurs identifiants et la suite doit
tourner sur une base et un volume de stockage jetables ou réinitialisés ensuite.

## Historique

- 2026-11-23 — Filtres type/catégorie et pagination ajoutés directement à
  l'historique d'un client existant.
- 2026-11-23 — Chaîne de versions immuable, garde concurrente, historique visible et audit des duplications.
- 2026-10-31 — Gardes de rôle explicites sur les lectures documentaires et référentiels.
- 2026-10-24 — Preview/CSP, duplication, immutabilité, impression et 404 ajoutés aux preuves E2E.
- 2026-10-24 — Pagination durcie contre les valeurs invalides et non numériques.
- 2026-10-24 — Délivrance PDF, impression et historique validés.
- 2026-10-24 — Isolation CSP et sandbox des aperçus HTML.
- 2026-10-24 — Contrôle `realpath`, refus des symlinks et noms de téléchargement sûrs.
