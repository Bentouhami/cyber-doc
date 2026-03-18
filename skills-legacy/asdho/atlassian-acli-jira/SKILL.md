---
name: atlassian-acli-jira
description: >
  Use this skill whenever an AI agent needs to Create, Read, Update, or Delete
  Jira issues (Epics, Stories, Tasks, Sub-tasks, Bugs) using the official
  Atlassian CLI via local binary invocation (`.\acli.exe jira ...`). Covers dry-run reporting, dedup checks,
  parent/child creation order, JQL search, status transitions, comments, and links.
---

# Atlassian CLI Jira CRUD

Use only official Atlassian CLI syntax.

- Wrong (legacy): `acli jira --action createIssue ...`
- Correct in this repo: `.\acli.exe jira workitem create ...`

## Prerequisites

1. Confirm CLI available:

```bash
.\acli.exe --version
```

2. Confirm auth:

```bash
.\acli.exe jira auth status
```

3. Confirm project access:

```bash
.\acli.exe jira project list --paginate
```

Note: `jira project list` requires one of `--recent`, `--limit`, or `--paginate`.

4. List epics for a project (example: `ACA`):

```bash
.\acli.exe jira workitem search --jql "project = ACA AND issuetype = Epic ORDER BY updated DESC" --fields "key,summary,status,assignee,priority" --paginate
```

5. If not authenticated, login once (browser OAuth):

```bash
.\acli.exe jira auth login --web
```

Auth is normally persisted by Atlassian CLI, so login should not be required on every command.

## Read-only Smoke Tests (Verified)

Use these first when validating environment setup:

```bash
.\acli.exe jira project list --recent
.\acli.exe jira workitem search --jql "project = ACA ORDER BY updated DESC" --fields "issuetype,key,status,summary" --limit 5
.\acli.exe jira workitem view ACA-110 --fields "key,issuetype,status,summary,parent"
```

## Recommended Automation Wrappers

Use these local scripts for consistent execution:

```bash
# 1) Preflight (CLI, auth, project visibility)
.\scripts\jira-preflight.ps1

# Optional: auto-open login if not authenticated
.\scripts\jira-preflight.ps1 -LoginIfNeeded

# Recommended in agent/sandbox contexts: print actionable fallback hints
.\scripts\jira-preflight.ps1 -SandboxAware
.\scripts\jira-preflight.ps1 -SandboxAware -LoginIfNeeded

# 2) Run any Jira subcommand with automatic preflight
.\scripts\jira-run.ps1 workitem search --jql "project = ACA ORDER BY updated DESC" --limit 5
.\scripts\jira-run.ps1 project list --paginate

# Recommended in agent/sandbox contexts
.\scripts\jira-run.ps1 workitem search --jql "project = ACA ORDER BY updated DESC" --limit 5 -SandboxAware
```

### Sandbox-Aware Guidance (Important)

Some agent/sandbox shells cannot access the same OAuth session as your local user terminal.  
Symptoms include:
- `failed to retrieve authenticated status`
- `failed to list projects`

When this happens:
1. Re-run the exact Jira auth/status command outside sandbox restrictions.
2. Keep using `-SandboxAware` wrappers so preflight prints the fallback command automatically.
3. If web auth still fails, use token auth:
   - `.\acli.exe jira auth login --site "<site>.atlassian.net" --email "<email>" --token`

## Canonical Commands

### Read

```bash
.\acli.exe jira workitem view ACA-110
```

### Read Epic Tasks + Subtasks (Template)

Use `parent = <EPIC_KEY>` for tasks/stories under an epic in this Jira setup.

```bash
.\acli.exe jira workitem search --jql "project = <PROJECT_KEY> AND parent = <EPIC_KEY> ORDER BY key ASC" --fields "issuetype,key,summary,status,assignee,priority" --paginate
```

For subtasks under a specific task/story:

```bash
.\acli.exe jira workitem search --jql "parent = <TASK_KEY> ORDER BY key ASC" --fields "issuetype,key,summary,status,assignee,priority" --paginate
```

