# ADR-001: Barrières qualité locales et CI obligatoires

## Statut

Accepté

## Date

2026-10-24

## Contexte

Le projet disposait de scripts isolés, mais un push pouvait partir sans audit de
dépendances, recherche de secrets, base de test réelle ou smoke complet. Le workflow
tolérait aussi l’indisponibilité de la base.

## Décision

Définir `CONSTRAINTS.md` comme contrat, exécuter `quality:prepush` via un hook Git et
répéter les contrôles dans GitHub Actions avec PostgreSQL isolé, migrations, seed et
E2E sans skip.

## Alternatives considérées

### Checklist manuelle

Rejetée car elle dépend de la mémoire et ne bloque pas une régression.

### CI uniquement

Rejetée car le retour arrive trop tard et multiplie les cycles push/correction.

### Hook uniquement

Rejeté car un hook local peut être absent ou contourné.

## Conséquences

- Les erreurs sont détectées avant push puis vérifiées dans un environnement propre.
- Un push complet prend plus de temps et nécessite PostgreSQL et Chromium localement.
- Les secrets CI et la protection de branches doivent être configurés dans GitHub.
