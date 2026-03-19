# Analyse CyberDoc

## Contexte fonctionnel

- Application web de gestion de contrats pour centres CyberDoc/سايبر صيدا.
- Interface en arabe avec tableaux de bord, génération, gestion et archivage de contrats.
- Public cible : administrateurs (gestion de modèles) et utilisateurs standards (création et suivi des contrats).
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

## Pistes d'analyse complémentaire

1. Définir le parcours utilisateur précis (création, validation, archivage) et les règles de gestion associées.
2. Stabiliser le mapping DOCX -> TemplateAsset + TemplateField (tokenisation et versionning).
3. Clarifier le workflow de paiement/encaissement (Document pricing + cashier).
4. Anticiper les intégrations externes (génération PDF, signature électronique, stockage sécurisé).

Complétez les sections ci-dessus à mesure que l'analyse avance : ajoutez des scénarios métiers, diagrammes, flux techniques et décisions d'architecture.
