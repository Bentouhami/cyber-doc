# Cahier des Charges - CyberDoc (Version 1)

Date: 2026-03-22  
Statut: Document de référence produit (MVP)  
Projet: CyberDoc

## 1) Vision et objectif principal

CyberDoc est une application web de gestion documentaire pour un bureau de services administratifs/juridiques.

Objectif principal: **permettre à des employés non techniques de créer des documents légaux rapidement, proprement et sans complexité inutile**.

Principe directeur: **Easy & Clean**
- Easy: parcours guidés, champs compréhensibles, faible charge mentale.
- Clean: interface claire, peu de bruit visuel, actions explicites, données fiables.

## 2) Contexte métier

Aujourd'hui, les documents sont souvent créés en partant d'anciens fichiers Word, puis modifiés manuellement (nom, CIN, adresse, date, clauses).

Problèmes actuels:
- perte de temps,
- risque d'erreurs de copie,
- doublons clients,
- difficulté à retrouver l'historique,
- qualité variable selon l'employé.

CyberDoc doit standardiser ce flux et conserver la valeur métier des modèles existants.

## 3) Cibles et utilisateurs

### 3.1 Administrateur
Responsable du paramétrage et de la qualité opérationnelle.

Besoins:
- gérer les employés (CRUD),
- gérer les modèles (création/import/édition/duplication/archivage),
- maintenir les catégories/types,
- contrôler la qualité des modèles.

### 3.2 Employé
Utilisateur principal en production, non technique.

Besoins:
- retrouver rapidement un client existant,
- réutiliser ses informations,
- choisir un modèle,
- générer/imprimer/télécharger un document,
- compléter les infos manquantes sans friction.

## 4) Périmètre MVP

### 4.1 Inclus
- Authentification et rôles: `admin`, `employee`.
- Admin:
  - CRUD employés,
  - CRUD modèles,
  - import de modèles (Word/éditeur guidé),
  - protection anti-doublon modèle (avertissement + override admin).
- Employé:
  - recherche client (nom, CIN, téléphone),
  - création nouveau document depuis modèle,
  - choix du mode: client existant vs nouveau client,
  - détection des participants et choix de persistance (un, plusieurs, aucun),
  - génération, impression, téléchargement.
- Données client:
  - enrichissement progressif du profil (infos de base + complémentaires),
  - réutilisation automatique lors des créations suivantes.
- i18n FR/AR avec support RTL.

### 4.2 Hors périmètre MVP
- OCR avancé de documents scannés,
- traduction juridique certifiée 100% automatique,
- facturation comptable complète,
- application mobile native.

## 5) Exigences fonctionnelles (Easy & Clean)

### EF-01 Auth & accès
- Connexion sécurisée.
- Redirection claire selon rôle.
- Protection des routes admin et employee.

### EF-02 Gestion employés (Admin)
- Créer, modifier, activer/désactiver, supprimer un employé.
- Validation des données obligatoires.

### EF-03 Gestion modèles (Admin)
- Créer un modèle en mode simple (guidé) ou développeur.
- Importer un `.docx` pour accélérer la création.
- Éditer, dupliquer, archiver.
- Détection de doublon (slug/titre/type/catégorie) avec option de forçage admin.

### EF-04 Recherche client (Employé)
- Rechercher un client existant par identifiants principaux.
- Afficher les documents liés.
- Créer un nouveau document en réutilisant les données existantes.

### EF-05 Création document (Employé)
- Sélection modèle puis saisie guidée.
- Distinction claire entre:
  - client principal,
  - autres participants.
- Avant génération: modal de confirmation des clients à persister.

### EF-06 Persistance et enrichissement clients
- À la génération, créer ou lier les personas selon choix employé.
- Mise à jour progressive des champs manquants.
- Historiser les liens document <-> participants.

### EF-07 Export & sortie
- Prévisualiser le document.
- Imprimer sans éléments d'interface (header/sidebar non imprimés).
- Télécharger le document généré (gestion propre du “file not found”).

