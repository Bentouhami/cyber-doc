# CyberDoc — analyse du projet et plan de finalisation

Date de l'analyse : 2026-11-23
Branche examinée : `release/v1.0.0-candidate`
Conclusion : **candidat fonctionnel avancé, pas encore autorisable en production**

## 1. Résumé du projet

CyberDoc est une application web interne pour un bureau de services administratifs
et juridiques. Elle remplace la modification manuelle d'anciens fichiers Word par
un parcours guidé : retrouver ou créer un client, choisir un modèle légal, saisir
les participants et données variables, générer un PDF, encaisser, imprimer et
conserver l'historique.

Les deux profils opérationnels sont le propriétaire Cyber (`owner`), qui contrôle
l'application et peut déléguer la gestion quotidienne à un `responsible`, et les
employés (`employee`), qui traitent les demandes des clients.

L'application utilise Next.js 16, React 19, Prisma/PostgreSQL, Better Auth, Zod et
Playwright. Les documents générés sont conservés dans un stockage de fichiers local
ou monté; leurs métadonnées, clients, paiements, impressions et activités sont en
PostgreSQL.

## 2. État fonctionnel par besoin

| Besoin | État du code au 2026-11-23 | Preuve principale |
| --- | --- | --- |
| Français/arabe, arabe par défaut | Implémenté; audit de 555 clés sans manque ni message serveur brut | `lib/i18n.ts`, locales FR/AR |
| Owner et Responsable délégué | Implémenté avec protection du Owner | politique de rôles + migration + tests |
| Connexion username/e-mail | Implémentée avec erreur générique | Better Auth username + migration |
| Recherche client et historique | Déjà présent | personas, participants, dashboard documents |
| Copie ou nouvelle version | Implémenté sans écrasement destructif | chaîne de versions + verrou de ligne |
| Journal des connexions et documents | Implémenté dans les principaux flux | `LOGIN`, création, mise à jour, impression |
| Compteur de copies imprimées | Déjà présent et atomique | `PrintHistory`, route print |
| Modèles par type/catégorie et import | Catalogue 13/13; 10 brouillons volontairement inactifs | back-office, seed et contrôle de couverture DOCX |
| Raccourcis vers sites externes | Implémenté dans ce lot | CRUD protégé + vues cartes/liste |
| Paiement et monnaie rendue | Implémenté côté serveur | politique monétaire + caisse document |
| Prix gérés uniquement au back-office | Corrigé dans ce lot | prix modèle validé, override employé refusé |

## 3. Changements réalisés dans le lot courant

- Hiérarchie `owner` / `responsible` / `employee`, avec protection du propriétaire.
- Nom d'utilisateur unique et connexion par nom d'utilisateur ou e-mail.
- Arabe par défaut sans écraser une préférence explicite.
- Historique de versions immuable et remplacement concurrent refusé.
- Audit `LOGIN` après authentification réussie et audit des duplications/versions.
- Page bilingue de raccourcis externes, CRUD Owner/Responsable et cartes/liste.
- Prix centralisé dans les modèles; override employé refusé et anciens modèles
  actifs sans prix désactivés par migration. Le seed préserve ensuite les tarifs
  administrés et ne réactive pas les modèles qui restent sans prix.
- Dépendance `effect` corrigée pour supprimer la vulnérabilité haute connue.
- Corrections i18n sur l'accueil, la session, le thème et la création de documents;
  premier rendu réellement arabe, métadonnées navigateur FR/AR, erreurs API
  localisées et alignement RTL de la navigation.
- Analyse des 13 DOCX historiques, rattachement exhaustif au catalogue et création
  de 13 contenus HTML anonymisés/tokenisés. Les dix nouveaux modèles restent inactifs:
  aucune clause non validée n'est publiée comme modèle opérationnel.
- Validation des modèles durcie: l'activation refuse désormais les placeholders
  inconnus ou les champs obligatoires absents au lieu de produire un PDF incomplet.
- Packaging documentaire assaini: seuls 13 DOCX générés depuis les contenus tokenisés
  sont inclus dans le standalone; les fichiers historiques bruts sont exclus du runtime.
- Nonce CSP transmis au script initial de thème: le back-office s'hydrate désormais
  sous la politique de production sans autoriser les scripts inline non approuvés.
- Liste des modèles corrigée pour ne plus déborder sur mobile en français ou en arabe.
- Readiness de production ajoutée: `/api/health` ne passe au vert que si PostgreSQL
  répond et si le stockage documentaire est accessible en lecture/écriture; le
  `HEALTHCHECK` du conteneur utilise désormais ce signal.
- Runtime aligné sur Next.js 16.4.6, version stable corrective, avec build des 29
  pages, tests et audit sans vulnérabilité haute ou critique.
- Sauvegarde/rollback corrigés: PostgreSQL et `documents_data` constituent désormais
  un seul point de reprise capturé sans écritures, vérifié par hashes et obligatoirement
  restauré sur une cible jetable avant toute opération destructive en production.
