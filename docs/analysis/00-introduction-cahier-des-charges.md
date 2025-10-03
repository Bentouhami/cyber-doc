# Introduction

Ce cahier des charges résume les besoins du cybercafé CyberDoc basé au Maroc. L''objectif est de disposer d''une application web interne permettant aux employés de préparer et imprimer rapidement des documents administratifs ou contractuels (طلبات، عقود, certifications), tout en conservant l''historique des opérations pour le gérant.

## Contexte et objectifs

- Petite structure (3 à 4 employés) qui rédige des documents standards pour les clients de passage.
- Besoin d''un outil centralisé, simple à prendre en main, accessible depuis les postes du cybercafé.
- Historiser les demandes clients pour pouvoir les retrouver et les rééditer en quelques clics.
- Suivre l''activité : qui a généré quel document, à quelle date, nombre d''impressions réalisées.

## Périmètre fonctionnel

- **Authentification** : comptes employés et compte administrateur, réinitialisation de mot de passe.
- **Gestion des modèles** : bibliothèques de modèles classés par type (demande, contrat, attestation) et par catégorie (logement, transport, scolarité, etc.).
- **Champs dynamiques** : définition d''un formulaire par modèle (nom, CIN, adresse, montants, dates) avec champs obligatoires ou facultatifs.
- **Génération** : saisie rapide du formulaire, production du document en PDF/Docx, choix du nombre de copies, lancement de l''impression.
- **Historique** : archivage des documents générés avec statut (brouillon, prêt, imprimé), nombre de copies, auteur.
- **Recherche & filtres** : recherche par nom client, CIN, type, catégorie, date de création, employé.
- **Réédition** : ouverture d''un document existant, modification des informations et régénération.
- **Statistiques** : tableau de bord simple pour l''admin (documents générés par période, par employé, top catégories, clients récurrents).

## Profils utilisateurs

- **Administrateur (gérant)** : gère les comptes, crée ou met à jour les modèles, consulte les statistiques et l''historique complet.
- **Employé** : se connecte, sélectionne un modèle, saisit le formulaire, génère/imprime les documents, peut rééditer ses dossiers.

## Parcours principaux

1. **Connexion employé** : saisie login/mot de passe, redirection vers la liste des documents du jour.
2. **Création d''un dossier client** : sélection du modèle, saisie des champs, sauvegarde et génération du document.
3. **Impression** : choix du nombre de copies et enregistrement dans l''historique des impressions.
4. **Recherche** : filtrage de la base clients/documents, ouverture d''un dossier existant, duplication ou modification.
5. **Administration** : ajout/modification d''un modèle (structure du formulaire, mise en page), consultation des statistiques.

## Données à gérer

- Utilisateurs (identité, rôle, date de création, statut).
- Clients (nom, prénom, CIN, coordonnées, notes internes).
- Modèles de documents (titre, type, catégorie, langue, statut, contenu).
- Champs de modèle (libellé, type, caractère obligatoire, ordre).
- Documents générés (client, modèle, employé, statut, copies, dates).
- Valeurs de formulaire (texte, nombre, date selon le champ défini).
- Historique d''impression (qui, combien de copies, quand).
- Journaux d''activité (connexion, génération, modification, suppression).

## Exigences techniques

- Application web Next.js/React avec interface en français et champs prêts pour l''arabe.
- Backend Node.js (API REST) + base de données relationnelle (PostgreSQL/MySQL).
- Stockage des documents générés (PDF/DOCX) sur disque ou service S3 compatible.
- Authentification par session ou JWT, mots de passe hachés, journalisation des actions.
- Impression via téléchargement de fichier ou envoi direct vers l''imprimante locale.

## Exigences non fonctionnelles

- Interface épurée et responsive (compatibilité poste desktop et tablette interne).
- Temps de génération des documents < 3 secondes pour un formulaire standard.
- Sauvegardes quotidiennes de la base et des fichiers générés.
- Contrôle d''accès simple (admin vs employé) et traçabilité des modifications.

## Statistiques et reporting

- Volume de documents générés par jour/semaine/mois.
- Répartition par type et catégorie de document.
- Documents imprimés par employé.
- Clients récurrents et derniers documents générés pour# Cahier des charges – CyberDoc (version simplifiée)

## 1. Introduction

