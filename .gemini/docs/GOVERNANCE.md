# ASDHO-CONNECT — Codex Skills Governance

## Règle d’or (création de skills)

Un nouveau skill est autorisé uniquement si :

1) le besoin est stable/récurrent,
2) il est transversal (multi-modules),
3) il ne rentre pas proprement dans un skill existant.

Sinon, documenter via : référence, checklist ou guide (pas un skill).

Règle anti-régression: Codex ne doit pas créer de nouveau skill sans validation explicite de l’utilisateur.

Référence baseline: `.codex/prompts/ASDHO-CONNECT_BASELINE.md`

## Liste officielle des skills ASDHO-CONNECT

| Skill | Rôle (1 ligne) | Catégorie |
| --- | --- | --- |
| asdhoconnect-architecture-guardian | Vérifie les frontières d’architecture et le placement de la logique | Architecture |
| asdhoconnect-security-review | Audit sécurité (auth, exposition, permissions) | Sécurité |
| asdhoconnect-contract-validator | Vérifie DTO/Zod/types entre couches | Contrats |
| asdhoconnect-docs-diagrams | Mise à jour documentation + PlantUML | Docs |
| asdhoconnect-task-scripter | Génère scripts PowerShell/Bash sûrs | DevOps |
| asdhoconnect-baseline-compliance | Gate final de conformité baseline | Output |
| asdhoconnect-silent-writer | Politique d’output silencieuse | Output |
| asdhoconnect-git-ops | Workflow git split/branches | DevOps |
| asdhoconnect-rfc7807-audit | Audit RFC7807 erreurs API | Sécurité |
| asdhoconnect-auth-session-network | Auth/session/network refresh | Sécurité |
| asdhoconnect-api-platform-resource-builder | Génère ressources API Platform | Architecture |
| asdhoconnect-nextjs-feature-scaffold | Scaffold feature Next.js | Architecture |
| context7-mcp | Documentation officielle framework/librairies | Autre |
| gh-address-comments | Hygiène commentaires GitHub | Autre |
| gh-fix-ci | Aide à la correction CI | Autre |

## Règles de nommage et scope

- Nommage: kebab-case, préfixe asdhoconnect- pour les skills de projet.
- Scope: un skill couvre une capacité récurrente, pas un cas unique.

## Quand utiliser references/, scripts/, assets/

- references/: checklists, templates, conventions, routing.
- scripts/: automatisations sûres et répétables (dry-run/confirmation).
- assets/: ressources statiques (ex: templates, diagram stubs).

## Politique d’évolution

- Mise à jour d’un skill existant: autorisée si elle reste dans le scope.
- Nouveau skill: uniquement via décision explicite conforme à la règle d’or.

## Process de dépréciation

- Déplacer le skill vers `.codex/skills/_archived/`.
- Ajouter une note de dépréciation dans le README du dossier archived.
- Référencer le skill remplaçant (si applicable).

## Principe clé

- 1 problème ≠ 1 skill
