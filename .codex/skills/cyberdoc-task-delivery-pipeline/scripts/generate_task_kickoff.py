#!/usr/bin/env python3
"""Genere un markdown de kickoff de tache aligne avec le pipeline CyberDoc."""

from __future__ import annotations

import argparse
import datetime as dt
from textwrap import dedent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Genere le markdown de kickoff de tache")
    parser.add_argument("--jira", required=True, help="Cle issue, ex: TASK-192 (ou Jira key)")
    parser.add_argument("--module", required=True, help="Module cible, ex: orders")
    parser.add_argument("--type", required=True, help="Type: feat|fix|test|docs|chore|refactor")
    parser.add_argument("--summary", required=True, help="Resume de la tache")
    parser.add_argument("--parent", default="", help="Cle parent (optionnel)")
    parser.add_argument("--epic", default="", help="Cle Epic (optionnel)")
    parser.add_argument("--assignee", default="", help="Assignee (optionnel)")
    parser.add_argument("--priority", default="", help="Priorite (optionnel)")
    parser.add_argument("--due-date", default="", help="Date d'echeance YYYY-MM-DD (optionnel)")
    return parser.parse_args()


def build_markdown(args: argparse.Namespace) -> str:
    today = dt.date.today().isoformat()
    scope_tree = [
        f"- Epic: {args.epic or '<a-completer>'}",
        f"- Tache: {args.parent or '<a-completer>'}",
        f"- Sous-tache: {args.jira}",
    ]

    return dedent(
        f"""\
        # Kickoff Tache - {args.jira}

        Date : {today}
        Module: {args.module}
        Type : {args.type}
        Resume : {args.summary}
        Assignee : {args.assignee or '<a-completer>'}
        Priorite : {args.priority or '<a-completer>'}
        Date d'echeance : {args.due_date or '<a-completer>'}

        ## Arbre de Scope
        {chr(10).join(scope_tree)}

        ## Qualification Issue Tracker
        - [ ] Le ticket existe et est correctement lie (sous-tache -> tache -> epic/projet)
        - [ ] La description et les criteres d'acceptation sont complets
        - [ ] Le statut est passe a In Progress
        - [ ] La date de debut est verifiee
        - [ ] La date d'echeance est renseignee ou confirmee

        ## Fichiers Impactes (Hypothese Initiale)
        - [ ] app/...
        - [ ] components/...
        - [ ] lib|services|mappers|types/...
        - [ ] docs/...
        - [ ] prisma/migrations/...

        ## Plan d'Implementation
        1. [ ] Definir le scope, les contrats et les invariants
        2. [ ] Implementer le comportement minimal requis
        3. [ ] Ajouter/ajuster les tests automatiques
        4. [ ] Appliquer le durcissement (auth, validation, edge cases, securite)
        5. [ ] Executer les scenarios de validation manuelle
        6. [ ] Mettre a jour la documentation source de verite

        ## Plan de Test
        - Automatique :
          - [ ] Tests cibles
          - [ ] Suite plus large
        - Manuel :
          - [ ] Parcours nominal
          - [ ] Parcours d'erreur
          - [ ] Comportement role/permission

        ## Plan Documentation
        - [ ] Documentation module metier mise a jour
        - [ ] Strategie de test mise a jour (si couverture modifiee)
        - [ ] Documentation architecture/API mise a jour (si contrat modifie)
        - [ ] Fichiers sous `docs/` alignes avec les conventions projet

        ## Checklist Livraison
        - [ ] Changements git scopes et propres
        - [ ] Nom de branche contient la cle tache/sous-tache
        - [ ] Message de commit contient les refs issue
        - [ ] Titre PR contient la cle tache/sous-tache
        - [ ] Corps PR contient les cles Parent et Epic
        - [ ] Package PR prepare
        - [ ] Package merge prepare
        - [ ] Commentaire parent prepare avec preuve de merge (PR URL + date + commit)
        - [ ] Issue tracker transitionne vers Done apres merge
        """
    )


def main() -> None:
    args = parse_args()
    print(build_markdown(args))


if __name__ == "__main__":
    main()
