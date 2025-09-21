# Cas d'utilisation CyberDoc

Référence au diagramme PlantUML : `use-cases.puml`.

## UC-01 · Gérer les modèles de contrat
- Acteurs : Administrateur.
- Description : créer, modifier, archiver des modèles disponibles pour les agents.
- Scénario principal : sélection depuis l'onglet "إدارة النماذج", édition du contenu, publication.

## UC-02 · Générer un contrat pour un client
- Acteurs : Agent, Client (indirect).
- Description : un agent sélectionne un modèle, renseigne les données du client, génère un PDF.
- Extensions : validation obligatoire par un administrateur pour finaliser.

## UC-03 · Consulter l'archive des contrats
- Acteurs : Administrateur, Agent.
- Description : rechercher, filtrer et télécharger les contrats existants.

Ajoutez un sous-chapitre par cas d'utilisation avec scénarios alternatif, pré/post conditions et règles métier.
