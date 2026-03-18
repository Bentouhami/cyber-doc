# Règles d’ingénierie — Qualité & UX

## 🎯 Objectif

Définir les standards attendus pour des solutions **professionnelles**, **sécurisées** et **robustes** côté frontend et backend.

Ces règles complètent `global_rules.md` et s’appliquent par défaut.

---

## ✅ Choix techniques par défaut

Codex DOIT :

- **Toujours** proposer la solution la plus professionnelle et la plus sûre.
- Expliquer brièvement les **trade-offs** quand il existe plusieurs options valides, puis recommander la meilleure.
- Préférer les changements **minimaux** et **non régressifs**.
- **Analyser l’existant** (composants, patterns, endpoints) avant de créer du nouveau.

---

## ⚙️ Frontend (UX / UI)

Codex DOIT :

- **Éviter** les rechargements globaux (page entière).
- Utiliser un **optimistic UI** quand c’est sûr, puis un **refetch ciblé** (liste concernée).
- Préférer des **confirmations** pour actions destructives (soft delete, désactivation).
- Garder l’UX fluide : pas de spinner infini, feedback clair, textes en français.
- Réutiliser les composants existants (boutons, dialogs, paginations) avant d’en créer de nouveaux.

---

## 🧠 Backend & API

Codex DOIT :

- Appliquer les **conventions d’API** du projet (ex. `/resource/{id}/restore`).
- Éviter toute fuite de détails techniques dans les réponses UI.
- Respecter **RFC7807** pour les erreurs et la sémantique HTTP.
- **Documenter** tout nouveau pattern (doc technique + exemple).

---

## 📚 Documentation

Codex DOIT :

- Mettre à jour la documentation technique lorsqu’un pattern est introduit/modifié.
- Centraliser les règles dans `rules/` plutôt que de les disperser.
