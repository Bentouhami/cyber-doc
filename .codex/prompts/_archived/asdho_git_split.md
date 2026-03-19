# Archived because fully covered by skill: asdhoconnect-git-ops

# Skill: `.codex/skills/asdhoconnect-git-ops/SKILL.md`

# Date: 2025-12-30

---

description: Aide pour split/merge propre (git) — ASDHO-CONNECT
---

# Git — split / merge / nettoyage (propre)

Objectif : proposer une stratégie git propre quand une branche contient plusieurs sujets (ex : frontend + backend + docs) ou quand il faut séparer des commits.

## Contraintes

- Respecte `../../rules/asdho_operational_rules.md` : tu **ne lance pas** de commandes qui modifient l’état ; tu **proposes** les commandes.
- Toujours fournir 2 variantes : **PowerShell** + **Git Bash/WSL**.
- Toujours utiliser des chemins absolus.

## Ce que tu dois demander / vérifier

1. **But** : split ? rebase ? cherry-pick ? revert ?
2. Branches impliquées : source, cible (`dev`, `main`, feature).
3. État working tree : modifications, non trackés, stash.
4. S'il y a des fichiers générés (build, cache) : les exclure.

## Procédure recommandée (templates)

### A) Split d’une branche en 2 branches thématiques

- Créer une branche “base” depuis la branche d’origine.
- Créer 2 nouvelles branches par thème.
- Cherry-pick / interactive rebase pour répartir les commits.

### Commande(s) à proposer

PowerShell (chemin projet) :

```powershell
cd C:\Projects\DEV\ASDHO-CONNECT-CLEAN
# 1) Sauvegarde
git status -sb
git branch --show-current
git fetch origin

# 2) Créer une branche de sauvegarde (optionnel)
git checkout -b backup/split-0 0Get-Date -Format yyyyMMdd)

# 3) Revenir sur la branche source
git checkout <BRANCHE_SOURCE>

# 4) Créer les branches thématiques
git checkout -b feat/topic-a
git checkout -b feat/topic-b

# 5) Répartir les commits
# Exemple : cherry-pick de commits (à adapter)
git cherry-pick <SHA1> <SHA2>
 
```

Git Bash / WSL :

```bash
cd /c/Projects/DEV/ASDHO-CONNECT-CLEAN
# 1) Sauvegarde
git status -sb
git branch --show-current
git fetch origin

# 2) Créer une branche de sauvegarde (optionnel)
git checkout -b backup/split-0 0Get-Date -Format yyyyMMdd)

# 3) Revenir sur la branche source
git checkout <BRANCHE_SOURCE>

# 4) Créer les branches thématiques
git checkout -b feat/topic-a
git checkout -b feat/topic-b

# 5) Répartir les commits
# Exemple : cherry-pick de commits (à adapter)
git cherry-pick <SHA1> <SHA2>

```

> Remplace `...` par des commandes exactes (pas de pseudo-code dans la version finale).

### B) Nettoyage de l’état (fichiers non souhaités)

Inclure :

- comment repérer les fichiers non voulus
- comment restaurer / nettoyer sans casser le repo

### C) Message de commit / PR

- Format : `feat(scope): ...`, `fix(scope): ...`, `docs: ...`, `chore: ...`
- PR : résumé + tests manuels + risques.

## Output attendu

- Un plan pas à pas.
- Des commandes prêtes à copier/coller (PowerShell + Git Bash/WSL).
- Une proposition de noms de branches (kebab-case) + commit messages.
