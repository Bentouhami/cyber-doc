# Quality prompts — ASDHO-CONNECT

## Objectif

Prompts d’audit qualité et d’amélioration continue, sans changement fonctionnel. Ils servent à analyser le code existant, identifier la dette technique et proposer des refactors sûrs (lisibilité, maintenabilité, testabilité, cohérence d’architecture) sur backend Symfony/API Platform, frontend Next.js, tests et structure des dossiers.

## Quand utiliser ces prompts

- Audit de code avant refactor ou revue globale.
- Vérification des bonnes pratiques Symfony/API Platform/Next.js/tests.
- Analyse de dette technique, tests manquants ou fragiles.
- Propositions de refactors progressifs et non fonctionnels.

## Quand NE PAS les utiliser

- Définir ou modifier des règles globales/opérationnelles.
- Introduire ou changer la logique métier sans l’indiquer explicitement.
- Exécuter des commandes à effet de bord (build, migrations, tests lourds, etc.).

## Exemples de prompts qualité

- Audit d’un module backend pour conformité RFC7807 et clarté des services.
- Revue du client API frontend (timeouts, erreurs typées, toasts) sans changer le comportement métier.
- Inspection des tests (couv., flakiness) et propositions de stabilisation.
- Vérification de la cohérence des conventions internes (naming, structure de dossiers).

## Rappel

- Les règles globales et opérationnelles s’appliquent toujours (`.codex/rules/*`).
- Ne jamais redéfinir les règles globales dans `quality/`.
