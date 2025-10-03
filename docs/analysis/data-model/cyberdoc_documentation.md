# Documentation Technique - Modèles de Données CyberDoc

## Vue d'ensemble

Cette documentation décrit la structure de la base de données de l'application CyberDoc, un système de gestion documentaire pour cybercafé au Maroc. Le schéma utilise Prisma avec PostgreSQL et privilégie les tables de référence plutôt que les enums pour une meilleure flexibilité.

---

## 1. Gestion des Utilisateurs et Authentification

### Model `Role`

**Rôle** : Définit les différents rôles dans le système (Admin, Employé, Client)

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | Int (PK) | Identifiant unique auto-incrémenté |
| `name` | String (unique) | Nom du rôle (ex: "ADMIN", "EMPLOYEE", "CLIENT") |
| `description` | String? | Description du rôle |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `users` | UserRole[] | Relation vers les utilisateurs ayant ce rôle |

### Model `UserRole`

**Rôle** : Table de liaison many-to-many entre User et Role

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | Int (PK) | Identifiant unique |
| `userId` | String (FK) | Référence vers l'utilisateur |
| `user` | User | Relation vers l'utilisateur |
| `roleId` | Int (FK) | Référence vers le rôle |
| `role` | Role | Relation vers le rôle |

**Contraintes** : Combinaison unique `userId + roleId`

### Model `User`

**Rôle** : Modèle unifié pour tous les utilisateurs (employés, admin, clients)

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `firstName` | String? | Prénom de l'utilisateur |
| `lastName` | String? | Nom de famille de l'utilisateur |
| `name` | String? | Nom complet (peut être calculé) |
| `email` | String? (unique) | Adresse email (obligatoire pour employés/admin) |
| `emailVerified` | DateTime? | Date de vérification de l'email |
| `passwordHash` | String? | Mot de passe haché (obligatoire pour employés/admin) |
| `cin` | String? (unique) | Carte d'Identité Nationale (pour les clients) |
| `phone` | String? | Numéro de téléphone |
| `address` | String? | Adresse complète |
| `notes` | String? | Notes internes (utilisé pour les clients) |
| `activatedAt` | DateTime? | Date d'activation du compte |
| `deactivatedAt` | DateTime? | Date de désactivation du compte |
| `deletedAt` | DateTime? | Date de suppression (soft delete) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |

**Relations** :

- `roles` : Rôles assignés à cet utilisateur
- `createdDocuments` : Documents créés par cet utilisateur (employés)
- `clientDocuments` : Documents liés à cet utilisateur (clients)
- `activityLogs` : Journal d'activité de cet utilisateur
- `printHistories` : Historique des impressions effectuées

---

## 2. Gestion des Types et Catégories de Documents

### Model `DocumentType`

**Rôle** : Types principaux de documents (demande, contrat, attestation)

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | Int (PK) | Identifiant unique |
| `name` | String (unique) | Nom du type en français |
| `nameAr` | String? | Nom du type en arabe |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `categories` | DocumentCategory[] | Relation vers les catégories de ce type |
| `templates` | DocumentTemplate[] | Relation vers les modèles de ce type |

### Model `DocumentCategory`

**Rôle** : Catégories spécifiques (logement, transport, scolarité, etc.)

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | Int (PK) | Identifiant unique |
| `name` | String | Nom de la catégorie |
| `nameAr` | String? | Nom en arabe |
| `documentTypeId` | Int (FK) | Type de document parent |
| `documentType` | DocumentType | Relation vers le type |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `templates` | DocumentTemplate[] | Relation vers les modèles de cette catégorie |

**Contraintes** : Combinaison unique `name + documentTypeId`

---

## 3. Système de Modèles de Documents

### Model `DocumentTemplate`

**Rôle** : Modèles de documents avec mise en page et structure

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `title` | String | Titre du modèle |
| `titleAr` | String? | Titre en arabe |
| `description` | String? | Description du modèle |
| `documentTypeId` | Int (FK) | Type de document |
| `documentType` | DocumentType | Relation vers le type |
| `categoryId` | Int (FK) | Catégorie du document |
| `category` | DocumentCategory | Relation vers la catégorie |
| `content` | String | Contenu/mise en page du modèle |
| `language` | String | Langue du modèle ("fr", "ar", "both") |
| `isActive` | Boolean | Modèle actif (défaut: true) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de modification |
| `fields` | TemplateField[] | Relation vers les champs du modèle |
| `documents` | Document[] | Relation vers les documents générés |

### Model `FieldType`

