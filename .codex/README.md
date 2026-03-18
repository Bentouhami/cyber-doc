# Codex — ASDHO-CONNECT

Ce dossier contient les **règles** et **prompts partagés** utilisés avec Codex (extension VS Code) pour travailler sur **ASDHO-CONNECT** (backend Symfony 7 / API Platform + frontend Next.js 16).

Objectifs :

- Réduire les répétitions (audits, refactors, documentation).
- Garder une qualité constante (sécurité, conventions, RFC7807).
- Aligner l’équipe sur des pratiques identiques.

## Structure

- `rules/`
  - `global_rules.md` : règles globales (sécurité, conventions, style de réponses, bonnes pratiques).
  - `engineering_quality.md` : règles d’ingénierie (qualité, UX, patterns).
  - `asdho_operational_rules.md` : règles opérationnelles (commandes autorisées, chemins, format des commandes).
- `prompts/` : prompts classés par thème (API, architecture, git, qualité).

## Règle d’or

Avant d’utiliser un prompt, Codex doit **toujours** lire et respecter :

1. `rules/global_rules.md`
2. `rules/engineering_quality.md`
3. `rules/asdho_operational_rules.md`

## Activation (recommandée)

Définir `CODEX_HOME` vers le dossier `.codex` du projet.

### PowerShell

```powershell
$env:CODEX_HOME="C:\Projects\DEV\ASDHO-CONNECT\.codex"
```

### Git Bash / WSL

```bash
export CODEX_HOME="/c/Projects/DEV/ASDHO-CONNECT/.codex"
```

## Contribution

- Les règles dans `rules/` ne se modifient qu’après validation d’équipe.
- Les prompts doivent rester **actionnables**, **courts**, et **orientés livrables**.
- Éviter de mélanger une refonte de prompts avec une feature : faire une PR dédiée.
