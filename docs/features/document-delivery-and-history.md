---
id: DOC-002
title: Historique, aperçu et délivrance des documents
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-10-31
---

# Historique, aperçu et délivrance des documents

## Résumé

Les utilisateurs consultent les documents générés, ouvrent leur détail et aperçu,
téléchargent le PDF, impriment ou dupliquent un document existant.

## Périmètre utilisateur

Pages `/documents`, `/documents/[documentId]` et `/print`, avec filtres par statut,
créateur et critères de recherche.

## Règles métier

- La liste est paginée et filtrée côté serveur.
- Les paramètres `page` et `pageSize` doivent être des entiers positifs bornés;
  une valeur invalide est rejetée avec `400` avant toute requête Prisma.
- Le téléchargement sert uniquement le fichier associé au document demandé.
- La duplication crée une nouvelle identité documentaire.
- L’impression est une action auditable distincte du téléchargement.

## Architecture et données

Dashboard et détail sous `components/documents`; routes de détail, aperçu,
téléchargement, impression et duplication sous `app/api/documents/[documentId]`.

## API et contrats

`GET /api/documents`, `GET|PATCH /api/documents/[documentId]`, puis sous-routes
`preview`, `download`, `print` et `duplicate`. Un identifiant absent produit `404`.

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

Fichier absent, document supprimé, PDF invalide, filtres inconnus ou duplication
partielle doivent rester récupérables et ne pas exposer de chemin interne. Une
erreur serveur renvoie uniquement un message public stable; le journal contient un
événement JSON avec route, opération et catégorie d’erreur, sans message brut,
chemin, identifiant personnel, payload ni secret.

## Tests et preuves

`smoke:documents` vérifie l’historique client, l’aperçu HTML et sa CSP, le
téléchargement PDF, la vue et la mutation d’impression, la duplication avec une
nouvelle identité, l’immutabilité et les réponses `404`; `check:ux` ouvre liste et
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

- 2026-10-31 — Gardes de rôle explicites sur les lectures documentaires et référentiels.
- 2026-10-24 — Preview/CSP, duplication, immutabilité, impression et 404 ajoutés aux preuves E2E.
- 2026-10-24 — Pagination durcie contre les valeurs invalides et non numériques.
- 2026-10-24 — Délivrance PDF, impression et historique validés.
- 2026-10-24 — Isolation CSP et sandbox des aperçus HTML.
- 2026-10-24 — Contrôle `realpath`, refus des symlinks et noms de téléchargement sûrs.
