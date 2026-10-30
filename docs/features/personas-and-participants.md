---
id: CRM-001
title: Personas et participants
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-10-24
---

# Personas et participants

## Résumé

CyberDoc mémorise les personnes récurrentes et les rattache aux documents selon les
rôles définis par chaque modèle.

## Périmètre utilisateur

Le formulaire de génération recherche un client existant ou crée une persona, puis
complète les participants requis par le modèle.

## Règles métier

- Une persona peut participer à plusieurs documents et sous plusieurs rôles.
- La recherche privilégie les identifiants métier et critères saisis.
- La réutilisation peut enrichir les informations existantes sans changer son ID.

## Architecture et données

API `/api/personas` et `/api/personas/[personaId]/documents`; modèles Prisma
`Persona`, `DocumentParticipant` et rôles participants du template.

## API et contrats

`GET /api/personas` recherche et limite les résultats; `POST` crée; l’historique
paginé d’une persona retourne ses documents associés. Les limites, offsets et
numéros de page sont des entiers bornés; une valeur invalide reçoit `400`.

## Permissions et sécurité

Les personas contiennent des données personnelles. L’accès exige un rôle autorisé,
les réponses sont minimisées et les recherches ne sont pas publiques.

## Erreurs et cas limites

Identifiant national dupliqué, persona absente, rôle incompatible ou mise à jour
concurrente doivent être signalés sans créer de doublon silencieux.

## Tests et preuves

`smoke:documents` teste création, recherche, réutilisation, enrichissement et lien
d’historique.

## Exploitation

Les sauvegardes et politiques de rétention doivent tenir compte des données
personnelles et permettre correction ou suppression selon la politique applicable.

## Historique

- 2026-10-24 — Validation stricte des paramètres de pagination et de limite.
- 2026-10-24 — Parcours nouvelle persona et persona existante documenté.