**Rôle** : Types de champs disponibles pour les formulaires

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | Int (PK) | Identifiant unique |
| `name` | String (unique) | Nom du type (TEXT, NUMBER, DATE, EMAIL, etc.) |
| `nameAr` | String? | Nom en arabe |
| `description` | String? | Description du type de champ |
| `isActive` | Boolean | Type actif (défaut: true) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `templateFields`| TemplateField[] | Relation vers les champs de ce type |

### Model `TemplateField`

**Rôle** : Champs dynamiques des formulaires de saisie

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `templateId` | String (FK) | Modèle parent |
| `template` | DocumentTemplate | Relation vers le modèle |
| `fieldName` | String | Nom technique du champ |
| `fieldLabel` | String | Libellé affiché en français |
| `fieldLabelAr` | String? | Libellé en arabe |
| `fieldTypeId` | Int (FK) | Type de champ |
| `fieldType` | FieldType | Relation vers le type |
| `isRequired` | Boolean | Champ obligatoire (défaut: false) |
| `defaultValue` | String? | Valeur par défaut |
| `validationRules` | Json? | Règles de validation JSON |
| `displayOrder` | Int | Ordre d'affichage (défaut: 0) |
| `notes` | String? | Notes internes pour les admins |
| `isActive` | Boolean | Champ actif (défaut: true) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `values` | DocumentFieldValue[] | Relation vers les valeurs saisies |

**Contraintes** : Combinaison unique `templateId + fieldName`

---

## 4. Gestion des Statuts et Formats

### Model `DocumentStatus`

**Rôle** : États possibles des documents

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | Int (PK) | Identifiant unique |
| `name` | String (unique) | Nom du statut (DRAFT, READY, PRINTED, ARCHIVED) |
| `nameAr` | String? | Nom en arabe |
| `description` | String? | Description du statut |
| `color` | String? | Couleur hex pour l'affichage (#FF0000) |
| `isActive` | Boolean | Statut actif (défaut: true) |
| `displayOrder` | Int | Ordre d'affichage (défaut: 0) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `documents` | Document[] | Relation vers les documents avec ce statut |

### Model `FileFormat`

**Rôle** : Formats de fichiers supportés

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | Int (PK) | Identifiant unique |
| `name` | String (unique) | Nom du format (PDF, DOCX, BOTH) |
| `nameAr` | String? | Nom en arabe |
| `extension` | String? | Extension de fichier (.pdf, .docx) |
| `mimeType` | String? | Type MIME pour les téléchargements |
| `isActive` | Boolean | Format actif (défaut: true) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `documents` | Document[] | Relation vers les documents avec ce format |

---

## 5. Gestion des Documents

### Model `Document`

**Rôle** : Documents générés à partir des modèles

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `templateId` | String (FK) | Modèle utilisé |
| `template` | DocumentTemplate | Relation vers le modèle |
| `createdById` | String (FK) | Employé créateur |
| `createdBy` | User | Relation vers l'employé |
| `statusId` | Int (FK) | Statut actuel |
| `status` | DocumentStatus | Relation vers le statut |
| `fileName` | String? | Nom du fichier généré |
| `filePath` | String? | Chemin de stockage |
| `fileFormatId` | Int (FK) | Format du fichier |
| `fileFormat` | FileFormat | Relation vers le format |
| `totalCopies` | Int | Nombre total de copies (défaut: 1) |
| `notes` | String? | Notes sur le document |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de modification |
| `clients` | DocumentClient[] | Relation vers les clients du document |
| `fieldValues` | DocumentFieldValue[] | Relation vers les valeurs saisies |
| `printHistory`| PrintHistory[] | Relation vers l'historique d'impression |

### Model `DocumentClient`

**Rôle** : Association many-to-many entre documents et clients

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `documentId` | String (FK) | Document concerné |
| `document` | Document | Relation vers le document |
| `userId` | String (FK) | Client concerné |
| `user` | User | Relation vers le client |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |

**Contraintes** : Combinaison unique `documentId + userId`

### Model `DocumentFieldValue`

**Rôle** : Valeurs saisies dans les formulaires

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `documentId` | String (FK) | Document parent |
| `document` | Document | Relation vers le document |
| `fieldId` | String (FK) | Champ concerné |
| `field` | TemplateField | Relation vers le champ |
| `value` | String | Valeur saisie (stockée comme string) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de modification |

**Contraintes** : Combinaison unique `documentId + fieldId`

---

## 6. Gestion des Impressions

### Model `Printer`

