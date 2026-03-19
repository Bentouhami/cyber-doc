#!/usr/bin/env python3
"""Genere un modele de description d'issue structure pour la livraison CyberDoc.

Compatible Jira: conserver `--jira` pour retro-compatibilite.
"""

from __future__ import annotations

import argparse
from textwrap import dedent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Genere un texte de description d'issue structure")
    parser.add_argument("--jira", required=True, help="Cle issue, ex: TASK-181 (ou Jira key)")
    parser.add_argument("--summary", required=True, help="Resume de la tache")
    parser.add_argument("--module", required=True, help="Module cible, ex: orders")
    parser.add_argument("--type", required=True, help="Type: feat|fix|test|docs|chore|refactor")
    parser.add_argument("--parent", default="", help="Cle parent, ex: TASK-162")
    parser.add_argument("--epic", default="", help="Cle epic/projet, ex: TASK-110")
    parser.add_argument("--pr-url", default="", help="URL de PR si deja ouverte/mergee")
    parser.add_argument(
        "--context",
        default="Le flux metier/utilisateur est impacte et requiert un comportement stable.",
        help="Phrase de contexte courte",
    )
    parser.add_argument(
        "--problem",
        default="Le comportement actuel provoque des regressions, une persistance incoherente ou un feedback UX insuffisant.",
        help="Problematique",
    )
    return parser.parse_args()


def build_description(args: argparse.Namespace) -> str:
    jira_key = args.jira.upper().strip()
    parent_key = args.parent.upper().strip() or "N/A (tache de premier niveau ou enfant d'epic)"
    epic_key = args.epic.upper().strip() or "<a-completer>"
    pr_line = args.pr_url.strip() or "<a-completer-a-l-ouverture>"

    return dedent(
        f"""\
        Contexte
        - {args.context}

        Probleme
        - {args.problem}
        - Objectif de la tache: {args.summary}

        Dans le scope
        - Implementer le comportement requis dans le module `{args.module}` pour la tache `{args.type}`.
        - Eviter les regressions sur le flux utilisateur/API impacte.
        - Garantir un feedback clair en succes et en erreur.

        Hors scope
        - Refactors non lies et redesign UI non bloquant.
        - Changements cross-module non requis par les criteres d'acceptation.

        Criteres d'acceptation
        - [ ] Le comportement requis est implemente et conforme a l'intention de la tache.
        - [ ] Les donnees/etats persistent correctement sur les flux save/update.
        - [ ] Aucune regression de refresh complet ni perte d'etat.
        - [ ] Les chemins d'erreur renvoient un feedback clair et actionnable.
        - [ ] Une couverture de regression existe (tests automatiques si applicable).

        Plan de validation
        - Automatique: tests cibles + suite module pertinente.
        - Manuel: parcours nominal, parcours d'erreur, et verifications liees aux roles.

        Liens et tracabilite
        - Sous-tache: {jira_key}
        - Parent: {parent_key}
        - Epic: {epic_key}
        - PR: {pr_line}
        """
    ).strip()


def main() -> None:
    args = parse_args()
    print(build_description(args))


if __name__ == "__main__":
    main()
