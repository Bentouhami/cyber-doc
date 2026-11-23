---
id: ADM-002
title: Raccourcis vers les sites externes
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-11-23
---

# Raccourcis vers les sites externes

## Résumé

CyberDoc centralise les portails externes utilisés par les employés dans une page
bilingue disponible en cartes ou en liste.

## Périmètre utilisateur

Tous les employés authentifiés consultent les raccourcis actifs sous
`/documents/shortcuts`. Le propriétaire et le responsable délégué peuvent les
créer, modifier, ordonner et désactiver depuis la même page.

## Règles métier

- Le titre français, le titre arabe et l'adresse sont obligatoires.
- Seules les adresses HTTP(S) sans identifiants intégrés sont acceptées.
- Une désactivation masque le lien aux employés sans supprimer son historique.
- L'ordre numérique est appliqué avant le titre.

## Architecture et données

Le modèle `ExternalShortcut` stocke les deux libellés, descriptions, URL, ordre et
état. L'interface `ExternalShortcuts` réutilise le profil courant pour afficher les
commandes de gestion uniquement aux rôles autorisés.

## API et contrats

`GET|POST /api/shortcuts` et `PATCH|DELETE /api/shortcuts/[shortcutId]`. Le GET est
accessible aux rôles documentaires; les mutations et `includeInactive=true` sont
réservés aux rôles de gestion. DELETE désactive la ressource.

## Permissions et sécurité

L'autorisation est répétée côté serveur. Les schémas Zod bornent tous les textes,
l'ordre et l'URL; `javascript:`, les URL invalides et les credentials intégrés sont
refusés. Les liens s'ouvrent avec `noopener noreferrer`.

## Erreurs et cas limites

Une charge invalide renvoie `400`, un rôle insuffisant `403` et un identifiant
absent `404`. Une erreur interne ne révèle pas son détail.

## Tests et preuves

`tests/unit/external-shortcut-validation.test.ts` couvre les URL valides et les
charges adverses. Le smoke admin couvre la page, la création, la modification, le
refus de `javascript:` et la désactivation; il reste à l'exécuter sur une base migrée.

## Exploitation

Les liens externes sont administrés manuellement; CyberDoc ne vérifie ni leur
disponibilité ni le contenu des sites tiers.

## Historique

- 2026-11-23 — Première version CRUD bilingue avec vues cartes/liste.
