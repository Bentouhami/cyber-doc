# Modèle Physique de Données (MPD) - PostgreSQL

Ce document présente le Modèle Physique de Données (MPD) pour PostgreSQL, basé sur le schéma Prisma et le MLD.

## Schéma : `public`

### Table : `Personne`

- **idPersonne** : `SERIAL` (PK)
- **nom** : `VARCHAR(255)`
- **prenom** : `VARCHAR(255)`

### Table : `Role`

- **idRole** : `SERIAL` (PK)
- **libelle** : `VARCHAR(255)`

### Table : `PersonneRole`

- **idPersonneRole** : `SERIAL` (PK)
- **dateDebut** : `TIMESTAMP(3)`
- **dateFin** : `TIMESTAMP(3)`
- **idPersonne** : `INTEGER` (FK -> Personne.idPersonne)
- **idRole** : `INTEGER` (FK -> Role.idRole)

### Table : `UserInfo`

- **idUserInfo** : `SERIAL` (PK)
- **email** : `VARCHAR(255)` (UNIQUE)
- **motDePasseHash** : `VARCHAR(255)`
- **actif** : `BOOLEAN`
- **dateCreation** : `TIMESTAMP(3)`
- **idPersonne** : `INTEGER` (FK -> Personne.idPersonne, UNIQUE)

### Table : `ClientInfo`

- **idClientInfo** : `SERIAL` (PK)
- **cin** : `VARCHAR(255)` (UNIQUE)
- **telephone** : `VARCHAR(255)`
- **adresse** : `VARCHAR(255)`
- **notes** : `TEXT`
- **idPersonne** : `INTEGER` (FK -> Personne.idPersonne, UNIQUE)

### Table : `DocumentTemplate`

- **idTemplate** : `SERIAL` (PK)
- **titre** : `VARCHAR(255)`
- **...**
- **creatorId** : `INTEGER` (FK -> PersonneRole.idPersonneRole)

### Table : `TemplateField`

- **idField** : `SERIAL` (PK)
- **...**
- **templateId** : `INTEGER` (FK -> DocumentTemplate.idTemplate)

### Table : `GeneratedDocument`

- **idGenerated** : `SERIAL` (PK)
- **...**
- **generatorId** : `INTEGER` (FK -> PersonneRole.idPersonneRole)
- **clientId** : `INTEGER` (FK -> ClientInfo.idClientInfo)
- **templateId** : `INTEGER` (FK -> DocumentTemplate.idTemplate)

### Table : `FieldValue`

- **idFieldValue** : `SERIAL` (PK)
- **...**
- **documentId** : `INTEGER` (FK -> GeneratedDocument.idGenerated)
- **fieldId** : `INTEGER` (FK -> TemplateField.idField)

### Table : `PrintEvent`

- **idPrint** : `SERIAL` (PK)
- **...**
- **documentId** : `INTEGER` (FK -> GeneratedDocument.idGenerated)
- **triggeredById** : `INTEGER` (FK -> PersonneRole.idPersonneRole)

### Table : `ActivityLog`

- **idActivity** : `SERIAL` (PK)
- **...**
- **realisedById** : `INTEGER` (FK -> PersonneRole.idPersonneRole)
- **documentId** : `INTEGER` (FK -> GeneratedDocument.idGenerated, NULLABLE)
