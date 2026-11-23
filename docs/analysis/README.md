# Analyse CyberDoc

## Contexte fonctionnel

- Application web de gestion de contrats pour centres CyberDoc/سايبر صيدا.
- Interface en arabe avec tableaux de bord, génération, gestion et archivage de contrats.
- Public cible : propriétaire Cyber, responsable délégué et employés chargés de créer et suivre les documents.
- Périmètre MVP détaillé dans `docs/analysis/mvp.md`.

## Architecture technique

- Framework : Next.js 16 (App Router) avec React 19 et TypeScript.
- UI : composants Radix + bibliothèque shadcn/ui, Tailwind CSS 4, thèmes gérés par `next-themes`.
- Gestion de formulaires : `react-hook-form` + validation `zod`.
- Visualisation et widgets : `recharts`, `lucide-react`, `embla-carousel`, `react-resizable-panels`.
- Authentification : Better Auth + Prisma (session en base, cookies Next.js).
- Internationalisation : i18next (`locales/ar`, `locales/fr`), RTL via `dir="rtl"` et styles dédiés.

## Fonctionnalités principales observées

- Tableau de bord avec statistiques, activités récentes et bascule de thème.
- Génération de documents via modèles et champs dynamiques (TemplateField + groupes).
- Back-office admin pour gérer modèles, employés et rôles.
- Archivage/traçabilité (ActivityLog, PrintHistory, DailyStats).

## Travaux restant avant production

1. Faire homologuer juridiquement et tarifer les dix brouillons de modèles encore inactifs.
2. Anonymiser ou confiner les DOCX historiques contenant des données personnelles.
3. Rejouer migrations, seed, contrôles de données et parcours critiques sur PostgreSQL de recette.
4. Mettre à niveau Next.js, puis valider sauvegarde/restauration, stockage et supervision.

Le rapport courant et le backlog priorisé sont dans
`docs/finalization/2026-11-23-project-analysis-and-production-plan.md` et `tasks/todo.md`.
