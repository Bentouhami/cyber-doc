---
id: PAY-001
title: Paiements des documents
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-10-31
---

# Paiements des documents

## Résumé

Le détail d’un document enregistre le montant dû, le montant reçu, le statut de
paiement et la monnaie à rendre.

## Périmètre utilisateur

La caisse est intégrée à `/documents/[documentId]` pour les utilisateurs autorisés.

## Règles métier

- Les montants sont non négatifs et manipulés avec une représentation décimale.
- Le statut est dérivé de la relation entre montant dû et montant payé.
- La monnaie rendue ne peut pas être négative.
- La caisse actuelle accepte uniquement le MAD, au plus deux décimales et des
  montants bornés par la précision `Decimal(10,2)` du schéma.
- Une impression supplémentaire augmente le nombre de copies et déclenche le
  recalcul serveur du total facturé, du statut, de la monnaie et de `paidAt`.

## Architecture et données

Composant `document-detail`, route
`PATCH /api/documents/[documentId]/payment` et champs monétaires Prisma de `Document`.

## API et contrats

Le client peut envoyer prix standard/négocié/unitaire, remise, supplément et
montant reçu. `chargedTotal`, `changeGiven`, `paymentStatus` et `paidAt` sont des
sorties interdites dans le payload: le serveur les dérive en centimes entiers et
renvoie l’état financier recalculé du document.

## Permissions et sécurité

La mutation exige une session admin ou employee. Les montants sont revalidés côté
serveur et les données financières ne sont jamais acceptées sur simple calcul client.
La mutation financière et son entrée `ActivityLog` appartiennent à la même
transaction; l’absence du type d’activité requis annule la mutation.
L’historique d’impression, le nouveau nombre de copies, le repricing et l’audit
`PRINT_DOCUMENT` sont également atomiques. Paiement et impression acquièrent le
même verrou de ligne PostgreSQL avant lecture/recalcul pour sérialiser les appels
concurrents et empêcher les incréments perdus.

## Erreurs et cas limites

Valeur non numérique/négative, plus de deux décimales, devise autre que MAD,
sortie calculée fournie par le client, total négatif, document absent ou mise à
jour concurrente retournent une erreur contrôlée ou un état recalculé cohérent.

## Tests et preuves

Les tests unitaires couvrent dérivation, limites, précision et payloads
contradictoires. `smoke:documents` lance deux impressions concurrentes, vérifie
le nouveau total sans incrément perdu puis un paiement serveur `PAID`, le montant reçu, la monnaie, et
le refus d’un montant négatif, d’un statut injecté et d’une devise non supportée.

## Exploitation

Les changements financiers doivent être auditables. Toute évolution de devise ou
d’arrondi exige une décision documentée et une migration si les données changent.

## Historique

- 2026-10-31 — Repricing et audit d’impression rendus atomiques avec le nombre
  de copies; régression smoke ajoutée.
- 2026-10-30 — État financier dérivé serveur, payload strict MAD, audit atomique
  et régressions adverses ajoutés.
- 2026-10-24 — Calcul de statut déplacé vers l’action utilisateur et validé E2E.
