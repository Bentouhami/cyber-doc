#!/usr/bin/env python3
"""Generate PR and merge markdown package for CyberDoc task delivery."""

from __future__ import annotations

import argparse
import re
import sys
from textwrap import dedent, indent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate PR + merge markdown package")
    parser.add_argument("--jira", default="", help="Issue key, e.g. TASK-192 (or Jira key)")
    parser.add_argument("--module", required=True, help="Target module, e.g. orders")
    parser.add_argument("--type", required=True, help="Task type: feat|fix|test|docs|chore|refactor")
    parser.add_argument("--summary", required=True, help="Task summary")
    parser.add_argument("--parent", default="", help="Parent issue key, e.g. TASK-162")
    parser.add_argument("--epic", default="", help="Epic/project key, e.g. TASK-110")
    parser.add_argument("--scope", default="", help="Short scope line (optional)")
    parser.add_argument("--validation", default="", help="Validation evidence line (optional)")
    parser.add_argument(
        "--allow-extra-refs",
        action="store_true",
        help="Allow issue keys other than --jira/--parent/--epic in generated content",
    )
    parser.add_argument(
        "--no-jira-refs",
        action="store_true",
        help="Generate PR/merge package without any issue keys (for process/docs/tooling changes)",
    )
    return parser.parse_args()


def build_package(args: argparse.Namespace) -> str:
    jira_key = args.jira.upper().strip()
    parent_key = args.parent.upper().strip()
    epic_key = args.epic.upper().strip()
    if not args.no_jira_refs and not jira_key:
        raise ValueError("--jira is required unless --no-jira-refs is used.")

    pr_title = (
        f"{args.type}({args.module}-module): {args.summary}"
        if args.no_jira_refs
        else f"{args.type}({args.module}-module): {args.summary} ({jira_key})"
    )
    merge_message = f"{args.type}({args.module}-module): {args.summary.lower()}"
    scope_line = args.scope or "Scoped to the issue acceptance criteria only."
    validation_line = args.validation or "Automated + manual checks completed and documented."
    parent_line = f"- Parent: {parent_key}" if parent_key else "- Parent: <to-fill-if-subtask>"
    epic_line = f"- Epic: {epic_key}" if epic_key else "- Epic: <to-fill-if-known>"
    jira_block = (
        "## Jira\n- Intentionally omitted for non-implementation/process PR."
        if args.no_jira_refs
        else f"## Jira\n- Refs {jira_key}\n{parent_line}\n{epic_line}"
    )
    extended_refs_line = (
        ""
        if args.no_jira_refs
        else f"- Refs {jira_key}\n"
    )

    deliver_line = (
        f"- Deliver scoped implementation in {args.module} module"
        if args.no_jira_refs
        else f"- Deliver {jira_key} in {args.module} module with scoped implementation"
    )

    jira_block_indented = indent(jira_block, "        ")

    output = dedent(
        f"""\
        ## PR Title
        ```md
        {pr_title}
        ```

        ## PR Description
        ```md
        ## Summary
        {args.summary}

        ## Scope
        - {scope_line}

        ## Validation
        - {validation_line}

{jira_block_indented}
        ```

        ## Merge Message
        ```md
        {merge_message}
        ```

        ## Extended Merge Message
        ```md
        {deliver_line}
        - Keep architecture and CI standards aligned
        - Update source-of-truth documentation under docs/
        {extended_refs_line.rstrip()}
        ```
        """
    )

    jira_ref_pattern = re.compile(r"\b[A-Z]+-\d+\b", re.IGNORECASE)

    if args.no_jira_refs:
        found_refs = sorted({m.group(0).upper() for m in jira_ref_pattern.finditer(output)})
        if found_refs:
            refs = ", ".join(found_refs)
            raise ValueError(
                "Issue key(s) detected while --no-jira-refs is enabled: "
                f"{refs}. Remove issue keys from summary/scope/validation text."
            )
    elif not args.allow_extra_refs:
        all_refs = {m.group(0).upper() for m in jira_ref_pattern.finditer(output)}
        allowed_refs = {jira_key}
        if parent_key:
            allowed_refs.add(parent_key)
        if epic_key:
            allowed_refs.add(epic_key)
        unexpected = sorted(all_refs - allowed_refs)
        if unexpected:
            allowed = ", ".join(sorted(allowed_refs))
            extras = ", ".join(unexpected)
            raise ValueError(
                "Unexpected issue key(s) detected in PR package: "
                f"{extras}. Allowed: {allowed}. "
                "Avoid issue key ranges and unrelated refs."
            )

    return output


def main() -> None:
    try:
        args = parse_args()
        print(build_package(args))
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
