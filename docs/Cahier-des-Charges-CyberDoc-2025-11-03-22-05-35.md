# Cahier des Charges – CyberDoc

## 1. Vision et Objectifs

- **Mission** : digitaliser le guichet documentaire d’un cyber-café familial marocain en automatisant la génération de documents juridiques et administratifs exigés par les clients (attestations, contrats, déclarations), tout en sécurisant les informations sensibles et en respectant les usages locaux.
- **Objectifs clés 2025-2026** :  
  1. Centraliser la production documentaire, les clients et l’activité caisse.  
  2. Garantir un environnement de travail 100 % en arabe (locale `ar-MA`) avec bascule française pour le back-office.  
  3. Réduire le temps de traitement par document (< 5 min) grâce à un assistant de saisie et à des modèles validés juridiquement.  
  4. Fournir une traçabilité complète (logs, statistiques, audits).

## 2. Domaines Métiers à Couvrir

1. **Gestion de la relation client**  
   - Identification (CIN/CNIE, nom complet en arabe/latin, coordonnées).  
   - Historique des demandes et pièces justificatives scannées.  
   - Alertes expiration (CNIE, permis, certificats de résidence).
2. **Production documentaire**  
   - Catalogue de modèles homologués bilingues (FR/AR) classés par usage : logement, véhicules, finances, social, justice.  
   - Formulaires dynamiques selon le type de document.  
   - Contrôle qualité (validation juridique, relecture).  
   - Génération PDF/DOCX + impression thermique.
3. **Gestion du personnel**  
   - Authentification par email/mot de passe (BetterAuth).  
   - Rôles : Administrateur, Caissier, Rédacteur, Contrôleur, Auditeur.  
   - Supervision des activités et des performances individuelles.
4. **Suivi financier & impression**  
   - Tarification par document, caisse journalière, statistiques (`DailyStats`).  
   - Suivi des imprimantes (`Printer`, `PrintHistory`).  
5. **Conformité juridique & archivage**  
   - Conservation sécurisée des documents, traçabilité (`ActivityLog`).  
   - Gestion des consentements clients et du cycle de vie des données (RGPD local, exigences marocaines).  
   - Historique des versions de modèles.

## 3. User Stories Prioritaires

| Rôle | User Story | Critères d’acceptation |
|------|------------|------------------------|
| Administrateur | En tant qu’Admin je configure les rôles autorisés à créer/imprimer des documents. | Interface FR/AR, validation des permissions, audit des modifications. |
| Rédacteur | En tant que Rédacteur je saisis un client, choisis un modèle et génère un document en arabe prêt à imprimer. | Saisie guidée, prévisualisation, PDF prêt à l’impression, enregistrement automatique. |
| Caissier | En tant que Caissier j’encaisse le paiement d’un document imprimé et je clos la vente. | Écran de paiement, montant par type de document, inscription dans `DailyStats`. |
| Auditeur | En tant qu’Auditeur je consulte l’historique de production pour vérifier la conformité. | Filtre par date, type, employé, export CSV/PDF. |
| Client (futur) | En tant que client je reçois une copie sécurisée de mon document ou un lien de téléchargement. | Notification/sms/email, lien sécurisé, date d’expiration. |

## 4. Processus Métier Cibles

1. **Onboarding client**  
   - Accueil → Saisie rapide (nom, CIN, téléphone) → Scan des pièces → Attribution ID client.  
   - Règles : contrôle duplication e-mail/téléphone, champs en arabe par défaut.
2. **Génération d’un document**  
   - Sélection modèle → Questionnaire dynamique (données client + champs spécifiques) → Prévisualisation bilingue → Validation → Génération PDF/DOCX → Impression/Signature → Archivage.  
   - Contrôles : champs obligatoires, montants en chiffres & lettres, dates `ar-MA`, textes légaux.