CyberDoc est un petit cybercafé basé au Maroc. L’objectif de ce projet est de disposer d’une **application web interne** qui permet aux employés de **préparer et imprimer rapidement** des documents administratifs ou contractuels (طلبات، عقود، attestations), tout en conservant l’**historique** et des **statistiques** utiles pour le gérant.

> **Focus** : ce projet couvre **uniquement** l’activité « documents ». Les autres services du cybercafé (factures, recharges, etc.) sont **hors périmètre** car déjà gérés par des outils tiers.

---

## 2. Contexte & objectifs

- Petite structure (≤ 3 employés) avec des besoins simples et un **temps de saisie minimal** au comptoir.
- Outil **centralisé**, **rapide** et **facile à prendre en main**, utilisable depuis les postes internes.
- **Retrouver et rééditer** un dossier en quelques clics.
- **Tracer** : qui a généré quel document, quand, et combien de copies/impressions.
- **Statistiques** de base (volumes, types, employés, clients récurrents) pour piloter l’activité.

---

## 3. Périmètre fonctionnel

### 3.1 Authentification & rôles

- Comptes **Employé** et **Administrateur (gérant)**.
- Réinitialisation de mot de passe.

### 3.2 Modèles & champs

- **Bibliothèque de modèles** classés par **type** (demande, contrat, attestation) et **catégorie** (logement, transport, scolarité, etc.).
- **Champs dynamiques** par modèle : label (FR/AR), type (texte, nombre, date, email, téléphone…), caractère obligatoire, ordre d’affichage, **valeurs par défaut**.
- **Clauses/conditions** : liste préremplie et **éditable**, possibilité d’**ajouter** des clauses à la volée.

### 3.3 Génération & impression

- Saisie rapide d’un **formulaire** (client principal, contrepartie/partie adverse, bien/objet : appartement, voiture, villa, etc.).
- **Copies** : choix du nombre de copies.
- **Production** d’un **PDF** (prioritaire) et éventuellement **DOCX**.
- **Impression** depuis l’app (téléchargement ou envoi à l’imprimante locale).

### 3.4 Historique & réédition

- Archivage des documents générés avec **statut** : Brouillon, Prêt, Imprimé.
- **Réédition** : ouvrir un document existant, modifier et **régénérer**.
- **Duplication rapide** (cas des clients qui reviennent plusieurs fois le même jour pour le même type de document).

### 3.5 Recherche & filtres

- Recherche par **nom**, **CIN**, **type**, **catégorie**, **date**, **employé**.

### 3.6 Encaissement (simplifié – tout en **espèces**)

- Tarif **unitaire** par document (par défaut 30 MAD, éditable au besoin).
- **Remise**/**surcharge** au niveau du dossier.
- **Montant perçu** (cash), **monnaie rendue**, **date de paiement**, **caissier**.
- **Statut de paiement** : UNPAID / PARTIAL / PAID (string).

---

## 4. Profils utilisateurs

- **Administrateur (gérant)** : gère les comptes, crée/édite les modèles, consulte tout l’historique et les statistiques.
- **Employé** : se connecte, sélectionne un modèle, saisit le formulaire, génère/imprime, réédite ses dossiers, encaisse en espèces.

---

## 5. Parcours principaux (MVP)

1. **Connexion** : email + mot de passe → redirection vers la liste des dossiers du jour.
2. **Créer un dossier** : choisir un modèle → formulaire prérempli (FR/AR) → compléter/éditer → enregistrer.
3. **Encaisser & imprimer** : saisir copies / remises / montant reçu → calcul automatique (total, monnaie) → générer PDF → imprimer.
4. **Rechercher / Rééditer** : retrouver un dossier (CIN, nom, date, type) → dupliquer ou modifier → régénérer.
5. **Administration** : gestion utilisateurs, modèles (structure + contenu), statistiques.

> **Critères d’acceptation clés**
>
> - Génération PDF ≤ 3 s pour un formulaire standard.
> - Duplication d’un dossier existant en ≤ 2 clics.
> - Calcul des totaux en temps réel (copies × tarif − remise + surcharge, monnaie rendue).

---

## 6. Données à gérer (modèle logique simplifié)

- **Utilisateur** : id, nom/prénom, email, rôle, statut, dates.
- **Client** : id, nom/prénom, **CIN**, coordonnées, notes internes.
- **Type**/**Catégorie** de document : id, nom (FR/AR), ordre, statut.
- **Modèle** : id, titre, type, catégorie, langue, contenu (template), **actif**.
- **Champ de modèle** : id, label FR/AR, type, obligatoire, ordre, valeur par défaut, règles.
- **Document** : id, modèle, **créé par**, statut, **copies**, fichiers (nom/chemin), **tarif unitaire**, remise, surcharge, **total facturé**, **montant perçu (cash)**, **monnaie rendue**, **date paiement**, **caissier**.
- **DocumentClient** : lien document ↔ client(s) (client principal + partie adverse).
- **Valeur de champ** : document, champ, valeur (string générique).
- **Historique d’impression** : document, imprimante/nom, **copies**, **qui**, **quand**.
- **Journal d’activité** : user, type (login, création, édition, suppression), ressource, date.

