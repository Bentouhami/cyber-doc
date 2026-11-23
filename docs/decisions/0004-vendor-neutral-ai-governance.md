# ADR-004: Gouvernance IA indépendante du fournisseur

## Statut

Accepté

## Date

2026-10-24

## Contexte

Les règles du projet étaient réparties entre des fichiers associés à Codex,
Gemini et GitHub Copilot. Un nouvel assistant pouvait ignorer une partie du
processus ou suivre une copie devenue obsolète. Dupliquer toutes les règles pour
chaque outil augmenterait encore ce risque de divergence.

## Décision

Utiliser `AGENTS.md` à la racine comme contrat universel et indépendant du
fournisseur. Le README et la documentation d’onboarding le rendent découvrable
par les humains et les outils sans convention native. Les fichiers propres à un
assistant deviennent de simples adaptateurs qui renvoient vers cette source et ne
peuvent pas l’affaiblir.

## Alternatives considérées

### Une copie complète par assistant

Rejetée parce que les règles évolueraient à des rythmes différents.

### Uniquement des instructions configurées dans les services externes

Rejetée parce qu’elles ne sont ni versionnées avec le code ni accessibles à tous
les contributeurs.

### Aucun adaptateur spécifique

Rejetée car certains assistants ne découvrent automatiquement que leur fichier
conventionnel. Les adaptateurs courts améliorent la découverte sans dupliquer la
politique.

## Conséquences

- Tout assistant dispose du même ordre de lecture, du même processus et des mêmes
  barrières de sécurité.
- Une évolution de gouvernance se fait dans `AGENTS.md` et les documents
  canoniques, pas dans plusieurs copies.
- Un outil qui ne découvre aucun fichier automatiquement doit recevoir le lien
  vers `AGENTS.md` dans son prompt initial.
