# CyberDoc – Mémo Agent

> À relire avant chaque nouvelle intervention. Mettre à jour ce fichier dès qu’un choix change.

## Vision rapide

- Application légère pour un très petit business : rôles `ADMIN` (gestion modèles/employés) et `EDITOR` (saisie + génération de documents).
- Objectif principal : remplacer les éditions manuelles Word par une saisie guidée + génération automatique (PDF/DOCX) à partir de modèles dynamiques.

## Backend & Données

- Simplifier le schéma Prisma tout en conservant la gestion via la table `Role` :
  - **Garder** `Role`, `User`, `UserRole`, `DocumentTemplate`, `TemplateField`, `Document`, `DocumentFieldValue`, `ActivityLog`, `Printer`.
  - Restreindre les rôles initiaux à `ADMIN` et `EDITOR`, mais laisser la table `Role` extensible pour le futur backoffice.
  - **Mettre en pause** / supprimer pour l’instant `DocumentType`, `DocumentCategory`, `FieldType`, `DocumentClient`, `DailyStats`, `AppSetting` tant qu’ils ne sont pas utilisés.
- Prévoir une table `Client` (ou équivalent) pour mémoriser les informations des clients récurrents.
- Chaque `DocumentTemplate` stocke un contenu HTML avec placeholders `{{field_name}}` + liste des champs définis dans `TemplateField`.
- `Document` enregistre chaque génération et garde les valeurs client dans `DocumentFieldValue`. Le fichier généré peut être stocké ou servi à la volée.
- `ActivityLog` trace les actions clés (`CREATE_DOCUMENT`, `UPDATE_TEMPLATE`, etc.) pour audit léger.

## Authentification

- Remplacer le provider mock par AuthJS (NextAuth v5) avec Credentials (email + mot de passe).
- Utiliser l’adapter Prisma (`Account`, `Session`, `VerificationToken`).
- Les permissions s’appuient sur `Role` + `UserRole` : initier avec `ADMIN` et `EDITOR`, prévoir CRUD des rôles via le backoffice.
- Ajouter middleware pour protéger `/admin` et les routes API sensibles.

## APIs prioritaires

- `/api/auth` géré par AuthJS.
- `/api/employees` : CRUD admin sur les utilisateurs `EDITOR`.
- `/api/templates` : CRUD des modèles (Admin).
- `/api/documents` : création d’un document + génération du rendu + log d’activité.
- Utiliser `zod` pour la validation serveur.

## Frontend & UX

- Next.js (App Router) + TailwindCSS v4 + shadcn/ui.
- Construire un layout distinct : tableau de bord éditeur (documents du jour, nouveau document) vs espace admin (navigation latérale).
- `ContractGenerator` doit :
  1. Lister les modèles (React Query).
  2. Générer un formulaire dynamique (en fonction de `TemplateField`).
  3. Prévisualiser le rendu HTML.
  4. Déclencher génération PDF/DOCX.
- Prévoir un wizard 3 étapes : client → champs → aperçu.
- Gérer le RTL/global via layout principal (`dir="rtl"`), vérifier tous les composants shadcn.

## Fonctionnalités clés (ordre recommandé)

1. **Authentification sécurisée** : AuthJS credentials, sessions Prisma, gestion des rôles via `Role`/`UserRole`.
2. **Gestion des employés** : écran admin CRUD (création, activation, reset mot de passe) avec attribution des rôles.
3. **Catalogue de modèles** : CRUD complet sur `DocumentTemplate` + `TemplateField`, import initial depuis les Word.
4. **Assistant de génération** : interface éditeur pour choisir un modèle, saisir les champs dynamiques et prévisualiser le rendu.
5. **Génération de documents** : service serveur pour fusionner les données, produire PDF/DOCX, enregistrer `Document` + `DocumentFieldValue`.
6. **Journal d’activité & permissions** : enregistrement systématique (`ActivityLog`), garde-fous sur les routes API/page selon le rôle.
7. **Répertoire clients (optionnel)** : si besoin, table `Client` + recherche auto pour éviter la re-saisie.
8. **Suivi impression & rapports légers** : `PrintHistory`, stats quotidiennes minimales ou exports.
9. **Backoffice évolué** : gestion fine des rôles supplémentaires, paramétrage avancé, dashboards.

## Intégration des modèles Word existants

- Dossier `templates_docs/` contient les originaux. Processus :
  1. Extraire le contenu (ex. `mammoth`, `pandoc`) pour obtenir HTML propre.
  2. Identifier les variables et créer les `TemplateField` correspondants.
  3. Insérer le HTML avec placeholders dans Prisma (seed ou interface admin).
  4. Vérifier la restitution PDF (RTL, gras, soulignements) avant validation.
- Conserver les `.docx` originaux pour référence mais ne plus les éditer manuellement.

## Tâches en cours / à planifier

1. Nettoyer le schéma Prisma + migrations (garder `Role`/`UserRole`, supprimer tables inutiles, option `Client`).
2. Mettre en place AuthJS credentials + seed d’un admin.
3. Implémenter API templates/documents + connecteur ActivityLog.
4. Refondre le frontend (React Query, formulaires dynamiques, preview PDF).
5. Intégrer progressivement chaque modèle Word.

_Dernière mise à jour : 2025-01-13 (création du mémo)._
