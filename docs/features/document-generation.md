---
id: DOC-001
title: Création et génération des documents
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-10-31
---

# Création et génération des documents

## Résumé

Un employé choisit un modèle, renseigne les participants et champs dynamiques,
prévisualise le résultat puis génère un document persistant et son PDF.

## Périmètre utilisateur

Le parcours démarre sur `/documents/create` et couvre nouveau client, client
existant, choix de langue, formulaire dynamique et génération.

## Règles métier

- Seuls les modèles actifs peuvent générer un nouveau document.
- Les champs obligatoires et rôles participants doivent être complets. L'API refuse
  tout rôle inconnu, les cardinalités hors limites et un même participant répété
  pour un rôle, y compris un doublon sans CIN détecté par son identité inline normalisée.
- Un changement de langue incompatible nécessite une confirmation explicite.
- Un montant initial négatif, imprécis ou sans prix de modèle est refusé; le statut
  de paiement est calculé par la politique monétaire partagée.
- Le PDF doit être rendu et écrit avant la transaction de création. La transaction
  persiste ensuite un document directement `READY`, ses champs, participants,
  journal et statistiques comme une seule unité atomique.

## Architecture et données

UI dans `components/templates/template-form.tsx`; API
`POST /api/documents/generate`; service `documentGenerationService`; modèles
`Document`, valeurs, participants, template et statut.

## API et contrats

La génération renvoie le document créé et les informations de délivrance. Une garde
de langue peut répondre `409` avec un code métier demandant confirmation. Un modèle
inactif répond `409/TEMPLATE_INACTIVE`; un modèle sans HTML répond
`422/TEMPLATE_CONTENT_MISSING`; les violations de participants répondent
`400/INVALID_PARTICIPANTS` avec des codes d'incident structurés.

## Permissions et sécurité

Admin et employee authentifiés peuvent générer. Les champs libres sont validés et
échappés avant insertion dans le rendu; aucun chemin de sortie ne vient du client.
Le moteur PDF désactive JavaScript et bloque les ressources réseau et `file:`; les
assets de rendu doivent être intégrés avec des URI `data:` ou `blob:`.

## Erreurs et cas limites

Modèle incomplet, participant absent, données invalides, échec PDF, écriture disque
ou transaction DB échouée doivent produire une erreur sans résultat trompeur. Aucun
document n'est créé si le rendu ou l'écriture échoue. Le fichier est d'abord écrit
sous un nom temporaire puis renommé atomiquement; tout staging incomplet est supprimé.
Si la transaction échoue après l'écriture, le fichier final est supprimé en compensation; le nom aléatoire rend une
nouvelle tentative indépendante d'un fichier résiduel. Le rendu PDF est borné à
15 secondes et ferme Chromium même en cas d'échec.

## Tests et preuves

`tests/unit/document-generation-policy.test.ts` couvre rôles requis/inconnus,
cardinalités, doublons et configuration invalide. `pnpm run smoke:documents` couvre
en plus les refus adverses de participants et paiement initial, les
nouveaux/existants clients, la garde de langue et la génération PDF réelle.
`pnpm exec tsx scripts/performance/pdf-render-check.ts`
vérifie le rendu embarqué, le blocage réseau et publie une médiane locale comparable.

## Exploitation

Les PDF sont écrits sous `storage/documents`, exclu de Git. L'image `runner` fournit
Chromium et vérifie son lancement/PDF dans le job container CI. La base et le stockage
doivent être sauvegardés ensemble pour conserver les liens.

## Historique

- 2026-10-31 — Invariants modèle/participants/paiement et cohérence compensatoire PDF/DB.
- 2026-10-24 — Rendu PDF accéléré et isolé du réseau avec délai borné et nettoyage garanti.
- 2026-10-24 — Parcours complet validé avec PostgreSQL et Chromium.
