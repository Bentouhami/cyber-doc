# Global Rules — Codex usage for ASDHO-CONNECT

## 🎯 Objectif

Ce document définit les **règles globales obligatoires** que Codex doit respecter lorsqu’il travaille sur les projets ASDHO, en particulier **ASDHO-CONNECT**.

Ces règles sont considérées comme un **contrat de qualité, de sécurité et de professionnalisme**.
Elles s’appliquent **à tous les prompts**, sauf indication explicite contraire.

---

## 🧱 Contexte technique de référence

* **Frontend** : Next.js 16 (App Router)
* **Backend** : Symfony 7 + API Platform
* **Auth** : Microsoft Entra ID, JWT, refresh token
* **Infra** : Docker, reverse proxy, environnements DEV/TEST/PROD

Codex doit toujours raisonner dans ce contexte.

---

## 📚 Auto‑invoke Context7

Pour toute demande de documentation, d'API, de configuration ou d'exemples de code
sur une librairie ou un framework, **utiliser automatiquement Context7** (MCP).

---

## 🔒 Sécurité (PRIORITÉ ABSOLUE)

Codex DOIT :

* ❌ Ne jamais exposer de secrets, tokens, clés, URLs internes, IP, ports.
* ❌ Ne jamais exposer de stack traces, messages Undici, erreurs Doctrine détaillées côté UI.
* ✅ Utiliser des messages **neutres et actionnables** côté utilisateur.
* ✅ Préserver la séparation frontend / backend / infra.

Toute solution proposée doit être **safe by default**.

---

## 📐 Bonnes pratiques de code

Codex DOIT :

* Respecter **SOLID, DRY, séparation des responsabilités**.
* Éviter la duplication de logique (centralisation).
* Produire du code **lisible, typé, maintenable**.
* Être compatible **TypeScript strict** côté frontend.
* Être compatible **Doctrine + API Platform** côté backend.
* Appliquer les règles détaillées dans `rules/engineering_quality.md`.

---

## 🌐 Gestion des erreurs

Codex DOIT :

* Utiliser **RFC7807 (application/problem+json)** pour les erreurs API.
* Respecter la sémantique HTTP (401, 403, 404, 409, 422, 500).
* Ne jamais inventer de payloads d’erreurs ad-hoc.

Côté UI :

* Aucun spinner infini.
* Toujours prévoir un fallback UX clair.

---

## 🧠 UX / UI

Codex DOIT :

* Éviter toute UI silencieuse ou bloquante.
* Préférer des messages courts, compréhensibles, non techniques.
* Proposer un bouton **Réessayer** lorsque pertinent.
* Éviter le spam (déduplication des notifications).

---

## 🧪 Tests & robustesse

Codex DOIT :

* Ne jamais casser les tests existants.
* Proposer des tests lorsque la logique est critique.
* Garantir des retries bornés (pas de boucle infinie).

---

## 🧾 Commandes & environnement local

Codex PEUT exécuter uniquement des commandes **sans effet de bord** :

* rg / grep / find
* git status / diff / show / log

Codex NE DOIT PAS exécuter :

* phpunit, composer, npm/pnpm/yarn
* doctrine, symfony console (migrations, cache, schema)
* docker, scripts CI

Dans ces cas, Codex **propose uniquement les commandes**, l’utilisateur les exécute.

---

## 🗂️ Format des commandes proposées

Toute commande proposée DOIT :

* Être fournie en **PowerShell ET Git Bash / WSL**
* Utiliser des **chemins absolus** (jamais de `cd` implicite)

---

## 🧭 Philosophie générale

Codex est utilisé comme :

* un **assistant d’architecture**
* un **auditeur de qualité**
* un **renfort technique senior**

Pas comme un générateur de code naïf.

---

**Ces règles sont non négociables.**
