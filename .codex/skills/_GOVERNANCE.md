# CyberDoc — Codex Skills Governance

## Règle d’or (création de skills)

Un nouveau skill est autorisé uniquement si :

1) le besoin est stable/récurrent,
2) il est transversal (multi-modules),
3) il ne rentre pas proprement dans un skill existant.

Sinon, documenter via : référence, checklist ou guide (pas un skill).

Règle anti-régression: Codex ne doit pas créer de nouveau skill sans validation explicite de l’utilisateur.

Références de classification: `skills-manifest.json` + conventions du projet.

## Liste officielle des skills projet (actifs/adaptés)

| Skill | Rôle (1 ligne) | Catégorie |
| --- | --- | --- |
| cyberdoc-architecture-guardian | Vérifie les frontières d’architecture et le placement de la logique | Architecture |
| cyberdoc-security-review | Audit sécurité (auth, exposition, permissions) | Sécurité |
| cyberdoc-contract-validator | Vérifie DTO/Zod/types entre couches | Contrats |
| cyberdoc-docs-diagrams | Mise à jour documentation + PlantUML | Docs |
| cyberdoc-task-scripter | Génère scripts PowerShell/Bash sûrs | DevOps |
| cyberdoc-baseline-compliance | Gate final de conformité baseline | Output |
| cyberdoc-silent-writer | Politique d’output silencieuse | Output |
| cyberdoc-git-ops | Workflow git split/branches | DevOps |
| cyberdoc-rfc7807-audit | Audit RFC7807 erreurs API | Sécurité |
| cyberdoc-auth-session-network | Auth/session/network refresh | Sécurité |
| cyberdoc-nextjs-feature-scaffold | Scaffold feature Next.js | Architecture |
| context7-mcp | Documentation officielle framework/librairies | Autre |
| gh-address-comments | Hygiène commentaires GitHub | Autre |
| gh-fix-ci | Aide à la correction CI | Autre |

## Règles de nommage et scope

- Nommage: kebab-case.
- Préfixe recommandé pour les skills projet: `cyberdoc-`.
- Scope: un skill couvre une capacité récurrente, pas un cas unique.

## Quand utiliser references/, scripts/, assets/

- references/: checklists, templates, conventions, routing.
- scripts/: automatisations sûres et répétables (dry-run/confirmation).
- assets/: ressources statiques (ex: templates, diagram stubs).

## Politique d’évolution

- Mise à jour d’un skill existant: autorisée si elle reste dans le scope.
- Nouveau skill: uniquement via décision explicite conforme à la règle d’or.

## Process de dépréciation

- Déplacer le skill vers `skills-legacy/asdho/`.
- Ajouter une note de dépréciation dans le README du dossier legacy.
- Référencer le skill remplaçant (si applicable).

## Principe clé

- 1 problème ≠ 1 skill