---

## 7. Règles de gestion (extraits)

- Tous les **paiements en espèces** (pas de multi-paiements).
- **Total facturé** = (tarif unitaire × copies) − remise + surcharge.
- **Monnaie rendue** = max(0, montant perçu − total facturé).
- **Statut** :
  - UNPAID si montant perçu = 0.
  - PARTIAL si 0 < montant perçu < total facturé.
  - PAID si montant perçu ≥ total facturé.
- Un **modèle** inactif est **non sélectionnable** par les employés.
- La **duplication** copie tous les champs/valeurs sauf les champs de date qui peuvent se réinitialiser à « aujourd’hui ».

---

## 8. Exigences techniques

- **Frontend** : Next.js/React (FR, champs prêts pour AR), UI simple (ShadCN/Tailwind possible).
- **Backend** : Node.js (API REST), base de données relationnelle (PostgreSQL ou MySQL), Prisma ou équivalent.
- **Stockage** : fichiers générés (PDF, éventuellement DOCX) sur disque local ou service S3‑compatible.
- **Sécurité** : sessions ou JWT, mots de passe **hachés**, journalisation des actions, contrôle d’accès simple (admin/employé).
- **Impression** : téléchargement de PDF ou envoi vers imprimante locale.

---

## 9. Exigences non fonctionnelles

- Interface **épurée** et **responsive** (desktop/tablette interne).
- **Performance** : génération PDF < 3 s.
- **Sauvegardes** quotidiennes de la base et des fichiers générés.
- **Traçabilité** : toutes les créations/éditions/suppressions journalisées.

---

## 10. Statistiques & reporting (MVP)

- **Volumes** de documents par jour/semaine/mois.
- Répartition par **type** et **catégorie**.
- Documents **imprimés par employé** (copies incluses).
- **Clients récurrents** et derniers documents générés.

---

## 11. Hors périmètre (MVP)

- Paiements carte/transfer (non requis).
- Gestion de stock, caisse complète, ou comptabilité avancée.
- Signature électronique qualifiée.
- Intégrations tierces (hors impression/stockage).

---

## 12. Risques & contraintes

- **Connexion Internet** : prévoir mode dégradé (miroir local des modèles, stockage local des fichiers).
- **Erreurs de saisie** : validations minimales (format CIN, dates obligatoires).
- **Confidentialité** : accès réservé aux comptes internes, durcissement des postes.
- **Maintenance** : un admin technique peut mettre à jour les modèles et corriger les anomalies.

---

## 13. MVP – livrables attendus

1. Authentification (admin/employé) + réinitialisation mot de passe.
2. Gestion des modèles (type/catégorie, champs dynamiques, clauses prédéfinies éditables, FR/AR).
3. Formulaire unifié (client, partie adverse, bien, conditions) + duplication rapide.
4. Génération **PDF** + impression.
5. Encaissement **cash** (copies, total, remise/surcharge, montant perçu, monnaie rendue, caissier, statut).
6. Historique & recherche + réédition.
7. Tableau de bord simple (volumes, top types/catégories, employés, récurrents).
 eux.

## Risques et contraintes

- Perte de connexion internet → prévoir un mode dégradé (miroir local des modèles, stockage des fichiers sur serveur interne).
- Erreurs de saisie → validations minimum sur les champs (format CIN, dates obligatoires).
- Confidentialité des données clients → restreindre l''accès aux comptes internes et sécuriser les postes de travail.
- Maintenance → prévoir un administrateur technique pour mettre à jour les modèles ou corriger les bugs.
