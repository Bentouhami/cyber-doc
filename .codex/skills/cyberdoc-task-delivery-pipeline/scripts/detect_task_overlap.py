#!/usr/bin/env python3
"""Detect overlap between an issue key and existing code/branch/PR evidence."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import asdict, dataclass
from textwrap import dedent


SEARCH_ROOTS = ("app", "components", "lib", "services", "mappers", "types", "prisma", "docs", ".github")


@dataclass
class OverlapResult:
    jira: str
    confidence: int
    classification: str
    rationale: str
    code_hits: list[str]
    dev_commit_hits: list[str]
    merged_commit_hits: list[str]
    gh_pr_hits: list[str]
    warnings: list[str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Detect whether an issue task looks already implemented.")
    parser.add_argument("--jira", required=True, help="Issue key, e.g. TASK-167 (or Jira key)")
    parser.add_argument(
        "--format",
        choices=("markdown", "json"),
        default="markdown",
        help="Output format",
    )
    parser.add_argument(
        "--max-lines",
        type=int,
        default=8,
        help="Max evidence lines per source",
    )
    parser.add_argument(
        "--no-gh",
        action="store_true",
        help="Skip GitHub CLI PR lookup.",
    )
    return parser.parse_args()


def run(cmd: list[str]) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, shell=False)
        return proc.returncode, (proc.stdout or "").strip(), (proc.stderr or "").strip()
    except FileNotFoundError as exc:
        return 127, "", f"Executable not found for command '{cmd[0]}': {exc}"


def collect_lines(cmd: list[str], max_lines: int) -> tuple[list[str], str | None, int]:
    code, out, err = run(cmd)
    if code not in (0, 1):
        return [], f"Command failed ({' '.join(cmd)}): {err or out}", code
    lines = [line for line in out.splitlines() if line.strip()]
    return lines[:max_lines], None, code


def is_unknown_revision_error(message: str) -> bool:
    lowered = message.lower()
    return "unknown revision" in lowered or "bad revision" in lowered


def collect_dev_history_hits(jira: str, max_lines: int) -> tuple[list[str], list[str]]:
    warnings: list[str] = []

    for ref_name in ("dev", "origin/dev"):
        hits, warn, code = collect_lines(
            ["git", "log", ref_name, "--oneline", "--decorate", "--grep", jira],
            max_lines,
        )
        if not warn:
            return hits, warnings

        if code == 127:
            raise RuntimeError(
                "Required evidence command failed for git history. "
                f"Cannot classify overlap safely. Details: {warn}"
            )

        if is_unknown_revision_error(warn):
            warnings.append(f"Git ref '{ref_name}' not available; trying fallback.")
            continue

        raise RuntimeError(
            "Required evidence command failed for git history. "
            f"Cannot classify overlap safely. Details: {warn}"
        )

    warnings.append("Neither 'dev' nor 'origin/dev' is available locally; dev-history evidence skipped.")
    return [], warnings


def classify(
    jira: str,
    code_hits: list[str],
    dev_hits: list[str],
    merged_hits: list[str],
    gh_hits: list[str],
) -> tuple[int, str, str]:
    score = 0
    if dev_hits:
        score += 60
    if merged_hits:
        score += 25
    if gh_hits:
        score += 20
    if code_hits:
        score += min(20, len(code_hits) * 2)

    score = min(100, score)

    if dev_hits or merged_hits:
        return score, "implemented", "Found commit evidence in dev/current history for this issue key."
    if gh_hits or len(code_hits) >= 3:
        return score, "partial", "Found PR/code evidence but no strong merged-dev proof."
    return score, "missing", "No meaningful overlap evidence found."


def render_markdown(result: OverlapResult) -> str:
    def section(title: str, lines: list[str]) -> str:
        if not lines:
            return f"### {title}\n- <none>\n"
        body = "\n".join(f"- {line}" for line in lines)
        return f"### {title}\n{body}\n"

    warnings = "\n".join(f"- {w}" for w in result.warnings) if result.warnings else "- <none>"
    return dedent(
        f"""\
        # Overlap Detection - {result.jira}

        - Classification: **{result.classification}**
        - Confidence: **{result.confidence}/100**
        - Rationale: {result.rationale}

        {section("Codebase Hits", result.code_hits)}
        {section("dev Commit Hits", result.dev_commit_hits)}
        {section("Merged/All Commit Hits", result.merged_commit_hits)}
        {section("GitHub PR Hits", result.gh_pr_hits)}
        ### Warnings
        {warnings}
        """
    ).strip() + "\n"


def main() -> None:
    args = parse_args()
    jira = args.jira.upper()
    warnings: list[str] = []

    code_hits, warn, code = collect_lines(
        ["rg", "-n", jira, *SEARCH_ROOTS, "-g", "!.git", "-g", "!node_modules", "-g", "!vendor"],
        args.max_lines,
    )
    if warn:
        raise RuntimeError(
            "Required evidence command failed for code search (rg). "
            f"Cannot classify overlap safely. Details: {warn}"
        )

    dev_hits, dev_warnings = collect_dev_history_hits(jira, args.max_lines)
    warnings.extend(dev_warnings)

    merged_hits, warn, code = collect_lines(
        ["git", "log", "--all", "--oneline", "--decorate", "--grep", jira],
        args.max_lines,
    )
    if warn:
        raise RuntimeError(
            "Required evidence command failed for git merged history. "
            f"Cannot classify overlap safely. Details: {warn}"
        )

    gh_hits: list[str] = []
    if args.no_gh:
        warnings.append("GitHub PR lookup skipped (--no-gh).")
    else:
        gh_hits, warn, code = collect_lines(
            [
                "gh",
                "pr",
                "list",
                "--state",
                "all",
                "--limit",
                str(args.max_lines),
                "--search",
                jira,
                "--json",
                "number,title,state,url,mergedAt",
                "--jq",
                ".[] | \"#\\(.number) [\\(.state)] \\(.title) :: \\(.url)\"",
            ],
            args.max_lines,
        )
        if code == 127:
            warnings.append("GitHub CLI not found; PR lookup skipped.")
        elif warn:
            warnings.append(warn)

    confidence, classification, rationale = classify(jira, code_hits, dev_hits, merged_hits, gh_hits)
    result = OverlapResult(
        jira=jira,
        confidence=confidence,
        classification=classification,
        rationale=rationale,
        code_hits=code_hits,
        dev_commit_hits=dev_hits,
        merged_commit_hits=merged_hits,
        gh_pr_hits=gh_hits,
        warnings=warnings,
    )

    if args.format == "json":
        print(json.dumps(asdict(result), indent=2))
        return

    print(render_markdown(result))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
