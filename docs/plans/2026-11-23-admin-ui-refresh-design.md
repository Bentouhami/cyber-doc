# Refonte UI du back-office CyberDoc

## Objectif

Rendre les écrans d'administration immédiatement lisibles en français et en arabe,
sans modifier les contrats API, les permissions ni les données. La fiche modèle
sert de pilote avant propagation des mêmes patterns aux autres écrans du back-office.

## Direction validée

- Conserver les composants shadcn/ui, les tokens Tailwind et les icônes Lucide déjà installés.
- Donner à chaque groupe fonctionnel une surface, une bordure, un titre et une icône.
- Conserver des libellés visibles au-dessus des champs, indépendamment des placeholders.
- Mettre les informations métier prioritaires avant les zones techniques.
- Respecter le RTL, le mode sombre, le clavier et une hauteur tactile minimale de 44 px.

## Livraisons

1. [Terminé] Fiche modèle : informations générales, tarification, contenu HTML/CSS et PDF.
2. [Terminé] Catalogue des modèles : filtres, prix et états plus faciles à parcourir.
3. [En cours] Autres écrans d'administration : gestion des employés et import de
   modèles alignés et validés en FR/AR, clair/sombre et mobile/bureau; propagation
   restante écran par écran.

## Vérification

Chaque tranche passe les audits i18n, type, lint et qualité rapide, puis une inspection
visuelle en français/arabe aux formats mobile et bureau, en thèmes clair et sombre.