3. **Gestion des modèles**  
   - Import `.docx` → Reconnaissance des champs → Traduction FR/AR → Validation par Administrateur → Publication.  
   - Versionning : historique, rollback, mentions légales associées.
4. **Encaissement et caisse journalière**  
   - Déclaration du paiement (montant, mode) → Mise à jour `PrintHistory` & `DailyStats` → Génération rapport quotidien.  
   - Vérifications : double encaissement, écarts caisse.
5. **Audit & statistiques**  
   - Exploitation `ActivityLog`, `DailyStats`, `DocumentHistory`.  
   - Tableaux de bord : volume docs par catégorie, top clients, revenus journée/semaine/mois.

## 5. Catalogue des Documents Types & Validations

| Document (templates_docs) | Champs requis principaux | Spécificités & validations juridiques |
|---------------------------|--------------------------|----------------------------------------|
| **إشهاد سكن** (attestation de résidence) | Nom complet, CIN, adresse complète, durée d’occupation, propriétaire/témoin | Texte conforme aux communes marocaines, exige signature propriétaire + cachet. |
| **إشهاد / تصريح بالشرف** | Nom, CIN, objet de la déclaration, date/lieu | Mention « بشرفي », pénalités en cas de fausse déclaration, signature manuscrite. |
| **اعتراف بدين** (reconnaissance de dette) | Créancier/débiteur (Nom, CIN, adresse), montant en MAD (chiffres & lettres), échéances, taux | Référence au Dahir sur les obligations et contrats, clause de litige, obligation de témoins. |
| **إغلاق حساب بنكي** | Titulaire, CIN, référence compte, banque, date de demande | Clause de responsabilité du titulaire, mention de pièces jointes (CIN, RIB). |
| **التزام تسوية وضعية دراجة نارية** | Propriétaire, CIN, immatriculation, type véhicule, engagement écrit, délai de régularisation | Conformité aux règles de la DGSN, mention des sanctions en cas de non-respect. |
| **تصريح بالشرف دراجة نارية** | Identité, caractéristiques véhicule, origine de propriété | Attestation sur l’honneur, validation par autorité compétente (moqataa/police). |
| **تنازل عن قطعة أرضية** | Donneur/cessionnaire (nom, CIN), référence foncière, localisation, surface, montant | Conformité loi 39-08, obligation d’un notaire (information), signatures + témoins. |
| **شكاية رسمية** | Plainte, parties, faits datés, preuves, coordonnées tribunal/autorité | Structure légale (intro, faits, demandes), numéro CNIE, référence dossier. |
| **طلب إذن بالخروج (parental)** | Parent, enfant (nom complet, date naissance), destination, période | Consentement explicite, référence réglementation voy. mineurs, copie CNIE + acte naissance. |
| **عقد بيع (véhicule)** | Vendeur/acheteur, CIN, immatriculation, marque, modèle, année, prix, lieu/date | Conformité code commerce, clause responsabilité, mention taxe circulation. |
| **عقد كراء** | Propriétaire/locataire, CIN, adresse bien, durée, loyer (MAD), dépôt garantie, état des lieux | Référence loi 67-12, obligations entretien, conditions de résiliation, indexation. |
| **وكالة سيارة** | Mandant/mandataire, CIN, véhicule (VIN, immatriculation), pouvoir confié, durée | Clause de révocation, signature certifiée, copie CNIE obligatoire. |

> Chaque document devra fournir : listes de pièces à fournir, champs optionnels, traductions FR/AR, clauses légales mises à jour. Un moteur de validation spécifique doit être associé à chaque modèle (`TemplateField` + règles métiers).

## 6. Modèle de Données Métier (synthèse)