PowerShell template to fetch and print grouped `Task -> Subtasks` for any epic:

```powershell
$projectKey = "ACA"
$epicKey = "ACA-110"

$children = .\acli.exe jira workitem search --jql "project = $projectKey AND parent = $epicKey ORDER BY key ASC" --fields "issuetype,key,summary,status,assignee,priority" --json | ConvertFrom-Json
foreach ($c in $children) {
  Write-Output ("TASK|{0}|{1}|{2}|{3}" -f $c.key, $c.fields.issuetype.name, $c.fields.status.name, $c.fields.summary)
  $subs = .\acli.exe jira workitem search --jql ("parent = {0} ORDER BY key ASC" -f $c.key) --fields "issuetype,key,summary,status,assignee,priority" --json | ConvertFrom-Json
  foreach ($s in $subs) {
    Write-Output ("SUBTASK|{0}|{1}|{2}|{3}|{4}" -f $c.key, $s.key, $s.fields.issuetype.name, $s.fields.status.name, $s.fields.summary)
  }
}
```

PowerShell one-liner to export grouped `Task/Subtask` rows to CSV:

```powershell
$projectKey="ACA";$epicKey="ACA-110";$out="epic-$epicKey-items.csv";$rows=@();$children=.\acli.exe jira workitem search --jql "project = $projectKey AND parent = $epicKey ORDER BY key ASC" --fields "issuetype,key,summary,status,assignee,priority" --json | ConvertFrom-Json;foreach($c in $children){$rows+=[pscustomobject]@{ParentTaskKey=$c.key;ItemKey=$c.key;ItemType=$c.fields.issuetype.name;Status=$c.fields.status.name;Summary=$c.fields.summary};$subs=.\acli.exe jira workitem search --jql ("parent = {0} ORDER BY key ASC" -f $c.key) --fields "issuetype,key,summary,status,assignee,priority" --json | ConvertFrom-Json;foreach($s in $subs){$rows+=[pscustomobject]@{ParentTaskKey=$c.key;ItemKey=$s.key;ItemType=$s.fields.issuetype.name;Status=$s.fields.status.name;Summary=$s.fields.summary}}};$rows | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $out;Write-Output "Exported $($rows.Count) rows to $out"
```

### Create

```bash
.\acli.exe jira workitem create --project "ACA" --type "Story" --summary "My Story"
.\acli.exe jira workitem create --project "ACA" --type "Sub-task" --parent "ACA-111" --summary "My Sub-task"
```

### Update

```bash
.\acli.exe jira workitem edit --key "ACA-111" --summary "Updated summary"
.\acli.exe jira workitem transition --key "ACA-111" --status "In Progress"
.\acli.exe jira workitem assign --key "ACA-111" --assignee "@me"
.\acli.exe jira workitem comment-create --key "ACA-111" --body "Update note"
```

### Link

```bash
.\acli.exe jira workitem link create --out "ACA-111" --in "ACA-95" --type "Blocks"
```

### Delete (only after explicit user confirmation)

```bash
.\acli.exe jira workitem delete --key "ACA-111" --yes
```

Verified safe cleanup sequence (single duplicate):

```bash
# 1) Pre-check issue exists and inspect parent/summary
.\acli.exe jira workitem view ACA-176 --fields "key,summary,parent,issuetype,status" --json

# 2) Delete explicit key (non-interactive)
.\acli.exe jira workitem delete --key "ACA-176" --yes --json

# 3) Post-check (expect not found / permission error because deleted)
.\acli.exe jira workitem view ACA-176 --fields "key" --json
```

Batch delete multiple known duplicates:

```bash
.\acli.exe jira workitem delete --key "ACA-176,ACA-200,ACA-201" --yes --json
```

## JQL Recipes

- Epic children: `project = ACA AND parent = ACA-110 ORDER BY key ASC`
- Story subtasks: `parent = ACA-111 ORDER BY key ASC`
- High priority open: `project = ACA AND priority in (Highest,High) AND status != Done`
- Label filter: `project = ACA AND labels = multi-qr`

