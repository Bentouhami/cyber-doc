---
name: asdhoconnect-doctrine-uml-from-entities
description: Génère des diagrammes PlantUML MCD (Merise avec cardinalités min,max en texte) et MPD (tables/PK/FK) par module à partir des entités PHP Doctrine (backend/src/Entity/*) uniquement. À utiliser pour construire/rafraîchir les diagrammes DB depuis le code sans Crow’s Foot, avec cardinalités cohérentes (nullable/unique/owning side) et sorties MCD_<Module>_from_entities.puml + MPD_<Module>_from_entities.puml.
---

# Generate MCD/MPD from Doctrine Entities

## Purpose

Générer **2 diagrammes PlantUML par module** à partir des entités Doctrine uniquement :

1) `MCD_<Module>_from_entities.puml` (Merise logique, cardinalités min,max en texte)  
2) `MPD_<Module>_from_entities.puml` (physique DB : tables, colonnes, PK/FK, nullabilité, unicité)

## When to use

Utiliser cette skill quand :

- on te demande de **construire ou mettre à jour** les diagrammes DB en te basant sur les **vraies entités PHP Doctrine**.
- on veut des diagrammes **diff-friendly** (tri stable) et **sans dérive** entre code et docs.
- on veut conserver une lecture **Merise (0,1 / 1,1 / 0,n / n,n)** même si PlantUML ne supporte pas Merise “nativement”.

Ne pas utiliser cette skill quand :

- la source de vérité est **Looping** (modèle manuel) et les entités sont incomplètes / non synchronisées.
- tu dois produire des règles métier non présentes dans Doctrine (ex. “au moins 1 enfant”) sans information explicite.

## Inputs (single source of truth)

- Entités PHP Doctrine du module ciblé (pattern : `backend/src/Entity/*/*.php`).
- Ne rien inventer. Si une info n’est pas déductible à partir du mapping Doctrine, ajouter un commentaire `TODO:` dans le `.puml`.

### Module scope (obligatoire)

Avant de générer, déterminer clairement le périmètre du module, par exemple :

- `backend/src/Entity/<ModuleName>/*.php`, ou
- namespace `App\Entity\<ModuleName>\*`.

Éviter d’inclure :

- `**/Tests/**`, `**/Migrations/**`, `**/Vendor/**`, `**/var/**`.

## Output location

- Sauver dans `docs/diagrams/<Module>/`
  - `MCD_<Module>_from_entities.puml`
  - `MPD_<Module>_from_entities.puml`

Créer le dossier si absent.

Chaque fichier `.puml` doit commencer par un header comment contenant :

- la date/heure de génération
- la liste des chemins d’entités utilisés (sources)
- les limites / TODO (si des infos manquent)

## PlantUML output conventions (important)

- **Interdit** d’utiliser la syntaxe Crow’s Foot PlantUML (`||--o{`, `}|..||`, etc.).
- Les cardinalités Merise doivent être affichées **en texte**, via les multiplicateurs entre guillemets :

Exemple :
`A " (0,n) " -- " (1,1) " B : association_name`

- Ordre stable (diff-friendly) :
  - entités triées alphabétiquement
  - champs triés alphabétiquement (ou une règle stable : id d’abord puis alpha)
  - relations triées alphabétiquement
- **MCD uniquement : utiliser des ovals (usecase) comme libellés d’association** et relier les entités via ces ovals.
- **MPD : ne jamais utiliser d’ovals/usecase** (relations directes entre tables).

## MCD rules (Merise logical)

- Ne pas afficher : types SQL, PK/FK techniques, ni tables de jointure.
- Lister uniquement les attributs scalaires (propriétés `Column`) selon votre convention (par défaut : tout).
- Relations : afficher des associations via **ovals (usecase)** avec nom + cardinalités Merise en texte (min,max).
- Les ovals sont **obligatoires** pour le MCD (elles servent d’étiquettes d’association).
- Many-to-many :
  - afficher `(n,n)`
  - **ne pas** créer de table de jointure en MCD
- Ne pas utiliser Crow’s Foot.

### MCD: association naming

- Utiliser un nom stable :
  - soit le nom de propriété côté owning side
  - soit un nom explicite `snake_case` (ex. `log_has_recipients`)
- Ne pas “inventer” un nom si rien n’est présent : mettre `TODO: association_name`.

## MPD rules (physical)

- Représenter des tables (stéréotype `<<Table>>`) avec colonnes + types SQL approximés.
- Inclure PK et FK réelles (selon owning side Doctrine).
- Inclure `NULL/NOT NULL` quand déductible.
- Inclure contraintes `UNIQUE` et index quand présentes dans Doctrine (ex. `unique=true`, `UniqueConstraint`, `Index`, `OneToOne` owning side).
- Many-to-many :
  - créer une **table de jointure** avec 2 FKs
  - ajouter une PK composite ou une contrainte UNIQUE (choisir une règle stable, voir ci-dessous)

### Doctrine → SQL type mapping (approx)

- `string` → `VARCHAR(length)` (ou `VARCHAR` si length non dispo)
- `text` → `TEXT`
- `int` → `INT`
- `smallint` → `SMALLINT` (si détectable)
- `bigint` → `BIGINT` (si détectable)
- `bool` → `BOOLEAN`
- `datetime` / `datetimetz` → `TIMESTAMP`
- `date` → `DATE`
- `time` → `TIME`
- `json` → `JSON`
- `uuid` → `UUID`
- `decimal` → `DECIMAL(precision,scale)` (si dispo, sinon `DECIMAL`)

Si un type n’est pas déductible : commenter `TODO: type not derivable`.

### MPD: join table default rule (ManyToMany)

- Si `JoinTable(name=...)` existe → utiliser ce nom.
- Sinon, utiliser une convention stable : `<table_a>_<table_b>` (ordre alphabétique).
- Contrainte :
  - par défaut : **PK composite** sur (`fk_a`, `fk_b`)
  - si votre standard interne est `UNIQUE` plutôt que PK composite → expliciter et appliquer partout.

## Cardinality derivation (Merise from Doctrine) — MUST FOLLOW

### 1) ManyToOne / OneToMany (FK on owning side)

**Règle clé :** la FK est portée par la table/enfant (owning side, côté “many”).

- **Child (owning side, porte la FK) → Parent**
  - `JoinColumn(nullable=true)`  → `(0,1)`
  - `JoinColumn(nullable=false)` → `(1,1)`

- **Parent → Children (inverse OneToMany)**
  - par défaut → `(0,n)`
  - **NE JAMAIS** produire `(1,n)` automatiquement (non déductible de Doctrine).
    - `(1,n)` uniquement si une règle métier explicite est fournie ailleurs (hors Doctrine), sinon rester en `(0,n)`.

### 2) OneToOne

- L’owning side porte la FK.
- L’owning side doit être **UNIQUE** (contrainte DB).
- Cardinalités :
  - `nullable=true`  → `(0,1)`
  - `nullable=false` → `(1,1)`
- Si l’owning side n’est pas clair → `TODO: owning side ambiguous`.

### 3) ManyToMany

- **MCD** : `(n,n)` des deux côtés, pas de table de jointure.
- **MPD** : table de jointure avec 2 FKs.
- Les cardinalités restent conceptuellement `(n,n)`.

## Procedure

1) Scanner les entités du module et extraire :
   - colonnes scalaires (`Column`)
   - identifiants (`Id`, `GeneratedValue`)
   - relations (`ManyToOne`, `OneToMany`, `OneToOne`, `ManyToMany`)
   - owning side, `mappedBy` / `inversedBy`
   - `JoinColumn(nullable=..., unique=...)`
   - `JoinTable` (name, joinColumns)
   - contraintes `UniqueConstraint`, `Index` (si présentes)

2) Construire le **MCD** :
   - entités + attributs scalaires
   - associations nommées
   - cardinalités Merise en texte **selon les règles ci-dessus**
   - ManyToMany = `(n,n)` sans join table

3) Construire le **MPD** :
   - tables + colonnes + types
   - PK/FK réelles
   - NULL/NOT NULL
   - UNIQUE/INDEX déductibles
   - ManyToMany = join table

4) Ajouter le header comment obligatoire (sources + date + TODO/limites).

## Validation (must pass)

Avant de finaliser, vérifier :

- **Owning side correctness**
  - `ManyToOne` : la colonne FK est bien dans la table enfant.
  - `OneToOne` : la FK est sur l’owning side.

- **Nullability/cardinality coherence**
  - FK nullable → côté enfant→parent = `(0,1)`
  - FK NOT NULL → côté enfant→parent = `(1,1)`
  - côté parent→enfants = `(0,n)` par défaut

- **OneToOne uniqueness**
  - FK de OneToOne owning side doit avoir `UNIQUE`.

- **ManyToMany**
  - MCD : pas de join table
  - MPD : join table présente, 2 FKs, contrainte (PK composite ou UNIQUE) appliquée de manière stable

- **No Crow’s Foot**
  - aucune relation de type `||--o{` dans les outputs

- **No invention**
  - pas de champs/relations ajoutés sans présence dans les entités
  - si incertitude : `TODO:` dans le `.puml`

## Example (Notifications: Log → Recipient)

### MCD expected

`NotificationLog " (0,n) " -- " (1,1) " NotificationLogRecipient : log_has_recipients`

### MPD expected

- `notification_logs_recipient` contient une FK `fk_log_id` vers `notification_logs(pk_notification_log_id)`
- `fk_log_id` est `NULL/NOT NULL` selon `JoinColumn(nullable=...)`