- Rollout supervisé défini: probes externes, événements `api_error` sans PII,
  seuils relatifs 5xx/p95, portes à 15/30/60 minutes et preuve à 24/48 heures;
  le fournisseur et les alertes restent à configurer sur l'environnement cible.
- Bootstrap des comptes durci: le seed de production exige une identité Owner
  explicite, ne crée aucun employé de démonstration par défaut et ne réécrit plus
  profil, mot de passe, état ou sessions d'un compte existant. L'ancien composant
  d'authentification factice contenant des identifiants de démonstration a été supprimé.
- Parcours de duplication corrigé: la copie brouillon indépendante ouvre maintenant
  son formulaire prérempli pour permettre les modifications avant génération.
- Redirection après connexion durcie: seules les destinations internes sont
  acceptées; les URL externes ou malformées retombent sur `/documents`.
- Impression supplémentaire fiabilisée: le formulaire part d'une copie, le serveur
  renvoie le nouveau compteur et l'état financier recalculé, puis l'écran actualise
  immédiatement le total, le paiement et la monnaie à rendre.
- Publication des modèles fermée: création, import et activation refusent désormais
  tout modèle actif sans HTML générable ou avec un contrat de placeholders invalide;
  seuls les brouillons inactifs peuvent rester incomplets.
- Recherche documentaire complétée: les filtres serveur et l'interface proposent
  maintenant explicitement le type de document et la catégorie, en plus du modèle,
  du statut, du créateur, des dates et du texte libre. Le panneau d'un client
  existant filtre et pagine également son propre historique côté serveur.
- Frontière d'impression durcie: les copies initiales et supplémentaires sont
  bornées à la capacité PostgreSQL, et le cumul est vérifié dans la transaction
  verrouillée avant toute écriture d'historique ou de paiement.

## 4. Vérifications obtenues

- `quality:verify` composite rejoué après le passage à Next.js 16.4.6 : réussi de
  bout en bout; preuve locale dans `evidence/2026-11-23-quality-verify.md`.
- `quality:fast` : réussi.
- ESLint et TypeScript : réussis.
- Tests unitaires : **115/115 réussis**.
- Audit contrats API : **20/20 handlers réussis**.
- Audit i18n : **555 clés utilisées, 0 manque FR, 0 manque AR, 0 message serveur brut dans l’UI**;
  le premier rendu serveur arabe est couvert par une politique testée.
- Build de production Webpack : compilation, types Next et génération des 29 pages
  réussis avec une URL d'authentification locale temporaire sur Next.js **16.4.6**.
  `next`, `@next/env` et `eslint-config-next` ont été alignés sur cette version stable
  corrigée; Webpack reste le moteur explicite et reproductible du gate de production.
- Schéma Prisma : valide.
- Chaîne des **16 migrations** rejouée intégralement sur une base PostgreSQL
  compatible PGlite jetable après correction de deux noms de colonnes historiques.
- Assertions de migration réussies : anciens administrateurs convertis en
  `owner`/`responsible`, usernames uniques générés et modèle sans prix désactivé.
- Scan de secrets et gitleaks : aucun secret trouvé.
- Audit dépendances : **0 haute/critique**, 1 modérée (`GHSA-g3hv-75wg-m249`),
  limitée à `minimatch 10.2.6` dans la chaîne ESLint de développement et absente
  du runtime applicatif. Le parent exige `^10.2.2`, tandis que la correction est
  en `11.0.1`; aucun override majeur incompatible n'est forcé. Révision au plus
  tard le 2026-12-23 ou dès qu'`@typescript-eslint` accepte la version corrigée.
- Budgets Webpack : **7/7 routes réussies**; lecteur de manifestes couvert pour
  Turbopack et Webpack, plafonds éditeurs recalibrés avec moins de 6 % de marge.
- `git diff --check` : aucune erreur de whitespace.
- Couverture des sources modèles : **13/13 DOCX référencés exactement une fois avec contenu HTML tokenisé**.
- Audit du standalone : **13/13 assets DOCX anonymisés, 0 DOCX historique brut et 0 référence brute dans les manifestes**.
- Smokes sur base jetable et build standalone: **permissions 52/52**, **documents
  46/46** et **administration 47/47**, avec génération PDF réelle dans Chromium.
  Le smoke documentaire courant couvre aussi les filtres globaux et par client,
  les dates invalides, les identifiants excessifs et la limite cumulative des copies.
- Contrôle responsive isolé de la liste des modèles: FR/LTR et AR/RTL à 390 px,
  **0 px de débordement** dans les deux langues.
- Readiness standalone vérifiée: **200/ok** avec PostgreSQL + stockage disponibles,
  puis **503/unavailable** après arrêt de PostgreSQL, toujours avec `no-store`.
- Seed non destructif vérifié sur base jetable: après modification du profil, des
  deux hashes de mot de passe et création d'une session Owner, un second seed a
  préservé les quatre valeurs; CI exécute désormais deux seeds successifs.