- **Client** (`Client`, `DocumentClient`, `ClientDocumentFile`) : données personnelles, pièces jointes, historique.  
- **Document** (`Document`, `DocumentType`, `DocumentCategory`, `DocumentTemplate`, `TemplateField`, `DocumentFieldValue`, `DocumentHistory`, `DocumentPrint`, `DocumentStatus`).  
- **Utilisateur** (`User`, `Account`, `Session`, `UserRole`, `Role`) + `ActivityLog`, `ActivityType`.  
- **Paramètres & ressources** : `AppSetting`, `Printer`, `DailyStats`, futur `Notification`.  
- **Sécurité** : `Verification`, `RateLimit`, extensions `TwoFactor`, `Passkey` (BetterAuth).  
- Les identifiants uniques utilisent `cuid()` (string) pour les entités principales, indices sur email/CIN.

## 7. Exigences Techniques

- **Stack** : Next.js 16 (App Router), React 19, TypeScript, Tailwind, Prisma (PostgreSQL), BetterAuth.  
- **Internationalisation** : interface administrateur bilingue FR/AR, interface employé **par défaut en arabe** avec support RTL (Right-to-Left). Utilisation recommandée de `next-intl` ou `i18next` avec ressources `ar-MA`.  
- **Documents** : conversion DOCX → HTML/PDF via DocxTemplater/TemplaterJS + Playwright/PDFKit. Stockage des versions dans objet storage (S3 ou équivalent).  
- **Sécurité** :  
  - Hashage BetterAuth (Scrypt) + migration automatique des anciens hash Bcrypt.  
  - Chiffrement des fichiers sensibles (AES au repos).  
  - Journalisation complète (`ActivityLog`).  
  - Sauvegardes quotidiennes de la base et du storage.  
- **Tests** : unitaires (services), e2e (Playwright) sur parcours critique (login, génération, impression).  
- **Déploiement** : pipeline CI/CD (GitHub Actions), environnements dev/staging/prod, monitoring (Logtail/Datadog).

## 8. Exigences Non Fonctionnelles

- Temps de génération document ≤ 10 s (DOCX + PDF).  
- Temps d’affichage formulaire ≤ 3 s sur poste bureautique (connexion ADSL locale).  
- SLA disponibilité (objectif) : 99 %.  
- Gestion accessibilité : labels lucratifs, messages d’erreur en arabe, contraste adapté.  
- Protection des données : purge des documents périmés (> 5 ans) selon politique interne.  
- Backups quotidiens, restauration testée mensuellement.

## 9. Roadmap Prévisionnelle

1. **Lot 1 – MVP (3 mois)**  
   - Authentification complète (BetterAuth), rôles de base (Admin, Rédacteur).  
   - Catalogue 10 documents prioritaires (table ci-dessus) avec formulaires dynamiques + PDF imprimable.  
   - Gestion clients + journal `ActivityLog`.  
   - Interface employé full arabe.
2. **Lot 2 – Automatisation (2 mois)**  
   - Encaissement + caisse journalière (`DailyStats`).  
   - Import/édition modèles (workflow validation).  
   - Notifications internes (rappels pièces).  
   - Tableau de bord analytique.
3. **Lot 3 – Avancés (2-3 mois)**  
   - Portail clients (EN option).  
   - Signatures électroniques / QR code vérification.  
   - Support 2FA, passkeys (BetterAuth plugins).  
   - Multi-organisations (franchise future).
4. **Lot 4 – Optimisation continue**  
   - Archive numérique certifiée, intégration SMS, API partenaires (notaires, banques).  
   - Applications mobiles internes (inventaire, scan).

## 10. Annexes et Références

- Dossier `templates_docs/` : base de documents Word actuels (à convertir et mapper).  
- Références légales marocaines :  
  - Loi 67-12 (locatif), Loi 39-08 (code des droits réels), Dahir des obligations et contrats.  
  - Réglementation DGSN pour véhicules & déclarations.  
- Lexique arabe/français des termes juridiques (à constituer).  
- Guide interne : procédure de vérification identité, scan, archivage papier.

---
Ce cahier des charges constitue la version de travail du **03/11/2025**. Toute évolution doit être consignée via une nouvelle version datée ou un addendum.
