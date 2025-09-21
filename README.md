# CYBER SAIDIA – Gestion de contrats en arabe

Application web Next.js dédiée aux cybercafés arabophones pour créer, personnaliser et archiver des contrats métiers dans une interface RTL moderne.

## Aperçu

- Interface full RTL en arabe avec bascule sombre/clair et typographie optimisée.
- Modules dédiés aux contrats : tableau de bord, génération, gestion de modèles et archivage.
- Authentification simulée par `AuthProvider` (mock) avec rôles Admin/Employé prêts pour intégration backend.
- Architecture modulaire réutilisable visant une montée en charge vers une vraie API/session sécurisée.

## Fonctionnalités clés

- **Authentification & rôles** : écran de connexion en arabe, distinction admin/employé, logique prête pour sessions sécurisées.
- **Gestion des modèles** : cinq modèles prévus (location maison, vente domicile, vente voiture, vente moto, vente vélo) avec champs dynamiques.
- **Génération de contrats** : formulaires contextuels, saisie vendeur/acheteur, conditions personnalisées, dates occidentales et chiffres arabes.
- **Archives & reporting** : recherche multi-critères, statuts (Actif, Expiré, Annulé) et historique détaillé.
- **Expérience utilisateur** : navigation responsive avec onglets, composants shadcn/ui, transitions cohérentes en arabe.

## Architecture technique

- **Framework** : Next.js 15.5.3 (App Router) avec React 18.3 et TypeScript.
- **UI & styles** : Tailwind CSS v4, shadcn/ui, support RTL natif, `next-themes` pour le thème.
- **Formulaires** : `react-hook-form` + validation `zod`, composants Radix pour l’accessibilité.
- **Visualisations** : `recharts`, `lucide-react`, `embla-carousel`, `react-resizable-panels`.
- **État & données** : données mockées côté client, architecture prête pour API REST/GraphQL ou services server actions.

## Démarrage rapide

1. Installer les dépendances : `pnpm install` (ou `npm install`).
2. Lancer l’environnement de dev : `pnpm dev`.
3. Ouvrir `http://localhost:3000` pour accéder à l’interface en arabe.
4. Scripts utiles :
   - `pnpm dev` : serveur de développement.
   - `pnpm build` : build de production.
   - `pnpm start` : serveur Next.js en mode production.
   - `pnpm lint` : vérification ESLint.

## Documentation interne

- `docs/README.md` : structure globale de la documentation.
- `docs/analysis/` : analyses fonctionnelles/techniques (MCD, MLD, MPD + PlantUML).
- `docs/user-stories/user-stories.md` : backlog initial de user stories.
- `docs/use-cases/` : cas d’utilisation détaillés + diagrammes UML.
- `docs/sequence-diagrams/` : scénarios dynamiques et diagrammes de séquence.

## Feuille de route suggérée

- Connecter l’authentification mock à un fournisseur (NextAuth, Keycloak, etc.).
- Persister les contrats et modèles via une base (PostgreSQL + Prisma ou autre).
- Générer les documents PDF/signatures électroniques côté serveur.
- Ajouter des tests e2e (Playwright) et unitaires sur les modules critiques.
- Internationaliser l’interface (arabe par défaut, ouverture FR/EN en option).

CYBER SAIDIA vise une gestion documentaire fiable et adaptée aux usages arabophones, avec une base solide pour des intégrations futures (paiement, signature, reporting avancé).
