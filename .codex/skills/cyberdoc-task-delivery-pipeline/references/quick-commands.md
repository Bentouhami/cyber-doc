# Delivery Pipeline - Quick Commands

Use this as a fast runbook from kickoff to closure.

## Inputs

PowerShell:

```powershell
$ISSUE="TASK-200"
$MODULE="documents"
$TYPE="feat"
$SLUG="short-task-slug"
$SUMMARY="Short task summary"
```

Bash:

```bash
ISSUE=TASK-200
MODULE=documents
TYPE=feat
SLUG=short-task-slug
SUMMARY="Short task summary"
```

## 1) Generate kickoff skeleton

```bash
python .codex/skills/cyberdoc-task-delivery-pipeline/scripts/generate_task_kickoff.py --jira "$ISSUE" --module "$MODULE" --type "$TYPE" --summary "$SUMMARY"
```

## 2) Generate git command templates

```bash
python .codex/skills/cyberdoc-task-delivery-pipeline/scripts/generate_git_commands.py --jira "$ISSUE" --module "$MODULE" --type "$TYPE" --slug "$SLUG" --commit-summary "$SUMMARY"
```

## 3) Detect overlap before implementation

```bash
python .codex/skills/cyberdoc-task-delivery-pipeline/scripts/detect_task_overlap.py --jira "$ISSUE" --format markdown
```

## 4) Generate PR package

```bash
python .codex/skills/cyberdoc-task-delivery-pipeline/scripts/generate_pr_merge_package.py --jira "$ISSUE" --module "$MODULE" --type "$TYPE" --summary "$SUMMARY"
```

## 5) Run project quality checks

```bash
npm run lint
npm run typecheck
npm test
```

If your project uses different commands, replace with equivalent CI-parity checks.

## 6) Optional Jira integration

If Jira is used in this project, use legacy tools only on demand:
- `skills-legacy/asdho/atlassian-acli-jira`
- `scripts/generate_jira_transition_commands.py`
- `scripts/run_task_pipeline.ps1`

## 7) Task Done Recap template

```text
Need:
Issue:
Goal:
Solution:
Important:
Priority: P1|P2|P3
```
