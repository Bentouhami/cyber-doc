# Inventaire fonctionnel CyberDoc

Date de vérification : 2026-10-30

Base : Next.js 16.4.3, PostgreSQL, Prisma 7.10.1, Better Auth 1.7.12

La description détaillée et maintenue de chaque fonctionnalité se trouve dans
[`docs/features/`](../features/README.md). Ce fichier reste un état synthétique et ne
doit pas dupliquer les contrats complets.

| ID       | Capacité                                       | État vérifié  | Preuve principale                                   |
| -------- | ---------------------------------------------- | ------------- | --------------------------------------------------- |
| AUTH-001 | Authentification et sessions                   | Fonctionnelle | smoke permissions/admin/documents                   |
| SEC-001  | Autorisations admin/employee                   | Fonctionnelle | 44 contrôles de permissions                         |
| ADM-001  | CRUD employés                                  | Fonctionnelle | 39 contrôles admin                                  |
| TPL-001  | CRUD/import/validation/rendu des modèles       | Fonctionnelle | smoke admin                                         |
| DOC-001  | Création et génération PDF                     | Fonctionnelle | 23 contrôles documents                              |
| DOC-002  | Historique, aperçu, téléchargement, impression | Fonctionnelle | smoke documents et UX                               |
| CRM-001  | Personas et participants                       | Fonctionnelle | création, recherche et réutilisation E2E            |
| PAY-001  | Paiement et monnaie                            | Fonctionnelle | mise à jour E2E `PAID`                              |
| UX-001   | FR/AR, RTL, mobile et clavier                  | Fonctionnelle | 32 contrôles UX                                     |
| AUD-001  | Journal d’activité                             | Partiel       | API/UI admin filtrables; rétention/export à décider |

## Qualité actuelle

- Build de production, TypeScript, ESLint, contrats et i18n passent.
- Audit pnpm : zéro vulnérabilité connue au dernier contrôle.
- Schéma Prisma à jour avec 11 migrations appliquées.
- Quatre suites critiques passent sans skip.

Toute évolution de cet inventaire doit être accompagnée de la fiche canonique
correspondante sous `docs/features/`.
