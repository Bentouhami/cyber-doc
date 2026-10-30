---
id: UX-001
title: Internationalisation, RTL et accessibilité
status: production-candidate
owners: product/frontend
last-reviewed: 2026-10-24
---

# Internationalisation, RTL et accessibilité

## Résumé

L’interface fonctionne en français et en arabe, adapte la direction LTR/RTL et
conserve un parcours clavier sur desktop et mobile.

## Périmètre utilisateur

Le sélecteur de langue s’applique aux espaces de connexion, administration,
modèles et documents. Les documents possèdent aussi leur propre langue métier.

## Règles métier

- Chaque clé utilisée existe en français et en arabe.
- L’arabe applique `dir="rtl"`; le français applique `dir="ltr"`.
- Le changement de langue UI ne modifie pas silencieusement la langue d’un document.
- Les contrôles interactifs restent accessibles au clavier.

## Architecture et données

Ressources sous `locales/`, provider i18n, hook de locale, language switcher et
composants UI responsifs.

## API et contrats

La préférence UI est persistée par cookie. Les APIs de modèles/documents exposent
les champs linguistiques nécessaires sans dépendre du texte affiché.

## Permissions et sécurité

La locale n’accorde aucun droit et ne remplace jamais les contrôles serveur. Les
chaînes traduites sont traitées comme du contenu, pas comme du HTML de confiance.

## Erreurs et cas limites

Clé brute visible, direction incorrecte, débordement horizontal, focus invisible et
hydratation divergente sont des régressions bloquantes.

## Tests et preuves

`pnpm run i18n:audit` exige zéro clé manquante. `pnpm run check:ux` teste FR/AR,
desktop/mobile, RTL, débordement, erreurs runtime et navigation clavier. La même
matrice exécute Axe sur les règles WCAG 2 A/AA, 2.1 A/AA et 2.2 AA et bloque toute
violation `critical` ou `serious`.

Les iframes de prévisualisation de documents sont exclues de l'analyse de la page :
leur conteneur et son nom accessible restent contrôlés, mais leur corps HTML
non interactif est un document sandboxé et non une partie de l'interface CyberDoc.

## Exploitation

Toute nouvelle chaîne est ajoutée aux deux locales dans la même modification.
`@axe-core/playwright` est une dépendance directe épinglée; les rapports ne
conservent ni HTML, ni valeur de champ, ni donnée personnelle. L’automatisation
complète les revues manuelles lecteur d’écran/zoom et ne prétend pas prouver à elle
seule la conformité WCAG.

## Historique

- 2026-10-30 — Axe exécuté sur 32/32 parcours, zéro violation sérieuse/critique.
- 2026-10-24 — Axe ajouté au gate critique; 28/28 parcours validés, zéro
  violation serious/critical et corrections des noms accessibles, labels, focus
  des régions scrollables et contrastes de statuts.
- 2026-10-30 — 489 clés alignées et 32 contrôles UX validés.
- 2026-10-24 — 458 clés alignées et 28 contrôles UX validés.
