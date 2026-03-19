# Codex — Prompts ASDHO-CONNECT

## 🎯 Objectif

Ce dossier contient les **prompts opérationnels** utilisés avec Codex pour le projet **ASDHO-CONNECT**.

Ces prompts servent à :

* standardiser les audits techniques (API, sécurité, architecture)
* réappliquer rapidement des conventions validées (RFC7807, UX, Git)
* éviter la répétition d’explications complexes à chaque interaction
* garantir un niveau de qualité constant dans le temps

⚠️ **Ces fichiers ne remplacent pas les règles globales**, ils les complètent.

---

## 📁 Où sont les prompts ?

Les prompts sont organisés par thématique :

```txt
.codex/prompts/
├─ architecture/     # Contexte global, refresh d’architecture
├─ api/              # Erreurs API, sécurité, contrats frontend/backend
├─ git/              # Découpage commits, branches, process Git
├─ quality/          # Audits qualité, conventions, standards
└─ README.md         # Ce fichier
```

Chaque prompt est **spécifique à un usage précis**.

---

## 📜 Règles obligatoires (À LIRE AVANT UTILISATION)

Avant d’utiliser **n’importe quel prompt**, Codex DOIT respecter :

* `.codex/rules/global_rules.md`
* `.codex/rules/asdho_operational_rules.md`

Ces règles définissent :

* les contraintes de sécurité
* les conventions d’erreurs (RFC7807)
* les règles d’exécution de commandes
* les chemins projet et formats attendus

👉 Les prompts de ce dossier **n’ont pas le droit de les outrepasser**.

---

## 🧩 Comment choisir le bon prompt ?

### Architecture

Utiliser un prompt dans `architecture/` pour :

* remettre Codex dans le contexte global du projet
* discuter de choix structurants
* analyser des flux transverses

### API / Backend

Utiliser un prompt dans `api/` pour :

* gestion d’erreurs API
* sécurité
* refresh/auth/network
* cohérence frontend ↔ backend

### Git / Process

Utiliser un prompt dans `git/` pour :

* refactor lourd
* split de commits
* stratégie de branches

### Qualité / Standards

Utiliser un prompt dans `quality/` pour :

* audits de code
* règles de style
* amélioration continue

---

## 📦 Prompts archivés

Les prompts ci-dessous sont archivés car ils sont entièrement couverts par des skills :

* `api/asdho_api_errors_audit.md` → `asdhoconnect-rfc7807-audit`
* `architecture/asdho_context_refresh.md` → `asdhoconnect-auth-session-network`
* `git/asdho_git_split.md` → `asdhoconnect-git-ops`

---

## ▶️ Activation recommandée (projet spécifique)

Pour un usage cohérent dans ce projet, il est recommandé de définir la variable d’environnement `CODEX_HOME` vers le dossier `.codex`.

### PowerShell

```powershell
$env:CODEX_HOME = "C:\Projects\DEV\ASDHO-CONNECT\.codex"
```

### Git Bash / WSL

```bash
export CODEX_HOME="/c/Projects/DEV/ASDHO-CONNECT/.codex"
```

---

## 🧠 Bonnes pratiques

## ✅ Skill de conformité (fin de tâche)

* `asdhoconnect-baseline-compliance` — gate final de conformité avant clôture.

* Toujours utiliser **le prompt le plus spécifique possible**
* Ne jamais dupliquer les règles globales dans un prompt
* Mettre à jour les prompts lors des évolutions majeures (frameworks, sécurité)
* Considérer ces fichiers comme de la **documentation vivante**

---

**Ce dossier fait partie intégrante du projet ASDHO-CONNECT.**

