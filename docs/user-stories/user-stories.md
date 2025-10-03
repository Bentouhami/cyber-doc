# Backlog de User Stories

Format recommandé :
> En tant que <type d'utilisateur>, je veux <fonctionnalité> afin de <objectif métier>.

## US-01 · Générer un contrat standard

- En tant que **agent** je veux sélectionner un modèle de contrat existant afin de produire rapidement un contrat conforme.
- Critères d'acceptation :
  - Choix du modèle dans une liste filtrable.
  - Prévisualisation du document avant validation.
  - Génération du contrat au format PDF et enregistrement dans l'historique.

## US-02 · Personnaliser les clauses

- En tant que **agent** je veux ajouter/éditer des clauses spécifiques afin d'adapter le contrat au contexte du client.
- Critères d'acceptation :
  - Interface pour ajouter des sections optionnelles.
  - Validation des champs obligatoires (avec zod).
  - Historisation des versions pour retrouver les modifications.

## US-03 · Approuver un contrat

- En tant que **administrateur** je veux approuver ou rejeter un contrat généré afin de garantir sa conformité légale.
- Critères d'acceptation :
  - Liste des contrats en attente avec statut.
  - Possibilité d'ajouter un commentaire lors du rejet.
  - Notification visuelle aux agents.

Ajoutez ici toutes les user stories complémentaires (gestion des clients, reporting, intégrations externes, etc.).
