# Documentation CyberDoc

Ce répertoire regroupe toutes les ressources d'analyse fonctionnelle et technique du projet. Chaque sous-dossier cible un artefact précis (modèles de données, user stories, cas d'utilisation, séquences, etc.).

## Structure

- `analysis/` : synthèses fonctionnelles et techniques.
- `analysis/data-model/` : modèles conceptuel, logique et physique (+ PlantUML).
- `features/` : documentation canonique de chaque fonctionnalité livrée.
- `decisions/` : décisions d’architecture (ADR) et leurs conséquences.
- `engineering/` : méthode de travail, qualité, sécurité et livraison.
- `finalization/` : audit projet complet, plan d'amélioration et checklist de finalisation.
- `project-state/` : état réel du code, inventaire des features, mission produit, plan d'exécution vers release.
- `user-stories/` : backlog fonctionnel sous forme de user stories.
- `use-cases/` : diagrammes et descriptions textuelles des cas d'utilisation.
- `sequence-diagrams/` : scénarios dynamiques et diagrammes de séquence.

Ajoutez et mettez à jour ces fichiers au fil de l'évolution du produit.

## Point d'entrée recommandé

Pour comprendre ou modifier le produit, commencez par:

1. `../AGENTS.md` (contrat universel pour humains et assistants IA)
2. `engineering/AI_ASSISTANT_ONBOARDING.md`
3. `features/README.md`
4. `engineering/QUALITY_PROCESS.md`
5. `engineering/SECURITY_THREAT_MODEL.md`
6. `engineering/PRIVACY_OPERATIONS.md`
7. `../CONSTRAINTS.md`
8. `decisions/`
9. `project-state/mission-and-product-scope.md`
