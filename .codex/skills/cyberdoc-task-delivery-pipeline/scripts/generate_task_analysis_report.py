#!/usr/bin/env python3
"""Generate a structured issue subtask implementation analysis report.

This script standardizes the report shape used in CyberDoc task audits:
- Scope confirmation (epic -> parent -> subtasks)
- Per-subtask issue snapshot
- Evidence sections (code/tests/branch-merge)
- Final conclusion matrix

By default it attempts to read Jira data via:
    .\acli.exe jira workitem view <KEY> --fields ... --json
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from typing import Any


JIRA_FIELDS = (
    "key,summary,status,issuetype,parent,description,priority,labels,duedate,startdate,assignee"
)
SEARCH_ROOTS = ("app", "components", "lib", "services", "mappers", "types", "prisma", "docs")
STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "over",
    "under",
    "scan",
    "endpoint",
    "endpoints",
    "add",
    "harden",
    "validate",
    "token",
    "init",
    "confirm",
    "flow",
    "use",
}


@dataclass
class IssueData:
    key: str
    summary: str
    status: str
    due_date: str
    start_date: str
    labels: list[str]
    description: str
    parent_key: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a structured report for epic/parent/subtask analysis."
    )
    parser.add_argument("--epic", required=True, help="Epic key, e.g. ACA-110")
    parser.add_argument("--parent", required=True, help="Parent task key, e.g. ACA-173")
    parser.add_argument(
        "--subtasks",
        nargs="+",
        required=True,
        help="Subtask keys, e.g. ACA-187 ACA-188 ACA-189",
    )
    parser.add_argument(
        "--no-fetch",
        action="store_true",
        help="Do not call issue tracker CLI; generate placeholders only.",
    )
    parser.add_argument(
        "--autofind",
        action="store_true",
        help="Attempt lightweight code-reference hints using rg.",
    )
    parser.add_argument(
        "--acli-path",
        default=".\\acli.exe",
        help="Path to Jira acli binary when Jira is used (default: .\\acli.exe)",
    )
    return parser.parse_args()


def run_command(cmd: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(cmd, capture_output=True, text=True, shell=False)
    return proc.returncode, (proc.stdout or "").strip(), (proc.stderr or "").strip()


def adf_to_text(node: Any) -> str:
    if node is None:
        return ""
    if isinstance(node, dict):
        node_type = node.get("type")
        if node_type == "text":
            return str(node.get("text", ""))
        parts: list[str] = []
        for item in node.get("content", []):
            parts.append(adf_to_text(item))
        text = "".join(parts)
        if node_type == "paragraph" and text:
            return text + "\n"
        return text
    if isinstance(node, list):
        return "".join(adf_to_text(item) for item in node)
    return str(node)


def parse_issue(payload: dict[str, Any], fallback_key: str) -> IssueData:
    fields = payload.get("fields", {})
    key = str(payload.get("key") or fallback_key).upper()
    summary = str(fields.get("summary") or "<missing>")
    status = str(fields.get("status", {}).get("name") or "<missing>")
    due_date = str(fields.get("duedate") or "")
    start_date = str(fields.get("startdate") or "")
    labels = [str(v) for v in (fields.get("labels") or [])]
    parent_key = str(fields.get("parent", {}).get("key") or "")
    desc_text = adf_to_text(fields.get("description")).strip()
    return IssueData(
        key=key,
        summary=summary,
        status=status,
        due_date=due_date,
        start_date=start_date,
        labels=labels,
        description=desc_text or "<missing>",
        parent_key=parent_key,
    )


def fetch_issue(issue_key: str, acli_path: str) -> IssueData:
    cmd = [
        acli_path,
        "jira",
        "workitem",
        "view",
        issue_key,
        "--fields",
        JIRA_FIELDS,
        "--json",
    ]
    code, out, err = run_command(cmd)
    if code != 0:
        raise RuntimeError(
            f"Jira fetch failed for {issue_key}. Command: {' '.join(cmd)}\nstdout: {out}\nstderr: {err}"
        )
    payload = json.loads(out)
    return parse_issue(payload, issue_key)


def placeholder_issue(issue_key: str, parent_key: str) -> IssueData:
    return IssueData(
        key=issue_key.upper(),
        summary="<to-fill>",
        status="<to-fill>",
        due_date="",
        start_date="",
        labels=[],
        description="<to-fill>",
        parent_key=parent_key,
    )


def keywords_from_text(summary: str, description: str) -> list[str]:
    merged = f"{summary} {description}".lower()
    raw = re.findall(r"[a-z0-9_]{4,}", merged)
    cleaned: list[str] = []
    for term in raw:
        if term in STOPWORDS:
            continue
        if term not in cleaned:
            cleaned.append(term)
        if len(cleaned) >= 6:
            break
    return cleaned


def autofind_hints(issue: IssueData) -> list[str]:
    terms = keywords_from_text(issue.summary, issue.description)
    if not terms:
        return []
    pattern = "|".join(re.escape(t) for t in terms[:4])
    cmd = ["rg", "-n", pattern, *SEARCH_ROOTS]
    code, out, _err = run_command(cmd)
    if code not in (0, 1):
        return []
    lines = [line for line in out.splitlines() if line.strip()]
    return lines[:5]


def line_or_unknown(value: str) -> str:
    return value if value else "<not-set>"


def render_report(epic_key: str, parent: IssueData, subtasks: list[IssueData], autofind: bool) -> str:
    lines: list[str] = []
    subkeys = ", ".join(s.key for s in subtasks)
    lines.append(
        f"Correct scope confirmed: {parent.key} (under epic {epic_key}) with subtasks {subkeys}."
    )
    lines.append("")
    lines.append(f"Analysis of the {len(subtasks)} subtasks")
    lines.append("")

    for issue in subtasks:
        labels = ", ".join(issue.labels) if issue.labels else "<none>"
        lines.append(f"{issue.key} - {issue.summary}")
        lines.append(
            f"Jira: {issue.status}, due {line_or_unknown(issue.due_date)}, labels {labels}."
        )
        lines.append(f"Need: {issue.description}")
        lines.append("Code evidence:")
        if autofind:
            hints = autofind_hints(issue)
            if hints:
                for hint in hints:
                    lines.append(f"- Potential: {hint}")
            else:
                lines.append("- [ ] Add verified code references (file:line)")
        else:
            lines.append("- [ ] Add verified code references (file:line)")
        lines.append("Test evidence:")
        lines.append("- [ ] Add verified test references (file:line)")
        lines.append("Branch/merge evidence:")
        lines.append("- [ ] Add branch name(s), commit(s), PR merge(s), and date(s)")
        lines.append("Status:")
        lines.append("- [ ] implemented | partial | missing (set one)")
        lines.append("")

    lines.append("Conclusion")
    lines.append("")
    for issue in subtasks:
        lines.append(f"- {issue.key}: <implemented/partial/missing>.")

    return "\n".join(lines).strip() + "\n"


def main() -> None:
    args = parse_args()

    try:
        parent = (
            placeholder_issue(args.parent, args.epic)
            if args.no_fetch
            else fetch_issue(args.parent, args.acli_path)
        )

        subtasks: list[IssueData] = []
        for key in args.subtasks:
            if args.no_fetch:
                subtasks.append(placeholder_issue(key, args.parent))
            else:
                subtasks.append(fetch_issue(key, args.acli_path))

        print(render_report(args.epic.upper(), parent, subtasks, args.autofind))
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
