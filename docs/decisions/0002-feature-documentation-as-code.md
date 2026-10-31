# ADR-002: Documentation fonctionnelle versionnée avec le code

## Statut

Accepté

## Date

2026-10-24

## Contexte

Les audits et inventaires historiques se sont désynchronisés de l’application. Les
futures fonctionnalités doivent conserver leur intention métier, contrats, règles
de sécurité, cas limites et preuves de test au même endroit que leur évolution.

## Décision

Utiliser `docs/features/` comme source canonique, une fiche par capacité métier. Une
modification de comportement doit mettre à jour au moins une fiche. Le script
`check:feature-docs` valide les métadonnées, sections obligatoires, index et couplage
entre code produit et documentation.

Les décisions transversales coûteuses à inverser restent dans `docs/decisions/` sous
forme d’ADR séquentiels.

## Alternatives considérées

### Un document fonctionnel unique

Rejeté car les conflits et la taille rendent les mises à jour difficiles à attribuer.

### Documentation dans les tickets uniquement

Rejetée car elle n’est pas disponible hors de l’outil de suivi et dérive du code.

### Commentaires dans le code

Rejetés comme source principale : ils expliquent un détail local, pas le parcours
utilisateur et ses contrats transversaux.

## Conséquences

- Une fonctionnalité n’est pas terminée sans fiche ou mise à jour documentaire.
- Les revues disposent d’un contrat lisible indépendamment de l’implémentation.
- Les changements purement internes sans impact comportemental peuvent documenter
  dans l’historique de la fiche pourquoi le comportement reste inchangé.
