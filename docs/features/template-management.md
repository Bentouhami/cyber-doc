---
id: TPL-001
title: Catalogue et cycle de vie des modèles
status: production-candidate
owners: product/fullstack
last-reviewed: 2026-11-23
---

# Catalogue et cycle de vie des modèles

## Résumé

Les administrateurs créent, importent, modifient, valident, dupliquent et archivent
les modèles utilisés pour générer des documents.

## Périmètre utilisateur

Écrans `/admin/templates`, `/new`, `/import`, `/[slug]` et `/requests`. Les employés
consultent uniquement les modèles actifs nécessaires à la génération.

## Règles métier

- Le slug identifie le modèle et reste unique.
- Les champs, rôles participants, groupes, langue et asset forment un contrat unique.
- La création, l'import et l'activation refusent un modèle actif sans contenu HTML,
  tout champ obligatoire absent du contenu et tout placeholder qui n'existe pas
  dans le contrat de champs. Un brouillon inactif peut rester incomplet.
- Les doublons probables exigent une confirmation explicite.
- Un modèle archivé n’est plus proposé pour une nouvelle génération.

## Architecture et données

Routes sous `app/api/templates`, services d’import et de génération, modèles Prisma
`DocumentTemplate`, `TemplateField`, groupes, rôles et `TemplateAsset`.

## API et contrats

Le catalogue expose liste/détail/CRUD, import, duplication, validation, rendu test
et téléchargement d’asset. Les payloads JSON sont validés avec Zod 4.

## Permissions et sécurité

Les mutations et assets d’administration sont admin-only; un employé peut soumettre
une demande et importer le DOCX associé. La taille déclarée est refusée avant lecture
du multipart lorsqu’elle dépasse la limite; indépendamment de cet en-tête, le flux
HTTP est lu avec une limite dure avant parsing multipart. Ainsi les requêtes chunked
ou avec une longueur mensongère ne peuvent pas dépasser la borne de 10 MiB plus
l’enveloppe multipart. Le
serveur exige une archive ZIP/DOCX valide avec `[Content_Types].xml` et
`word/document.xml`, borne le nombre et la taille décompressée des entrées et refuse
les macros VBA.

Les nouveaux assets sont créés exclusivement sous le volume persistant
`DOCS_STORAGE_DIR/template-assets`. La lecture admin part toujours de la relation
`TemplateAsset`, accepte ce stockage (et l’ancien préfixe `template-requests`) ou les
assets hérités contrôlés sous `templates_docs`, puis applique le contrôle `realpath`.
Toute chaîne contenant un symlink/junction, sortant de la racine réelle ou ne ciblant
pas un fichier régulier est refusée. Le nom servi dans
`Content-Disposition` est neutralisé contre les caractères de contrôle.
Les titres fournis dans une demande employé ont une taille bornée et sont échappés
avant toute interpolation dans le brouillon HTML.

Tout HTML de modèle traverse l’allowlist serveur de
`services/templateContentSecurity.ts` avant création, import, modification ou
duplication, puis de nouveau avant preview/rendu. Seules les structures de document
texte et tableaux sont conservées. Scripts, iframes, formulaires, `meta`, `base`,
SVG, MathML, handlers `on*` et attributs URL actifs sont supprimés. Le CSS est
réduit à des règles plates et à une liste de propriétés/valeurs d’impression ; les
at-rules et primitives `url()`, `@import`, `expression`, `behavior`, `javascript:`,
`data:` et `file:` sont rejetées. Les contenus HTML/CSS sont bornés respectivement
à 1 000 000 et 200 000 caractères.

## Erreurs et cas limites

Slug ou contenu dupliqué, asset absent, placeholder inconnu, langue incohérente et
chemin invalide produisent une erreur contrôlée.

## Tests et preuves

`pnpm run smoke:admin` couvre CRUD, garde anti-doublon, validation, PDF de test,
duplication, import, échappement des titres de demande et nettoyage.
`tests/unit/template-content-security.test.ts` couvre les charges XSS, URL et CSS
ainsi que la conservation des titres, placeholders, tableaux et styles autorisés.
`tests/unit/template-placeholder-policy.test.ts` couvre les placeholders requis,
inconnus, dédupliqués et conformes au contrat.
Après le build, `pnpm run check:standalone-template-assets` refuse tout DOCX brut
dans le standalone et vérifie que les 13 assets anonymisés sont présents.
`tests/unit/docx-upload-security.test.ts` couvre taille déclarée, flux chunked,
signature ZIP, structure DOCX et macros; `tests/unit/template-asset-storage.test.ts` couvre écriture et résolution
des assets persistants. Le smoke permissions vérifie qu’un employé ne peut pas lire
le DOCX brut.

## Exploitation

Seuls les assets générés et anonymisés sous `templates_docs/sanitized` sont inclus
par l’output tracing Next.js. Les DOCX historiques bruts ne font pas partie du bundle
standalone. Les imports employés ne sont jamais ajoutés à Git : le volume
`DOCS_STORAGE_DIR` doit être durable, sauvegardé et restauré avec la base. Les clauses
des brouillons exigent toujours une validation produit/juridique avant activation.

## Historique

- 2026-11-23 — Activation bloquée si un placeholder requis manque ou si un placeholder inconnu produirait un champ vide.
- 2026-11-23 — Remplacement des assets de production historiques par 13 DOCX générés, tokenisés et sans identifiant littéral.
- 2026-10-31 — Import DOCX borné/validé, stockage persistant et politique de packaging alignés.
- 2026-10-24 — Validation du cycle complet sous Next.js 16.4.3 et Zod 4.
- 2026-10-24 — Bornage et échappement des titres interpolés dans les brouillons.
- 2026-10-24 — Sanitizer serveur canonique HTML/CSS avec défense en profondeur au rendu.
- 2026-10-24 — Délivrance d’assets durcie contre symlinks et injection d’en-têtes.
