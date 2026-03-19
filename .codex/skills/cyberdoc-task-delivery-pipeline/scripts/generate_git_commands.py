#!/usr/bin/env python3
"""Generate standardized git command templates for CyberDoc task delivery."""

from __future__ import annotations

import argparse
import re
from textwrap import dedent


ALLOWED_TYPES = {"feat", "fix", "test", "docs", "chore", "refactor"}


def normalize_slug(value: str) -> str:
    slug = value.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug or "task-update"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate git commands for task delivery")
    parser.add_argument("--jira", required=True, help="Issue key, e.g. TASK-192 (or Jira key)")
    parser.add_argument("--module", required=True, help="Target module, e.g. orders")
    parser.add_argument("--type", required=True, help="Task type: feat|fix|test|docs|chore|refactor")
    parser.add_argument("--slug", required=True, help="Short branch slug, e.g. split-order-ux-tests")
    parser.add_argument("--parent", default="", help="Parent issue key, e.g. TASK-162")
    parser.add_argument("--epic", default="", help="Epic/project key, e.g. TASK-110")
    parser.add_argument(
        "--commit-summary",
        default="task delivery update",
        help="Commit summary after conventional prefix",
    )
    return parser.parse_args()


def build_branch_name(task_type: str, module: str, jira: str, slug: str) -> str:
    module_slug = normalize_slug(module)
    jira_slug = normalize_slug(jira)
    short_slug = normalize_slug(slug)
    return f"{task_type}/{module_slug}-module-{jira_slug}-{short_slug}"


def build_output(args: argparse.Namespace) -> str:
    task_type = args.type.strip().lower()
    if task_type not in ALLOWED_TYPES:
        raise ValueError(
            f"Unsupported --type '{args.type}'. Allowed: {', '.join(sorted(ALLOWED_TYPES))}"
        )

    jira_key = args.jira.upper().strip()
    parent_key = args.parent.upper().strip()
    epic_key = args.epic.upper().strip()
    branch = build_branch_name(task_type, args.module, jira_key, args.slug)
    module_slug = normalize_slug(args.module)
    commit_summary = args.commit_summary.strip()
    commit_title = f'{task_type}({module_slug}-module): {commit_summary}'
    commit_refs = [f'-m "Refs {jira_key}"']
    if parent_key:
        commit_refs.append(f'-m "Parent {parent_key}"')
    if epic_key:
        commit_refs.append(f'-m "Epic {epic_key}"')
    commit_refs_text = " ".join(commit_refs)

    return dedent(
        f"""\
        # 1) Sync from dev
        git checkout dev
        git pull

        # 2) Create task branch
        git checkout -b {branch}

        # 3) Stage scoped files (replace placeholders)
        git add <file-1>
        git add <file-2>

        # 4) Commit
        git commit -m "{commit_title}" {commit_refs_text}

        # 5) Push
        git push -u origin {branch}
        """
    )


def main() -> None:
    args = parse_args()
    print(build_output(args))


if __name__ == "__main__":
    main()
