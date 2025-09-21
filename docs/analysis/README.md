# Analyse CyberDoc

## Contexte fonctionnel

- Application web de gestion de contrats pour centres CyberDoc/سايبر صيدا.
- Interface en arabe avec tableaux de bord, génération, gestion et archivage de contrats.
- Public cible : administrateurs (gestion de modèles) et utilisateurs standards (création et suivi des contrats).

## Architecture technique

- Framework : Next.js 14 (App Router) avec React 18 et TypeScript.
- UI : composants Radix + bibliothèque shadcn/ui, Tailwind CSS 4, thèmes gérés par `next-themes`.
- Gestion de formulaires : `react-hook-form` + validation `zod`.
- Visualisation et widgets : `recharts`, `lucide-react`, `embla-carousel`, `react-resizable-panels`.
- Authentification simulée côté client via `AuthProvider` (mock utilisateur `mockUser`).

## Fonctionnalités principales observées

- Tableau de bord avec statistiques, activités récentes et bascule de thème.
- Générateur de contrats (`ContractGenerator`) pour composer et personnaliser un contrat.
- Gestionnaire de modèles (`ContractTemplateManager`) réservé aux administrateurs.
- Module d'archivage (`ContractArchive`) pour consulter l'historique.

## Pistes d'analyse complémentaire

1. Définir le parcours utilisateur précis (création, validation, archivage) et les règles de gestion associées.
2. Modéliser les entités du domaine (contrat, modèle, client, utilisateur, workflow de validation).
3. Documenter la stratégie d'authentification/autorisation souhaitée (mock actuelle vs. intégration future).
4. Anticiper les intégrations externes (génération de PDF, signature électronique, stockage sécurisé des contrats).

Complétez les sections ci-dessus à mesure que l'analyse avance : ajoutez des scénarios métiers, diagrammes, flux techniques et décisions d'architecture.