### EF-08 i18n et cohérence linguistique
- FR/AR partout (zéro clé brute visible).
- UI RTL en arabe.
- Contrôle de cohérence linguistique du contenu (avertir sans bloquer abusivement).
- Possibilité de conserver noms/adresses en langue d'origine si validé par employé.

## 6) Exigences UX/UI

- Interfaces compréhensibles par un profil non technique en < 30 min de prise en main.
- Libellés métier explicites (pas de clés techniques).
- Chaque champ: label + placeholder clair.
- Erreurs actionnables (quoi corriger, où, pourquoi).
- Parcours principal en moins de 6 actions pour produire un document standard.
- Design professionnel, lisible, cohérent desktop/mobile.

## 7) Exigences non fonctionnelles

### ENF-01 Qualité logicielle
- `npm run lint` vert.
- `npm run type-check` vert.
- `npm run build` vert.

### ENF-02 Performance
- Temps de chargement perçu rapide pour pages critiques.
- Actions de création/génération avec feedback visuel immédiat.

### ENF-03 Fiabilité
- Zod sur payloads sensibles.
- Contrats API stables.
- Gestion propre des erreurs (messages utiles).

### ENF-04 Sécurité
- Contrôle d'accès par rôle.
- Validation stricte des entrées.
- Pas d'exposition de données sensibles inutiles.

### ENF-05 Maintenabilité
- Architecture claire frontend/backend/services.
- Documentation à jour des workflows clés.
- Pas de logique métier critique enfouie dans les composants UI.

## 8) Données métier (résumé)

Objets principaux:
- `users` (admin/employee),
- `templates` (modèles),
- `documents` (instances générées),
- `personas` (profils clients/participants),
- `document_participants` (liaison document <-> persona + rôle dans le document).

Règles:
- Un document peut contenir plusieurs participants.
- L'employé choisit lesquels persister.
- Un persona est enrichi dans le temps, pas recréé inutilement.

## 9) Critères d'acceptation MVP

Le MVP est validé si:
1. Admin peut gérer employés et modèles sans intervention technique.
2. Employé peut traiter un client existant et un nouveau client de bout en bout.
3. Les participants sélectionnés sont bien persistés et visibles en base.
4. Les documents sont générables, imprimables proprement et téléchargeables.
5. L'interface FR/AR ne montre aucune clé i18n brute.
6. Build + lint + type-check passent sans erreur.

## 10) Plan d'exécution recommandé

### Phase A - Stabilisation admin
- Finaliser CRUD employés.
- Finaliser CRUD/import/duplication modèles.
- Corriger tous les libellés i18n admin.

### Phase B - Flux employé complet
- Parcours guidé `nouveau client` vs `client existant`.
- Confirmation persistance participants.
- Enrichissement profil client au fil des documents.

### Phase C - Qualité et release
- Smoke tests admin + documents.
- Vérification i18n complète.
- Validation finale RC et checklist go-live.

## 11) Livrables attendus

- Application web CyberDoc MVP opérationnelle.
- Base de données cohérente avec historique document/client.
- Documentation de référence à jour (workflow admin + employee).
- Checklist de recette et rapport de smoke test.

## 12) Risques et mitigation

- Risque: surcharge fonctionnelle rendant l'outil complexe.
  - Mitigation: priorisation stricte MVP, parcours simplifiés, mode guidé par défaut.
- Risque: incohérences i18n FR/AR.
  - Mitigation: audit i18n automatisé + revue visuelle.
- Risque: doublons clients.
  - Mitigation: recherche forte + avertissement + fusion manuelle future.

## 13) Règle de gouvernance produit

Toute nouvelle demande doit répondre à 3 questions avant implémentation:
1. Est-ce indispensable au flux métier principal ?
2. Est-ce compréhensible par un employé non technique ?
3. Est-ce que cela simplifie réellement le travail quotidien ?

Si la réponse est non à une question, la demande sort du MVP.
