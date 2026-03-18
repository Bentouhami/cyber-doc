#!/usr/bin/env python3
"""Generate Jira transition proposal commands based on current task state.

Use this only when the project uses Jira + acli.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from textwrap import dedent


WORKFLOW = ["BACKLOG", "SPRINT BACKLOG", "IN PROGRESS", "IN REVIEW", "DONE"]
STEP_TO_TARGET = {
    "sprint-backlog": "SPRINT BACKLOG",
    "in-progress": "IN PROGRESS",
    "in-review": "IN REVIEW",
    "done": "DONE",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Jira transition commands from current issue status and pipeline step."
    )
    parser.add_argument("--jira", required=True, help="Jira key, e.g. ACA-192")
    parser.add_argument(
        "--pipeline-step",
        required=True,
        choices=sorted(STEP_TO_TARGET.keys()),
        help="Current delivery step target in the pipeline",
    )
    parser.add_argument(
        "--view-fields",
        default="key,summary,status,parent,assignee,priority,startdate,duedate",
        help="Fields used by verification view command",
    )
    parser.add_argument(
        "--start-status",
        default="",
        help="Fallback/manual current status when --detect is disabled",
    )
    parser.add_argument(
        "--detect",
        dest="detect",
        action="store_true",
        default=True,
        help="Detect current status from Jira (default)",
    )
    parser.add_argument(
        "--no-detect",
        dest="detect",
        action="store_false",
        help="Disable Jira lookup and use --start-status",
    )
    return parser.parse_args()


def normalize_status(value: str) -> str:
    return " ".join(value.strip().upper().split())


def detect_issue_state(jira_key: str) -> tuple[str, str]:
    cmd = [
        ".\\acli.exe",
        "jira",
        "workitem",
        "view",
        jira_key,
        "--fields",
        "key,summary,status",
        "--json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, shell=False)
    if proc.returncode != 0:
        stderr = (proc.stderr or "").strip()
        stdout = (proc.stdout or "").strip()
        raise RuntimeError(
            "Unable to read Jira issue state via acli.\n"
            f"Command: {' '.join(cmd)}\n"
            f"stdout: {stdout}\n"
            f"stderr: {stderr}"
        )

    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Failed to parse Jira JSON response: {exc}") from exc

    key = (payload.get("key") or jira_key).upper()
    status_name = (
        payload.get("fields", {}).get("status", {}).get("name")
        or payload.get("status", {}).get("name")
        or ""
    )
    if not status_name:
        raise RuntimeError("Jira response did not include issue status.")

    return key, normalize_status(status_name)


def build_proposal(jira_key: str, current_status: str, target_status: str, view_fields: str) -> str:
    lines = [
        "# 0) Verify current issue state",
        f'.\\acli.exe jira workitem view {jira_key} --fields "{view_fields}" --json',
        "",
        f"# Current: {current_status}",
        f"# Target : {target_status}",
    ]

    if current_status not in WORKFLOW:
        lines.extend(
            [
                "",
                "# Current status is outside configured workflow.",
                "# Proposed action: validate workflow mapping in Jira before transitioning.",
            ]
        )
        return dedent("\n".join(lines)).strip() + "\n"

    if target_status not in WORKFLOW:
        lines.extend(
            [
                "",
                "# Target status is invalid for this pipeline script.",
            ]
        )
        return dedent("\n".join(lines)).strip() + "\n"

    current_idx = WORKFLOW.index(current_status)
    target_idx = WORKFLOW.index(target_status)

    if current_idx == target_idx:
        lines.extend(
            [
                "",
                "# No transition required: issue already at target status.",
            ]
        )
        return dedent("\n".join(lines)).strip() + "\n"

    if current_idx > target_idx:
        lines.extend(
            [
                "",
                "# Target step is behind current workflow status.",
                "# Proposed action: keep current status, do not transition backward automatically.",
            ]
        )
        return dedent("\n".join(lines)).strip() + "\n"

    lines.extend(
        [
            "",
            f"# 1) Transition to {target_status}",
            f'.\\acli.exe jira workitem transition --key {jira_key} --status "{target_status}" --json',
            f'.\\acli.exe jira workitem view {jira_key} --fields "{view_fields}" --json',
        ]
    )
    return dedent("\n".join(lines)).strip() + "\n"


def main() -> None:
    args = parse_args()

    target_status = STEP_TO_TARGET[args.pipeline_step]
    jira_key = args.jira.upper()

    try:
        if args.detect:
            jira_key, current_status = detect_issue_state(jira_key)
        else:
            if not args.start_status.strip():
                raise ValueError("--start-status is required when --no-detect is used.")
            current_status = normalize_status(args.start_status)

        print(build_proposal(jira_key, current_status, target_status, args.view_fields))
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
