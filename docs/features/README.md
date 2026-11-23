# Fonctionnalités CyberDoc

Ce dossier est la source canonique de la documentation fonctionnelle. Une
modification de comportement dans `app/`, `components/`, `hooks/`, `lib/`,
`services/` ou Prisma doit mettre à jour au moins une fiche de ce dossier.

## Catalogue

| Domaine        | Fonctionnalité                                                                          | Statut               |
| -------------- | --------------------------------------------------------------------------------------- | -------------------- |
| Identité       | [Authentification et sessions](authentication-and-sessions.md)                          | Production candidate |
| Sécurité       | [Autorisations et rôles](authorization-and-roles.md)                                    | Production candidate |
| Administration | [Gestion des employés](employee-management.md)                                          | Production candidate |
| Modèles        | [Catalogue et cycle de vie des modèles](template-management.md)                         | Production candidate |
| Documents      | [Création et génération des documents](document-generation.md)                          | Production candidate |
| Documents      | [Historique, aperçu et délivrance](document-delivery-and-history.md)                    | Production candidate |
| Clients        | [Personas et participants](personas-and-participants.md)                                | Production candidate |
| Caisse         | [Paiements des documents](document-payments.md)                                         | Production candidate |
| Expérience     | [Internationalisation, RTL et accessibilité](internationalization-and-accessibility.md) | Production candidate |
| Audit          | [Journal d’activité](activity-audit.md)                                                 | Partiel              |

## Règles de maintenance

- Partir de [\_template.md](_template.md) pour toute nouvelle fonctionnalité.
- Une fiche décrit le comportement observable, les invariants, les contrats, les
  risques et les preuves de test. Elle ne recopie pas l’implémentation ligne par ligne.
- Une décision coûteuse à inverser reçoit aussi un ADR dans `docs/decisions/`.
- Les changements sont ajoutés dans la section `Historique` de la fiche concernée.
- `pnpm run check:feature-docs` vérifie la structure, l’index et la présence d’une
  mise à jour documentaire avec chaque changement de comportement.
