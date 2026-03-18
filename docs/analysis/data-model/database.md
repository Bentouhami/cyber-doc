# Documentation de la Base de Données

## Modèle `Role`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du rôle |
| name | String | @unique | Nom du rôle (ex: ADMIN, EMPLOYEE) |
| description | String? | | Description du rôle |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création du rôle |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de la dernière mise à jour du rôle |
| users | UserRole[] | | Relation vers les utilisateurs ayant ce rôle |

## Modèle `UserRole`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique de la liaison |
| userId | String | @map("user_id_fk") | Clé étrangère vers l'utilisateur |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) | Relation vers l'utilisateur |
| roleId | Int | @map("role_id_fk") | Clé étrangère vers le rôle |
| role | Role | @relation(fields: [roleId], references: [id]) | Relation vers le rôle |

## Modèle `User`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de l'utilisateur |
| firstName | String? | | Prénom de l'utilisateur |
| lastName | String? | | Nom de famille de l'utilisateur |
| name | String | @default("") | Nom complet (calculé) |
| email | String | @unique | Adresse e-mail de l'utilisateur |
| image | String? | | URL de l'image de profil |
| emailVerified | Boolean | @default(false) | Indique si l'e-mail a été vérifié |
| emailVerifiedAt | DateTime? | | Date de vérification de l'e-mail |
| passwordHash | String | | Hash du mot de passe de l'utilisateur |
| cin | String? | @unique | Numéro de CIN (Carte d'Identité Nationale) |
| phone | String? | | Numéro de téléphone |
| address | String? | | Adresse de l'utilisateur |
| notes | String? | | Notes internes sur l'utilisateur |
| activatedAt | DateTime? | | Date d'activation du compte |
| deactivatedAt | DateTime? | | Date de désactivation du compte |
| deletedAt | DateTime? | | Date de suppression du compte |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création du compte |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de la dernière mise à jour du compte |

## Modèle `DocumentType`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du type de document |
| name | String | @unique | Nom du type de document (ex: demande, contrat) |
| nameAr | String? | | Nom du type de document en arabe |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `DocumentCategory`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique de la catégorie |
| name | String | | Nom de la catégorie (ex: logement, transport) |
| nameAr | String? | | Nom de la catégorie en arabe |
| documentTypeId | Int | @map("document_type_id_fk") | Clé étrangère vers le type de document |
| documentType | DocumentType | @relation(fields: [documentTypeId], references: [id]) | Relation vers le type de document |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `DocumentTemplate`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique du modèle |
| slug | String | @unique | Slug unique pour le modèle |
| title | String | | Titre du modèle |
| titleAr | String? | | Titre du modèle en arabe |
| description | String? | | Description du modèle |
| documentTypeId | Int | @map("document_type_id_fk") | Clé étrangère vers le type de document |
| documentType | DocumentType | @relation(fields: [documentTypeId], references: [id]) | Relation vers le type de document |
| categoryId | Int | @map("category_id_fk") | Clé étrangère vers la catégorie |
| category | DocumentCategory | @relation(fields: [categoryId], references: [id]) | Relation vers la catégorie |
| locale | String | @default("ar-MA") | Locale du modèle |
| version | Int | @default(1) | Version du modèle |
| language | String | @default("fr") | Langue du modèle (compatibilité legacy) |
| isActive | Boolean | @default(true) | Indique si le modèle est actif |
| metadata | Json? | | Métadonnées du modèle |
| content | String? | | Contenu brut (legacy) |
| assetId | String? | @map("asset_id_fk") | Clé étrangère vers l'asset |
| asset | TemplateAsset? | @relation(fields: [assetId], references: [id]) | Relation vers l'asset |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateAsset`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de l'asset |
| fileName | String | @map("file_name") | Nom du fichier |
| filePath | String | @map("file_path") | Chemin du fichier |
| fileType | String | @default("application/vnd.openxmlformats-officedocument.wordprocessingml.document") | Type de fichier |
| fileSize | Int? | @map("file_size") | Taille du fichier |
| storageDriver | String? | @map("storage_driver") | Driver de stockage |
| checksum | String? | | Checksum du fichier |
| version | Int | @default(1) | Version de l'asset |
| metadata | Json? | | Métadonnées de l'asset |
| uploadedAt | DateTime | @default(now()) @map("uploaded_at") | Date d'upload |
| uploadedById | String? | @map("uploaded_by_id_fk") | Clé étrangère vers l'utilisateur |
| uploadedBy | User? | @relation(fields: [uploadedById], references: [id]) | Relation vers l'utilisateur |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateFieldGroup`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du groupe |
| code | String | @unique | Code unique du groupe |
| name | String | | Nom du groupe |
| nameAr | String? | @map("name_ar") | Nom du groupe en arabe |
| description | String? | | Description du groupe |
| metadata | Json? | | Métadonnées du groupe |
| isActive | Boolean | @default(true) @map("is_active") | Indique si le groupe est actif |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateFieldGroupAssignment`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique de l'assignation |
| templateId | String | @map("template_id_fk") | Clé étrangère vers le modèle |
| template | DocumentTemplate | @relation(fields: [templateId], references: [id], onDelete: Cascade) | Relation vers le modèle |
| groupId | Int | @map("group_id_fk") | Clé étrangère vers le groupe |
| group | TemplateFieldGroup | @relation(fields: [groupId], references: [id], onDelete: Cascade) | Relation vers le groupe |
| displayOrder | Int | @default(0) @map("display_order") | Ordre d'affichage |
| isRequired | Boolean | @default(false) @map("is_required") | Indique si le groupe est requis |
| notes | String? | | Notes |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateFieldGroupField`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du champ |
| groupId | Int | @map("group_id_fk") | Clé étrangère vers le groupe |
| group | TemplateFieldGroup | @relation(fields: [groupId], references: [id], onDelete: Cascade) | Relation vers le groupe |
| fieldName | String | @map("field_name") | Nom du champ |
| fieldLabel | String | @map("field_label") | Label du champ |
| fieldLabelAr | String? | @map("field_label_ar") | Label du champ en arabe |
| fieldTypeId | Int | @map("field_type_id_fk") | Clé étrangère vers le type de champ |
| fieldType | FieldType | @relation(fields: [fieldTypeId], references: [id]) | Relation vers le type de champ |
| isRequired | Boolean | @default(false) @map("is_required") | Indique si le champ est requis |
| defaultValue | String? | @map("default_value") | Valeur par défaut |
| validationRules | Json? | @map("validation_rules") | Règles de validation |
| placeholder | String? | | Placeholder |
| placeholderAr | String? | @map("placeholder_ar") | Placeholder en arabe |
| helpText | String? | @map("help_text") | Texte d'aide |
| helpTextAr | String? | @map("help_text_ar") | Texte d'aide en arabe |
| dataSource | String? | @map("data_source") | Source de données |
| displayOrder | Int | @default(0) @map("display_order") | Ordre d'affichage |
| notes | String? | | Notes |
| metadata | Json? | | Métadonnées |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateParticipantRole`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du rôle |
| templateId | String | @map("template_id_fk") | Clé étrangère vers le modèle |
| template | DocumentTemplate | @relation(fields: [templateId], references: [id], onDelete: Cascade) | Relation vers le modèle |
| roleKey | String | @map("role_key") | Clé du rôle |
| roleLabel | String | @map("role_label") | Label du rôle |
| roleLabelAr | String? | @map("role_label_ar") | Label du rôle en arabe |
| description | String? | | Description |
| isRequired | Boolean | @default(true) @map("is_required") | Indique si le rôle est requis |
| minParticipants | Int | @default(1) @map("min_participants") | Nombre minimum de participants |
| maxParticipants | Int? | @map("max_participants") | Nombre maximum de participants |
| displayOrder | Int | @default(0) @map("display_order") | Ordre d'affichage |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `FieldType`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du type |
| name | String | @unique | Nom du type (ex: TEXT, NUMBER) |
| nameAr | String? | | Nom du type en arabe |
| description | String? | | Description |
| isActive | Boolean | @default(true) | Indique si le type est actif |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateField`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique du champ |
| templateId | String | | Clé étrangère vers le modèle |
| template | DocumentTemplate | @relation(fields: [templateId], references: [id], onDelete: Cascade) | Relation vers le modèle |
| fieldName | String | | Nom du champ |
| fieldLabel | String | | Label du champ |
| fieldLabelAr | String? | | Label du champ en arabe |
| placeholder | String? | | Placeholder |
| placeholderAr | String? | @map("placeholder_ar") | Placeholder en arabe |
| fieldTypeId | Int | @map("field_type_id_fk") | Clé étrangère vers le type de champ |
| fieldType | FieldType | @relation(fields: [fieldTypeId], references: [id]) | Relation vers le type de champ |
| isRequired | Boolean | @default(false) | Indique si le champ est requis |
| defaultValue | String? | | Valeur par défaut |
| validationRules | Json? | | Règles de validation |
| helpText | String? | @map("help_text") | Texte d'aide |
| helpTextAr | String? | @map("help_text_ar") | Texte d'aide en arabe |
| dataSource | String? | @map("data_source") | Source de données |
| participantRoleKey | String? | @map("participant_role_key") | Clé du rôle du participant |
| groupFieldId | Int? | @map("group_field_id_fk") | Clé étrangère vers le champ de groupe |
| groupField | TemplateFieldGroupField? | @relation(fields: [groupFieldId], references: [id]) | Relation vers le champ de groupe |
| options | Json? | | Options |
| uiSchema | Json? | @map("ui_schema") | Schéma UI |
| allowMultiple | Boolean | @default(false) @map("allow_multiple") | Autoriser les valeurs multiples |
| metadata | Json? | | Métadonnées |
| section | String? | | Section |
| sectionAr | String? | @map("section_ar") | Section en arabe |
| displayOrder | Int | @default(0) | Ordre d'affichage |
| notes | String? | | Notes |
| isActive | Boolean | @default(true) | Indique si le champ est actif |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `DocumentStatus`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du statut |
| name | String | @unique | Nom du statut (ex: DRAFT, READY) |
| nameAr | String? | | Nom du statut en arabe |
| description | String? | | Description |
| color | String? | | Couleur |
| isActive | Boolean | @default(true) | Indique si le statut est actif |
| displayOrder | Int | @default(0) | Ordre d'affichage |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `FileFormat`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du format |
| name | String | @unique | Nom du format (ex: PDF, DOCX) |
| nameAr | String? | | Nom du format en arabe |
| extension | String? | | Extension du fichier |
| mimeType | String? | | Type MIME |
| isActive | Boolean | @default(true) | Indique si le format est actif |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `Persona`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de la persona |
| firstName | String? | @map("first_name") | Prénom |
| lastName | String? | @map("last_name") | Nom de famille |
| fullName | String? | @map("full_name") | Nom complet |
| fullNameAr | String? | @map("full_name_ar") | Nom complet en arabe |
| gender | String? | | Genre |
| birthDate | DateTime? | @map("birth_date") | Date de naissance |
| birthPlace | String? | @map("birth_place") | Lieu de naissance |
| nationalId | String? | @unique @map("national_id") | Numéro d'identité nationale |
| passportNumber | String? | @unique @map("passport_number") | Numéro de passeport |
| residencePermit | String? | @map("residence_permit_number") | Numéro de permis de séjour |
| maritalStatus | String? | @map("marital_status") | État civil |
| occupation | String? | | Profession |
| employer | String? | | Employeur |
| addressLine1 | String? | @map("address_line1") | Ligne d'adresse 1 |
| addressLine2 | String? | @map("address_line2") | Ligne d'adresse 2 |
| city | String? | | Ville |
| province | String? | | Province |
| postalCode | String? | @map("postal_code") | Code postal |
| countryCode | String? | @default("MA") @map("country_code") | Code pays |
| phone | String? | | Téléphone |
| email | String? | | E-mail |
| locale | String? | | Locale |
| metadata | Json? | | Métadonnées |
| notes | String? | | Notes |
| createdById | String? | @map("created_by_id_fk") | Clé étrangère vers l'utilisateur |
| createdBy | User? | @relation(fields: [createdById], references: [id]) | Relation vers l'utilisateur |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |
| deletedAt | DateTime? | @map("deleted_at") | Date de suppression |

## Modèle `DocumentParticipant`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique du participant |
| documentId | String | @map("document_id_fk") | Clé étrangère vers le document |
| document | Document | @relation(fields: [documentId], references: [id], onDelete: Cascade) | Relation vers le document |
| personaId | String | @map("persona_id_fk") | Clé étrangère vers la persona |
| persona | Persona | @relation(fields: [personaId], references: [id], onDelete: Cascade) | Relation vers la persona |
| roleKey | String | @map("role_key") | Clé du rôle |
| roleLabel | String? | @map("role_label") | Label du rôle |
| metadata | Json? | | Métadonnées |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `Document`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique du document |
| templateId | String | | Clé étrangère vers le modèle |
| template | DocumentTemplate | @relation(fields: [templateId], references: [id]) | Relation vers le modèle |
| createdById | String | @map("user_id_fk") | Clé étrangère vers l'utilisateur |
| createdBy | User | @relation("DocumentCreator", fields: [createdById], references: [id]) | Relation vers l'utilisateur |
| statusId | Int | @map("status_id_fk") | Clé étrangère vers le statut |
| status | DocumentStatus | @relation(fields: [statusId], references: [id]) | Relation vers le statut |
| fileName | String? | | Nom du fichier |
| filePath | String? | | Chemin du fichier |
| fileFormatId | Int | @map("file_format_id_fk") | Clé étrangère vers le format |
| fileFormat | FileFormat | @relation(fields: [fileFormatId], references: [id]) | Relation vers le format |
| totalCopies | Int | @default(1) | Nombre total de copies |
| notes | String? | | Notes |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |
| standardPrice | Decimal? | @db.Decimal(10, 2) | Prix standard |
| negotiatedPrice | Decimal? | @db.Decimal(10, 2) | Prix négocié |
| unitPrice | Decimal? | @db.Decimal(10, 2) | Prix unitaire |
| discount | Decimal? | @db.Decimal(10, 2) | Remise |
| surcharge | Decimal? | @db.Decimal(10, 2) | Surcharge |
| chargedTotal | Decimal? | @db.Decimal(10, 2) | Total facturé |
| amountPaid | Decimal? | @db.Decimal(10, 2) | Montant payé |
| changeGiven | Decimal? | @db.Decimal(10, 2) | Monnaie rendue |
| paidAt | DateTime? | | Date de paiement |
| paymentStatus | String? | | Statut du paiement |
| currency | String | @default("MAD") | Devise |
| cashierId | String? | @map("cashier_id_fk") | Clé étrangère vers le caissier |
| cashier | User? | @relation("DocumentCashier", fields: [cashierId], references: [id]) | Relation vers le caissier |

## Modèle `DocumentClient`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique du client |
| documentId | String | | Clé étrangère vers le document |
| document | Document | @relation(fields: [documentId], references: [id], onDelete: Cascade) | Relation vers le document |
| userId | String | @map("user_id_fk") | Clé étrangère vers l'utilisateur |
| user | User | @relation(fields: [userId], references: [id]) | Relation vers l'utilisateur |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `DocumentFieldValue`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de la valeur |
| documentId | String | @map("document_id_fk") | Clé étrangère vers le document |
| document | Document | @relation(fields: [documentId], references: [id], onDelete: Cascade) | Relation vers le document |
| fieldId | String | @map("template_field_id_fk") | Clé étrangère vers le champ |
| field | TemplateField | @relation(fields: [fieldId], references: [id]) | Relation vers le champ |
| value | String | | Valeur du champ |
| valueJson | Json? | @map("value_json") | Valeur du champ (JSON) |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `PrintHistory`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de l'historique |
| documentId | String | @map("document_id_fk") | Clé étrangère vers le document |
| document | Document | @relation(fields: [documentId], references: [id]) | Relation vers le document |
| printedById | String | @map("user_id_fk") | Clé étrangère vers l'utilisateur |
| printedBy | User | @relation(fields: [printedById], references: [id]) | Relation vers l'utilisateur |
| copies | Int | @default(1) | Nombre de copies |
| printerId | String | @map("printer_id_fk") | Clé étrangère vers l'imprimante |
| printer | Printer | @relation(fields: [printerId], references: [id]) | Relation vers l'imprimante |
| printerName | String? | | Nom de l'imprimante |
| printedAt | DateTime | @default(now()) @map("printed_at") | Date d'impression |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |
| notes | String? | | Notes |

## Modèle `Printer`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de l'imprimante |
| name | String | @unique | Nom de l'imprimante |
| location | String? | | Emplacement |
| ipAddress | String? | | Adresse IP |
| isActive | Boolean | @default(true) | Indique si l'imprimante est active |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `ActivityType`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du type |
| name | String | @unique | Nom du type (ex: LOGIN, LOGOUT) |
| nameAr | String? | | Nom du type en arabe |
| description | String? | | Description |
| category | String? | | Catégorie |
| isActive | Boolean | @default(true) | Indique si le type est actif |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `ActivityLog`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique du log |
| userId | String | @map("user_id_fk") | Clé étrangère vers l'utilisateur |
| user | User | @relation(fields: [userId], references: [id]) | Relation vers l'utilisateur |
| activityTypeId | Int | @map("activity_type_id_fk") | Clé étrangère vers le type |
| activityType | ActivityType | @relation(fields: [activityTypeId], references: [id]) | Relation vers le type |
| resourceType | String? | | Type de ressource |
| resourceId | String? | | ID de ressource |
| userAgent | String? | | User agent |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `DailyStats`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de la stat |
| date | DateTime | @unique @db.Date | Date de la stat |
| documentsCreated | Int | @default(0) | Nombre de documents créés |
| documentsPrinted | Int | @default(0) | Nombre de documents imprimés |
| totalCopies | Int | @default(0) | Nombre total de copies |
| uniqueClients | Int | @default(0) | Nombre de clients uniques |
| activeEmployees | Int | @default(0) | Nombre d'employés actifs |
| topDocumentType | String? | | Type de document le plus utilisé |
| topCategory | String? | | Catégorie la plus utilisée |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateFieldGroup`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du groupe |
| code | String | @unique | Code unique du groupe |
| name | String | | Nom du groupe |
| nameAr | String? | @map("name_ar") | Nom du groupe en arabe |
| description | String? | | Description du groupe |
| metadata | Json? | | Métadonnées du groupe |
| isActive | Boolean | @default(true) @map("is_active") | Indique si le groupe est actif |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateFieldGroupAssignment`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique de l'assignation |
| templateId | String | @map("template_id_fk") | Clé étrangère vers le modèle |
| template | DocumentTemplate | @relation(fields: [templateId], references: [id], onDelete: Cascade) | Relation vers le modèle |
| groupId | Int | @map("group_id_fk") | Clé étrangère vers le groupe |
| group | TemplateFieldGroup | @relation(fields: [groupId], references: [id], onDelete: Cascade) | Relation vers le groupe |
| displayOrder | Int | @default(0) @map("display_order") | Ordre d'affichage |
| isRequired | Boolean | @default(false) @map("is_required") | Indique si le groupe est requis |
| notes | String? | | Notes |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateFieldGroupField`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du champ |
| groupId | Int | @map("group_id_fk") | Clé étrangère vers le groupe |
| group | TemplateFieldGroup | @relation(fields: [groupId], references: [id], onDelete: Cascade) | Relation vers le groupe |
| fieldName | String | @map("field_name") | Nom du champ |
| fieldLabel | String | @map("field_label") | Label du champ |
| fieldLabelAr | String? | @map("field_label_ar") | Label du champ en arabe |
| fieldTypeId | Int | @map("field_type_id_fk") | Clé étrangère vers le type de champ |
| fieldType | FieldType | @relation(fields: [fieldTypeId], references: [id]) | Relation vers le type de champ |
| isRequired | Boolean | @default(false) @map("is_required") | Indique si le champ est requis |
| defaultValue | String? | @map("default_value") | Valeur par défaut |
| validationRules | Json? | @map("validation_rules") | Règles de validation |
| placeholder | String? | | Placeholder |
| placeholderAr | String? | @map("placeholder_ar") | Placeholder en arabe |
| helpText | String? | @map("help_text") | Texte d'aide |
| helpTextAr | String? | @map("help_text_ar") | Texte d'aide en arabe |
| dataSource | String? | @map("data_source") | Source de données |
| displayOrder | Int | @default(0) @map("display_order") | Ordre d'affichage |
| notes | String? | | Notes |
| metadata | Json? | | Métadonnées |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `TemplateParticipantRole`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | Int | @id @default(autoincrement()) | Identifiant unique du rôle |
| templateId | String | @map("template_id_fk") | Clé étrangère vers le modèle |
| template | DocumentTemplate | @relation(fields: [templateId], references: [id], onDelete: Cascade) | Relation vers le modèle |
| roleKey | String | @map("role_key") | Clé du rôle |
| roleLabel | String | @map("role_label") | Label du rôle |
| roleLabelAr | String? | @map("role_label_ar") | Label du rôle en arabe |
| description | String? | | Description |
| isRequired | Boolean | @default(true) @map("is_required") | Indique si le rôle est requis |
| minParticipants | Int | @default(1) @map("min_participants") | Nombre minimum de participants |
| maxParticipants | Int? | @map("max_participants") | Nombre maximum de participants |
| displayOrder | Int | @default(0) @map("display_order") | Ordre d'affichage |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `Persona`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de la persona |
| firstName | String? | @map("first_name") | Prénom |
| lastName | String? | @map("last_name") | Nom de famille |
| fullName | String? | @map("full_name") | Nom complet |
| fullNameAr | String? | @map("full_name_ar") | Nom complet en arabe |
| gender | String? | | Genre |
| birthDate | DateTime? | @map("birth_date") | Date de naissance |
| birthPlace | String? | @map("birth_place") | Lieu de naissance |
| nationalId | String? | @unique @map("national_id") | Numéro d'identité nationale |
| passportNumber | String? | @unique @map("passport_number") | Numéro de passeport |
| residencePermit | String? | @map("residence_permit_number") | Numéro de permis de séjour |
| maritalStatus | String? | @map("marital_status") | État civil |
| occupation | String? | | Profession |
| employer | String? | | Employeur |
| addressLine1 | String? | @map("address_line1") | Ligne d'adresse 1 |
| addressLine2 | String? | @map("address_line2") | Ligne d'adresse 2 |
| city | String? | | Ville |
| province | String? | | Province |
| postalCode | String? | @map("postal_code") | Code postal |
| countryCode | String? | @default("MA") @map("country_code") | Code pays |
| phone | String? | | Téléphone |
| email | String? | | E-mail |
| locale | String? | | Locale |
| metadata | Json? | | Métadonnées |
| notes | String? | | Notes |
| createdById | String? | @map("created_by_id_fk") | Clé étrangère vers l'utilisateur |
| createdBy | User? | @relation(fields: [createdById], references: [id]) | Relation vers l'utilisateur |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |
| deletedAt | DateTime? | @map("deleted_at") | Date de suppression |

## Modèle `DocumentParticipant`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique du participant |
| documentId | String | @map("document_id_fk") | Clé étrangère vers le document |
| document | Document | @relation(fields: [documentId], references: [id], onDelete: Cascade) | Relation vers le document |
| personaId | String | @map("persona_id_fk") | Clé étrangère vers la persona |
| persona | Persona | @relation(fields: [personaId], references: [id], onDelete: Cascade) | Relation vers la persona |
| roleKey | String | @map("role_key") | Clé du rôle |
| roleLabel | String? | @map("role_label") | Label du rôle |
| metadata | Json? | | Métadonnées |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `AppSetting`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique du paramètre |
| key | String | @unique | Clé du paramètre |
| value | String | | Valeur du paramètre |
| type | String | @default("string") | Type de valeur |
| category | String | @default("general") | Catégorie du paramètre |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `Account`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique du compte |
| userId | String | @map("user_id_fk") | Clé étrangère vers l'utilisateur |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) | Relation vers l'utilisateur |
| providerId | String | @map("provider_id") | ID du fournisseur |
| accountId | String | @map("account_id") | ID du compte |
| password | String? | | Mot de passe |
| accessToken | String? | @map("access_token") | Jeton d'accès |
| refreshToken | String? | @map("refresh_token") | Jeton de rafraîchissement |
| idToken | String? | @map("id_token") | Jeton d'identification |
| scope | String? | | Scope |
| accessTokenExpiresAt | DateTime? | @map("access_token_expires_at") | Date d'expiration du jeton d'accès |
| refreshTokenExpiresAt | DateTime? | @map("refresh_token_expires_at") | Date d'expiration du jeton de rafraîchissement |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `Session`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de la session |
| userId | String | @map("user_id_fk") | Clé étrangère vers l'utilisateur |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) | Relation vers l'utilisateur |
| token | String | @unique | Jeton de session |
| expiresAt | DateTime | @map("expires_at") | Date d'expiration |
| ipAddress | String? | @map("ip_address") | Adresse IP |
| userAgent | String? | @map("user_agent") | User agent |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `Verification`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) | Identifiant unique de la vérification |
| identifier | String | | Identifiant |
| value | String | | Valeur |
| expiresAt | DateTime | @map("expires_at") | Date d'expiration |
| createdAt | DateTime | @default(now()) @map("created_at") | Date de création |
| updatedAt | DateTime | @updatedAt @map("updated_at") | Date de mise à jour |

## Modèle `RateLimit`

| Nom du champ | Type | Attributs | Description |
| --- | --- | --- | --- |
| key | String | @id | Clé |
| count | Int | @default(0) | Compteur |
| lastRequest | BigInt | @default(0) @map("last_request") | Dernière requête |