**Rôle** : Représente une imprimante physique

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `name` | String (unique) | Nom de l'imprimante |
| `location` | String? | Emplacement de l'imprimante |
| `ipAddress` | String? | Adresse IP de l'imprimante |
| `isActive` | Boolean | Imprimante active (défaut: true) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `printHistories`| PrintHistory[] | Relation vers l'historique d'impression |

### Model `PrintHistory`

**Rôle** : Historique des impressions effectuées

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `documentId` | String (FK) | Document imprimé |
| `document` | Document | Relation vers le document |
| `printedById` | String (FK) | Employé ayant lancé l'impression |
| `printedBy` | User | Relation vers l'employé |
| `copies` | Int | Nombre de copies imprimées (défaut: 1) |
| `printerId` | String (FK) | Imprimante utilisée |
| `printer` | Printer | Relation vers l'imprimante |
| `printerName` | String? | Nom de l'imprimante (dénormalisé) |
| `printedAt` | DateTime | Date et heure d'impression |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `notes` | String? | Notes sur l'impression |

---

## 7. Journalisation et Audit

### Model `ActivityType`

**Rôle** : Types d'activités trackées dans le système

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | Int (PK) | Identifiant unique |
| `name` | String (unique) | Nom de l'activité (LOGIN, CREATE_DOCUMENT, etc.) |
| `nameAr` | String? | Nom en arabe |
| `description` | String? | Description de l'activité |
| `category` | String? | Catégorie (auth, document, client, template) |
| `isActive` | Boolean | Type actif (défaut: true) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de dernière modification |
| `activityLogs`| ActivityLog[] | Relation vers les logs de ce type |

### Model `ActivityLog`

**Rôle** : Journal d'audit de toutes les actions utilisateurs

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `userId` | String (FK) | Utilisateur ayant effectué l'action |
| `user` | User | Relation vers l'utilisateur |
| `activityTypeId` | Int (FK) | Type d'activité |
| `activityType` | ActivityType | Relation vers le type |
| `resourceType` | String? | Type de ressource affectée |
| `resourceId` | String? | ID de la ressource affectée |
| `userAgent` | String? | User Agent du navigateur |
| `createdAt` | DateTime | Date et heure de l'action |
| `updatedAt` | DateTime | Date de dernière modification |

---

## 8. Statistiques et Reporting

### Model `DailyStats`

**Rôle** : Statistiques journalières pré-calculées

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `date` | DateTime (unique) | Date des statistiques |
| `documentsCreated` | Int | Nombre de documents créés |
| `documentsPrinted` | Int | Nombre de documents imprimés |
| `totalCopies` | Int | Nombre total de copies imprimées |
| `uniqueClients` | Int | Nombre de clients uniques |
| `activeEmployees` | Int | Nombre d'employés actifs |
| `topDocumentType` | String? | Type de document le plus utilisé |
| `topCategory` | String? | Catégorie la plus utilisée |
| `createdAt` | DateTime | Date de création des stats |
| `updatedAt` | DateTime | Date de mise à jour |

---

## 9. Configuration

### Model `AppSetting`

**Rôle** : Configuration globale de l'application

| Attribut | Type | Description |
|----------|------|-------------|
| `id` | String (PK) | Identifiant unique CUID |
| `key` | String (unique) | Clé de configuration |
| `value` | String | Valeur de configuration |
| `type` | String | Type de valeur (string, number, boolean, json) |
| `category` | String | Catégorie de paramètre (défaut: "general") |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de modification |

---

## Relations Clés

### Flux Principal des Documents

1. **Admin** crée des `DocumentTemplate` avec des `TemplateField`
2. **Employé** sélectionne un template et crée un `Document`
3. **Client** est associé via `DocumentClient`
4. **Valeurs** sont stockées dans `DocumentFieldValue`
5. **Impression** génère un `PrintHistory`
6. **Actions** sont trackées dans `ActivityLog`

### Hiérarchie des Templates

```
DocumentType (demande, contrat, attestation)
    └── DocumentCategory (logement, transport, scolarité)
        └── DocumentTemplate (modèle spécifique)
            └── TemplateField (champs du formulaire)
```

### Gestion Multi-Rôles

Un même `User` peut avoir plusieurs `Role` :

- Employé + Client : peut créer des documents ET être client
- Admin : accès complet à la gestion et aux statistiques
- Client : peut consulter ses documents

Cette architecture offre une flexibilité maximale pour l'évolution du système et permet une gestion fine des droits et des fonctionnalités.