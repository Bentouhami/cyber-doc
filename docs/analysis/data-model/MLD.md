# Modèle Logique de Données (MLD)

Ce document décrit le Modèle Logique de Données (MLD) pour l'application CyberDoc, dérivé du Modèle Conceptuel de Données (MCD) et aligné avec le schéma Prisma.

## Tables

### Personne

- **idPersonne** (PK, INTEGER) : Identifiant unique de la personne.
- **nom** (VARCHAR) : Nom de la personne.
- **prenom** (VARCHAR) : Prénom de la personne.

### Role

- **idRole** (PK, INTEGER) : Identifiant unique du rôle.
- **libelle** (VARCHAR) : Nom du rôle (ex: Administrateur, Employé).

### PersonneRole

- **idPersonneRole** (PK, INTEGER) : Identifiant unique de l'association.
- **dateDebut** (DATETIME) : Date de début de l'attribution du rôle.
- **dateFin** (DATETIME) : Date de fin de l'attribution du rôle.
- **idPersonne** (FK, INTEGER) : Référence vers `Personne`.
- **idRole** (FK, INTEGER) : Référence vers `Role`.

### UserInfo

- **idUserInfo** (PK, INTEGER) : Identifiant unique des informations de connexion.
- **email** (VARCHAR) : Adresse email de l'utilisateur (unique).
- **motDePasseHash** (VARCHAR) : Mot de passe hashé.
- **actif** (BOOLEAN) : Statut du compte.
- **dateCreation** (DATETIME) : Date de création du compte.
- **idPersonne** (FK, INTEGER) : Référence vers `Personne` (relation un-à-un).

### ClientInfo

- **idClientInfo** (PK, INTEGER) : Identifiant unique des informations client.
- **cin** (VARCHAR) : Carte d'identité nationale du client (unique).
- **telephone** (VARCHAR) : Numéro de téléphone.
- **adresse** (VARCHAR) : Adresse du client.
- **notes** (TEXT) : Notes additionnelles.
- **idPersonne** (FK, INTEGER) : Référence vers `Personne` (relation un-à-un).

### DocumentTemplate

- **idTemplate** (PK, INTEGER) : Identifiant unique du modèle.
- **titre** (VARCHAR) : Titre du modèle.
- **...** (autres champs)
- **creatorId** (FK, INTEGER) : Référence vers `PersonneRole` (le créateur).

### TemplateField

- **idField** (PK, INTEGER) : Identifiant unique du champ.
- **...** (autres champs)
- **templateId** (FK, INTEGER) : Référence vers `DocumentTemplate`.

### GeneratedDocument

- **idGenerated** (PK, INTEGER) : Identifiant unique du document.
- **...** (autres champs)
- **generatorId** (FK, INTEGER) : Référence vers `PersonneRole` (le générateur).
- **clientId** (FK, INTEGER) : Référence vers `ClientInfo`.
- **templateId** (FK, INTEGER) : Référence vers `DocumentTemplate`.

### FieldValue

- **idFieldValue** (PK, INTEGER) : Identifiant unique de la valeur.
- **...** (autres champs)
- **documentId** (FK, INTEGER) : Référence vers `GeneratedDocument`.
- **fieldId** (FK, INTEGER) : Référence vers `TemplateField`.

### PrintEvent

- **idPrint** (PK, INTEGER) : Identifiant unique de l'impression.
- **...** (autres champs)
- **documentId** (FK, INTEGER) : Référence vers `GeneratedDocument`.
- **triggeredById** (FK, INTEGER) : Référence vers `PersonneRole`.

### ActivityLog

- **idActivity** (PK, INTEGER) : Identifiant unique de l'activité.
- **...** (autres champs)
- **realisedById** (FK, INTEGER) : Référence vers `PersonneRole`.
- **documentId** (FK, INTEGER) : Référence vers `GeneratedDocument` (optionnel).