## Execution Workflow (Required)

1. Build dry-run table first (no mutations yet).
2. Run dedup check by summary/JQL.
3. Create parent items first (Epic/Story/Task), capture keys via `--json`.
4. Create subtasks with `--parent <storyKey>`.
5. Apply edits/transitions/assignees/comments.
6. Produce final grouped report (`Story -> Sub-tasks`).

## Dedup Pattern

```bash
.\acli.exe jira workitem search --jql "project = ACA AND summary ~ \"Backend domain hardening\"" --fields "key,summary,status"
```

If a clear match exists, reuse instead of creating duplicate.

### Verified dedup + create templates (ACA)

Use this two-step pattern before every create:

1) Search candidates in project by summary text

```bash
.\acli.exe jira workitem search --jql "project = ACA AND summary ~ \"<SUMMARY>\" ORDER BY updated DESC" --fields "key,summary,description,issuetype,status" --json
```

2) In PowerShell, keep only exact summary matches and compare description text before deciding reuse/create:

```powershell
$summary = "Backend domain hardening for order delivery packages"
$description = "Finalize and secure order_delivery_package model, enforce pk_* naming, package count guards, resplit lock, scan idempotence, and auditability."

$candidates = .\acli.exe jira workitem search --jql "project = ACA AND summary ~ `"$summary`" ORDER BY updated DESC" --fields "key,summary,description,issuetype,status" --json | ConvertFrom-Json
$exact = @($candidates | Where-Object { $_.fields.summary -eq $summary })

if ($exact.Count -gt 0) {
  $issue = .\acli.exe jira workitem view $exact[0].key --fields "summary,description,parent" --json | ConvertFrom-Json
  # Compare normalized description text here; if it matches, reuse issue key.
}
```

Important: summaries containing special characters (example `pk_*`) can bypass naive JQL matching. Always do exact-summary filtering in PowerShell after search results.

Create Story under Epic:

```powershell
$payload = @{
  projectKey = "ACA"
  type = "Story"
  parentIssueId = "ACA-110"
  summary = "My Story"
  description = @{
    type = "doc"; version = 1; content = @(
      @{ type = "paragraph"; content = @(@{ type = "text"; text = "Story description" }) }
    )
  }
  labels = @("orders","backend")
  additionalAttributes = @{
    priority = @{ name = "High" }
    customfield_10016 = 5
  }
}
$tmp = ".\tmp-story.json"
$payload | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 $tmp
.\acli.exe jira workitem create --from-json $tmp --json
```

Create Subtask under parent Story:

```powershell
$payload = @{
  projectKey = "ACA"
  type = "Subtask"
  parentIssueId = "ACA-159"
  summary = "My Subtask"
  description = @{
    type = "doc"; version = 1; content = @(
      @{ type = "paragraph"; content = @(@{ type = "text"; text = "Subtask description" }) }
    )
  }
  labels = @("orders","backend")
  additionalAttributes = @{
    priority = @{ name = "High" }
    customfield_10016 = 2
  }
}
$tmp = ".\tmp-subtask.json"
$payload | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 $tmp
.\acli.exe jira workitem create --from-json $tmp --json
```

## PowerShell Pattern

```powershell
$created = .\acli.exe jira workitem create --project "ACA" --type "Story" --summary "My Story" --json | ConvertFrom-Json
$storyKey = $created.key
.\acli.exe jira workitem create --project "ACA" --type "Sub-task" --parent $storyKey --summary "Child task"
```

## Custom Fields Guidance

Use `--from-json` for advanced fields when possible.
If custom-field handling is blocked/unreliable, use Jira REST API fallback and verify field IDs first via `/rest/api/3/field`.

## Non-Negotiable Rules

1. Always show dry-run plan before create/update/delete.
2. Never delete without explicit confirmation in current conversation.
3. Never auto-duplicate work items.
4. Always capture created keys with `--json`.
5. Use `--paginate` for large search results.
6. Prefer `.\acli.exe jira ...` in this repository environment.