## 5. Données : état réel et limite de vérification

Le projet est maintenant relié au PostgreSQL Neon réel `doc-cyber`. Les 16
migrations ont été appliquées sur sa branche primaire `production`, le seed a été
exécuté deux fois sans écraser les comptes existants et `check:data` passe. Une
branche temporaire clonée depuis cet état a confirmé le même statut de migration
et les mêmes invariants.

Les assertions post-seed prouvent que les 13 contenus respectent leur contrat de
placeholders, que les 13 chemins d'asset sont anonymisés et qu'un seul modèle tarifé
est actif. Ces assertions font désormais partie du `check:data` durable: le contrôle
échoue aussi si le propriétaire unique/actif disparaît, si un modèle actif n'a pas
de prix valide, si un modèle n'a aucune source de rendu, si son contrat de placeholders
est incohérent ou si un asset packagé sort du répertoire anonymisé. Sur le seed jetable:
**1 propriétaire assigné et actif, 0 anomalie sur chacun de ces cinq contrôles**.
En conséquence :

- le schéma, la chaîne des migrations, le seed idempotent et les invariants de
  données initiales sont prouvés sur Neon réel et sur une branche isolée;
- une branche `clean-production-candidate-20261123`, restaurée depuis le snapshot
  pré-migration, a reçu les 16 migrations et le seed puis passé `check:data` avec
  zéro persona/document et un seul Owner actif;
- l'audit a détecté cinq documents et huit personas synthétiques laissés sur
  `production` par un ancien pré-push local. Aucun n'a été supprimé; la bascule vers
  la branche propre ou une purge ciblée exige l'accord explicite du Cyber Owner;
- le runner critique refuse désormais toute base non explicitement jetable. Les
  permissions repassent 52/52 sur la branche Neon isolée après refus HTTP 400 de
  l'inscription publique avant toute transaction Better Auth.

Preuve détaillée :
`evidence/2026-11-23-neon-recovery-and-smoke-isolation.md`.

## 6. Backlog de production priorisé

### P0 — bloque la mise en production

1. Maintenir la PR 13 et ses cinq checks verts sur chaque nouveau commit.
2. Approuver le seuil de limitation des connexions et les CIDR du reverse proxy,
   puis utiliser la table PostgreSQL `rate_limits` et tester la réponse `429`.
3. Décider entre la bascule vers la branche Neon propre vérifiée et une purge
   précisément ciblée des données synthétiques actuellement sur `production`.
4. Remplacer le snapshot pré-migration par un point de reprise post-migration après
   approbation, puis conserver la preuve de restauration.
5. Rejouer le gate critique unifié sur la branche Neon jetable après chaque changement;
   la matrice documents/admin/UX et les permissions ciblées sont déjà vertes sur Neon.
6. Vérifier manuellement Owner/Responsable, nouvelle version documentaire,
   raccourcis, prix, paiement, impressions et journal `LOGIN`.
7. Tarifer et faire valider juridiquement les dix modèles historiques encore inactifs.

### P1 — nécessaire avant go-live métier

1. Définir la rétention et la purge des journaux, personas et documents.
2. Valider la sauvegarde/restauration cohérente PostgreSQL + stockage documentaire.
3. Configurer secrets, URL canonique, stockage persistant et supervision.
4. Revue visuelle finale FR/AR sur mobile et desktop, incluant les messages
   d'erreur désormais localisés côté interface.
5. Faire valider les modèles et prix réels par le propriétaire métier.
6. Définir la rétention ou la purge hors runtime des DOCX historiques bruts encore
   présents dans le dépôt de travail et son historique Git.

### P2 — amélioration après stabilisation

1. Export du journal d'activité si exigé légalement.
2. Supervision de disponibilité des liens externes.
3. Recherche profonde par curseur/trigrammes si le volume le justifie.
4. OCR et traduction juridique assistée, explicitement hors MVP.

## 7. Plan d'exécution recommandé

1. **Sécurité runtime — terminée** : Next.js 16.4.6, build, tests et audit sans
   vulnérabilité haute ou critique.
2. **Recette données — terminée sur candidat isolé** : Neon disponible, 16 migrations,
   seed et contrôle qualité verts; bascule de la branche propre encore à approuver.
3. **Recette fonctionnelle** — smokes complets et parcours manuels des onze besoins.
4. **Exploitation** — backup/restore, rétention, secrets, stockage et monitoring.
5. **Décision go/no-go** — seulement si les P0 sont verts et les validations métier
   Owner sont signées.

## 8. Décision actuelle

Le code couvre les parcours des onze besoins exprimés et le catalogue référence les
13 sources disponibles. La fonctionnalité modèles n'est toutefois pas homologuée:
10 sources restent volontairement inactives en attente de traitement métier et
juridique. Le produit ne doit pas être annoncé « production ready » tant que cette
homologation, le choix de la branche Neon propre, la restauration du stockage,
le monitoring, la confidentialité et la recette métier manuelle ne sont pas approuvés.
