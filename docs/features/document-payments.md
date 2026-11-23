---
id: PAY-001
title: Paiements des documents
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-11-23
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
- La saisie du montant reçu actualise immédiatement le statut et la monnaie à
  rendre dans l'interface; la réponse serveur reste l'autorité après sauvegarde.
- La caisse actuelle accepte uniquement le MAD, au plus deux décimales et des
  montants bornés par la précision `Decimal(10,2)` du schéma.
- Une impression supplémentaire augmente le nombre de copies et déclenche le
  recalcul serveur du total facturé, du statut, de la monnaie et de `paidAt`.
  Le formulaire propose une copie supplémentaire par défaut et actualise aussitôt
  le total de copies et l'état financier renvoyés par le serveur.
- La génération et l'impression refusent un compteur qui dépasserait la capacité
  entière PostgreSQL; l'impression vérifie aussi le cumul sous verrou de ligne.
- Le prix unitaire est la valeur du modèle au moment de la génération et ne peut
  être géré que dans le back-office par le propriétaire ou son responsable.
  L'employé de caisse saisit uniquement le montant reçu.
- Une nouvelle version reprend le contenu métier, pas l’ancien encaissement : elle
  recommence à une copie et sans montant payé prérempli.

## Architecture et données

Composant `document-detail`, route
`PATCH /api/documents/[documentId]/payment` et champs monétaires Prisma de `Document`.

## API et contrats

La route de caisse accepte uniquement `amountPaid`. Les prix et toutes les sorties
calculées sont interdits dans ce payload. `chargedTotal`, `changeGiven`,
`paymentStatus` et `paidAt` sont dérivés en centimes entiers et renvoyés avec l’état
financier recalculé du document. Le prix catalogue du modèle est borné, positif et
limité à deux décimales par le contrat partagé du back-office. Le seed conserve un
prix déjà géré dans le back-office; un modèle de démonstration sans prix reste
inactif au lieu d’être republié avec un montant inventé.

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

Valeur non numérique/négative, plus de deux décimales, nombre de copies excessif,
devise autre que MAD,
tentative de remplacement du prix par l'employé, sortie calculée fournie par le client,
total négatif, document absent ou mise à
jour concurrente retournent une erreur contrôlée ou un état recalculé cohérent.

## Tests et preuves

Les tests unitaires couvrent dérivation, limites monétaires et de copies, précision, conservation du prix
géré et payloads
contradictoires. `smoke:documents` lance deux impressions concurrentes, vérifie
le nouveau total sans incrément perdu puis un paiement serveur `PAID`, le montant reçu, la monnaie, et
le refus d’un montant négatif, d’un statut injecté et d’une devise non supportée.
La matrice navigateur FR/AR et desktop/mobile vérifie aussi la monnaie exacte
actualisée pendant la saisie, sans mutation de la base.

## Exploitation

Les changements financiers doivent être auditables. Toute évolution de devise ou
d’arrondi exige une décision documentée et une migration si les données changent.

## Historique

- 2026-11-23 — La monnaie et le statut sont prévisualisés en centimes pendant
  la saisie; preuve navigateur bilingue et responsive ajoutée.
- 2026-11-23 — Le nombre initial et le cumul des copies sont bornés à la capacité
  du champ PostgreSQL; régressions unitaire, mutation et smoke ajoutées.
- 2026-11-23 — Les nouvelles versions ne recopient plus le paiement ni la quantité
  de l’ancienne prestation.
- 2026-11-23 — Le seed préserve les prix administrés et laisse inactifs les
  modèles sans tarif; régression unitaire ajoutée.
- 2026-11-23 — Prix verrouillé au back-office; la caisse ne transmet plus que le montant reçu.
- 2026-10-31 — Repricing et audit d’impression rendus atomiques avec le nombre
  de copies; régression smoke ajoutée.
- 2026-10-30 — État financier dérivé serveur, payload strict MAD, audit atomique
  et régressions adverses ajoutés.
- 2026-10-24 — Calcul de statut déplacé vers l’action utilisateur et validé E2E.
