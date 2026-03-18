param(
  [Parameter(Mandatory = $true)]
  [string]$Jira,
  [string]$Module = "orders",
  [string]$Type = "feat",
  [string]$Summary = "",
  [string]$Parent = "",
  [string]$Epic = "",
  [switch]$NoJiraFetch,
  [switch]$NoGh,
  [switch]$NoJiraRefs,
  [switch]$AllowBlockedStart,
  [switch]$NoAutoJiraStatusSync
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Run-Cmd {
  param(
    [Parameter(Mandatory = $true)][string[]]$Command,
    [switch]$AllowFailure
  )

  try {
    $exe = $Command[0]
    $args = @()
    if ($Command.Length -gt 1) {
      $args = $Command[1..($Command.Length - 1)]
    }

    $output = & $exe @args 2>&1
    $exitCode = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }
    $ok = ($exitCode -eq 0)

    if (-not $ok -and -not $AllowFailure) {
      throw "Command failed with exit code ${exitCode}: $($Command -join ' ')"
    }

    return @{
      ok = $ok
      output = ($output -join "`n")
      code = $exitCode
    }
  }
  catch {
    if ($AllowFailure) {
      $msg = $_.Exception.Message
      return @{
        ok = $false
        output = $msg
        code = 1
      }
    }
    throw
  }
}

function Ensure-Dir {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function ConvertFrom-JsonSafe {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $null
  }

  try {
    return ($Text | ConvertFrom-Json -Depth 50)
  }
  catch {
    return $null
  }
}

function Get-IssueTypeName {
  param($IssueJson)
  return ($IssueJson.fields.issuetype.name)
}

function Get-IssueStatusName {
  param($IssueJson)
  return ($IssueJson.fields.status.name)
}

function Get-IssueSummary {
  param($IssueJson)
  return ($IssueJson.fields.summary)
}

function Get-IssuePriority {
  param($IssueJson)
  return ($IssueJson.fields.priority.name)
}

function Get-IssueStartDate {
  param($IssueJson)
  return ($IssueJson.fields.customfield_10015)
}

function Get-IssueDueDate {
  param($IssueJson)
  return ($IssueJson.fields.duedate)
}

function Get-IssueStoryPoints {
  param($IssueJson)
  return ($IssueJson.fields.customfield_10016)
}

function Get-IssueSprintNames {
  param($IssueJson)
  $sprints = $IssueJson.fields.customfield_10020
  if (-not $sprints) {
    return @()
  }

  $names = @()
  foreach ($s in $sprints) {
    if ($s.name) {
      $names += [string]$s.name
    }
  }
  return $names
}

function Get-JiraIssue {
  param([Parameter(Mandatory = $true)][string]$Key)

  $result = Run-Cmd -AllowFailure -Command @(
    ".\acli.exe", "jira", "workitem", "view", $Key,
    "--fields", "*all",
    "--json"
  )

  $json = ConvertFrom-JsonSafe -Text $result.output
  return @{
    ok = $result.ok
    raw = $result.output
    json = $json
  }
}

function Get-JiraChildren {
  param([Parameter(Mandatory = $true)][string]$ParentKey)

  $search = Run-Cmd -AllowFailure -Command @(
    ".\acli.exe", "jira", "workitem", "search",
    "--jql", "parent = $ParentKey ORDER BY Rank ASC",
    "--fields", "key",
    "--limit", "200",
    "--json"
  )

  if (-not $search.ok) {
    return @()
  }

  $json = ConvertFrom-JsonSafe -Text $search.output
  if (-not $json) {
    return @()
  }

  $keys = @()
  foreach ($issue in $json) {
    if ($issue.key) {
      $keys += [string]$issue.key
    }
  }
  return $keys
}

function Get-IssueGraph {
  param(
    [Parameter(Mandatory = $true)][string]$RootKey,
    [int]$MaxDepth = 6
  )

  $nodes = @{}
  $queue = [System.Collections.Queue]::new()
  $queue.Enqueue(@{ key = $RootKey; depth = 0 })

  while ($queue.Count -gt 0) {
    $item = $queue.Dequeue()
    $key = [string]$item.key
    $depth = [int]$item.depth
    if ($nodes.ContainsKey($key)) {
      continue
    }

    $issue = Get-JiraIssue -Key $key
    if (-not $issue.ok -or -not $issue.json) {
      $nodes[$key] = @{
        key = $key
        fetchOk = $false
        children = @()
      }
      continue
    }

    $json = $issue.json
    $children = @()
    if ($depth -lt $MaxDepth) {
      $children = Get-JiraChildren -ParentKey $key
    }

    $nodes[$key] = @{
      key = $key
      fetchOk = $true
      json = $json
      children = $children
      depth = $depth
    }

    foreach ($childKey in $children) {
      if (-not $nodes.ContainsKey($childKey)) {
        $queue.Enqueue(@{ key = $childKey; depth = ($depth + 1) })
      }
    }
  }

  return $nodes
}

function Get-ParentChain {
  param([Parameter(Mandatory = $true)]$IssueJson)

  $chain = @()
  $cursor = $IssueJson
  $safety = 0

  while (
    $cursor -and
    $cursor.fields -and
    ($cursor.fields.PSObject.Properties.Name -contains 'parent') -and
    $cursor.fields.parent -and
    $safety -lt 8
  ) {
    $parentKey = [string]$cursor.fields.parent.key
    if ([string]::IsNullOrWhiteSpace($parentKey)) {
      break
    }
    $chain += $parentKey
    $parentIssue = Get-JiraIssue -Key $parentKey
    if (-not $parentIssue.ok -or -not $parentIssue.json) {
      break
    }
    $cursor = $parentIssue.json
    $safety += 1
  }

  return @($chain)
}

function Get-BlockingInwardIssues {
  param([Parameter(Mandatory = $true)]$IssueJson)

  $blockedBy = @()
  $links = $IssueJson.fields.issuelinks
  if (-not $links) {
    return $blockedBy
  }

  foreach ($link in $links) {
    if (
      -not ($link.PSObject.Properties.Name -contains 'inwardIssue') -or
      -not $link.inwardIssue
    ) {
      continue
    }

    $relation = ""
    if (
      ($link.PSObject.Properties.Name -contains 'type') -and
      $link.type -and
      ($link.type.PSObject.Properties.Name -contains 'inward')
    ) {
      $relation = [string]$link.type.inward
    }
    if ($relation -ne "is blocked by") {
      continue
    }

    $blockedBy += @{
      key = [string]$link.inwardIssue.key
      status = [string]$link.inwardIssue.fields.status.name
      summary = [string]$link.inwardIssue.fields.summary
    }
  }

  return $blockedBy
}

function Get-BlockerDetails {
  param(
    [Parameter(Mandatory = $true)]$BlockedByEntries
  )

  $details = @()
  $seen = @{}

  foreach ($entry in $BlockedByEntries) {
    $key = [string]$entry.blockedByKey
    if ([string]::IsNullOrWhiteSpace($key) -or $seen.ContainsKey($key)) {
      continue
    }
    $seen[$key] = $true

    $issue = Get-JiraIssue -Key $key
    if (-not $issue.ok -or -not $issue.json) {
      $details += @{
        key = $key
        fetchOk = $false
      }
      continue
    }

    $ij = $issue.json
    $children = @(Get-JiraChildren -ParentKey $key)
    $details += @{
      key = [string]$ij.key
      fetchOk = $true
      type = [string](Get-IssueTypeName -IssueJson $ij)
      status = [string](Get-IssueStatusName -IssueJson $ij)
      summary = [string](Get-IssueSummary -IssueJson $ij)
      priority = [string](Get-IssuePriority -IssueJson $ij)
      startDate = Get-IssueStartDate -IssueJson $ij
      dueDate = Get-IssueDueDate -IssueJson $ij
      storyPoints = Get-IssueStoryPoints -IssueJson $ij
      sprint = @(Get-IssueSprintNames -IssueJson $ij)
      labels = @($ij.fields.labels)
      parentChain = @(Get-ParentChain -IssueJson $ij)
      children = $children
      childrenCount = @($children).Count
    }
  }

  return @($details | Sort-Object key)
}

function Get-ProposedActions {
  param(
    [Parameter(Mandatory = $true)]$DependencyGate,
    [Parameter(Mandatory = $true)]$BlockerDetails
  )

  $actions = @()

  if ($DependencyGate.ready) {
    $actions += "No open blockers detected. You can continue with git start gate (checkout/pull/branch)."
    return @($actions)
  }

  $actions += "Stop current task execution until blockers are resolved."

  foreach ($b in $BlockerDetails) {
    if (-not $b.fetchOk) {
      $actions += "Blocker $($b.key): fetch failed. Open ticket manually and resolve status before continuing."
      continue
    }

    if ($b.status -eq "Backlog") {
      $actions += "Blocker $($b.key): move status from Backlog to In Progress and prioritize delivery."
    }
    elseif ($b.status -ne "Done") {
      $actions += "Blocker $($b.key): complete implementation and move to Done."
    }

    if ([string]::IsNullOrWhiteSpace([string]$b.dueDate)) {
      $actions += "Blocker $($b.key): set a due date to improve sequencing visibility."
    }

    if ($null -eq $b.storyPoints) {
      $actions += "Blocker $($b.key): set story points for planning consistency."
    }

    if (@($b.children).Count -eq 0 -and $b.type -eq "Task") {
      $actions += "Blocker $($b.key): consider adding subtasks if scope is broad."
    }
  }

  return @($actions)
}

function Get-SuggestedJiraCommands {
  param(
    [Parameter(Mandatory = $true)][string]$RootKey,
    [Parameter(Mandatory = $true)]$DependencyGate,
    [Parameter(Mandatory = $true)]$BlockerDetails
  )

  $commands = @()

  if ($DependencyGate.ready) {
    $commands += @{
      purpose = "Re-run strict preflight before git start"
      command = ".\scripts\jira-preflight.ps1 -JiraKey $RootKey -FailOnOpenBlockers -SandboxAware"
    }
    return @($commands)
  }

  foreach ($b in $BlockerDetails) {
    if (-not $b.fetchOk) {
      $commands += @{
        purpose = "Open blocker manually (fetch failed in pipeline)"
        command = ".\acli.exe jira workitem view $($b.key) --web"
      }
      continue
    }

    $commands += @{
      purpose = "Inspect blocker planning and status fields"
      command = ".\acli.exe jira workitem view $($b.key) --fields key,summary,status,parent,issuetype,priority,customfield_10015,duedate,customfield_10016,customfield_10020,labels,subtasks,issuelinks --json"
    }

    if ([string]$b.status -eq "Backlog") {
      $commands += @{
        purpose = "Move blocker to In Progress"
        command = ".\acli.exe jira workitem transition --key `"$($b.key)`" --status `"In Progress`" --yes"
      }
    }

    if ($null -eq $b.storyPoints -or [string]::IsNullOrWhiteSpace([string]$b.dueDate)) {
      $commands += @{
        purpose = "Open blocker in Jira UI to set Due date and Story points"
        command = ".\acli.exe jira workitem view $($b.key) --web"
      }
    }

    if (@($b.children).Count -eq 0 -and [string]$b.type -eq "Task") {
      $commands += @{
        purpose = "Create first subtask template under blocker"
        command = ".\acli.exe jira workitem create --project `"ACA`" --type `"Sub-task`" --parent `"$($b.key)`" --summary `"[Split] <subtask summary>`""
      }
    }
  }

  $commands += @{
    purpose = "Re-run strict preflight on current task after blocker updates"
    command = ".\scripts\jira-preflight.ps1 -JiraKey $RootKey -FailOnOpenBlockers -SandboxAware"
  }

  return @($commands)
}

function Invoke-JiraTransition {
  param(
    [Parameter(Mandatory = $true)][string]$Key,
    [Parameter(Mandatory = $true)][string]$Status
  )

  $res = Run-Cmd -AllowFailure -Command @(
    ".\acli.exe", "jira", "workitem", "transition",
    "--key", $Key,
    "--status", $Status,
    "--yes",
    "--json"
  )

  $payload = ConvertFrom-JsonSafe -Text $res.output
  $ok = $false
  if ($payload -and $payload.successCount) {
    $ok = ([int]$payload.successCount -gt 0)
  }

  return @{
    attempted = $true
    ok = $ok
    targetStatus = $Status
    raw = $res.output
  }
}

function Get-MergeEvidenceFromGit {
  param([Parameter(Mandatory = $true)][string]$Key)

  $needle = [string]$Key
  $mergeLog = Run-Cmd -AllowFailure -Command @("git", "log", "origin/dev", "--merges", "--oneline", "-n", "300")
  $commitLog = Run-Cmd -AllowFailure -Command @("git", "log", "origin/dev", "--oneline", "-n", "600")

  $mergeLines = @()
  $commitLines = @()
  if ($mergeLog.ok -and -not [string]::IsNullOrWhiteSpace([string]$mergeLog.output)) {
    $mergeLines = @([string]$mergeLog.output -split "`n")
  }
  if ($commitLog.ok -and -not [string]::IsNullOrWhiteSpace([string]$commitLog.output)) {
    $commitLines = @([string]$commitLog.output -split "`n")
  }

  $mergeHits = @($mergeLines | Where-Object { $_ -match [regex]::Escape($needle) })
  $commitHits = @($commitLines | Where-Object { $_ -match [regex]::Escape($needle) })

  return @{
    hasEvidence = (@($mergeHits).Count -gt 0 -or @($commitHits).Count -gt 0)
    mergeHits = @($mergeHits | Select-Object -First 10)
    commitHits = @($commitHits | Select-Object -First 10)
    mergeLogOk = $mergeLog.ok
    commitLogOk = $commitLog.ok
  }
}

$jiraKey = $Jira.ToUpper()
$skillRoot = ".codex/skills/cyberdoc-task-delivery-pipeline"
$scriptRoot = Join-Path $skillRoot "scripts"
$outDir = ".tmp/pipeline"
Ensure-Dir -Path $outDir

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportPath = Join-Path $outDir "$jiraKey-report-$timestamp.md"
$statePath = Join-Path $outDir "$jiraKey-state-$timestamp.json"

$jiraSnapshot = @{
  ok = $false
  output = "Jira fetch skipped."
}
$jiraIssueJson = $null

if (-not $NoJiraFetch) {
  $jiraSnapshot = Run-Cmd -AllowFailure -Command @(
    ".\acli.exe", "jira", "workitem", "view", $jiraKey,
    "--fields", "*all",
    "--json"
  )
  $jiraIssueJson = ConvertFrom-JsonSafe -Text $jiraSnapshot.output
}

$scopeTree = @{
  rootKey = $jiraKey
  rootType = "<unknown>"
  rootStatus = "<unknown>"
  rootSummary = "<unknown>"
  parentChain = @()
  hasEpicAncestor = $false
  descendants = @()
}

$dependencyGate = @{
  ready = $false
  evaluated = $false
  reason = "jira-dependency-unverified"
  blockedBy = @()
  fetchFailures = @()
}
$blockerDetails = @()
$proposedActions = @()
$statusSync = @{
  enabled = (-not $NoAutoJiraStatusSync)
  startTransition = @{
    attempted = $false
    skipped = $true
    reason = "not-evaluated"
    ok = $false
    raw = ""
  }
  doneTransition = @{
    attempted = $false
    skipped = $true
    reason = "not-evaluated"
    ok = $false
    raw = ""
  }
  mergeEvidence = @{
    hasEvidence = $false
    mergeHits = @()
    commitHits = @()
    mergeLogOk = $false
    commitLogOk = $false
  }
}

if ($NoJiraFetch) {
  $dependencyGate.reason = "jira-fetch-skipped"
}
elseif (-not $jiraSnapshot.ok) {
  $dependencyGate.reason = "jira-fetch-failed"
}
elseif (-not $jiraIssueJson) {
  $dependencyGate.reason = "jira-json-parse-failed"
}

if ($jiraIssueJson) {
  $scopeTree.rootType = [string](Get-IssueTypeName -IssueJson $jiraIssueJson)
  $scopeTree.rootStatus = [string](Get-IssueStatusName -IssueJson $jiraIssueJson)
  $scopeTree.rootSummary = [string](Get-IssueSummary -IssueJson $jiraIssueJson)
  $scopeTree.parentChain = Get-ParentChain -IssueJson $jiraIssueJson
  $scopeTree.hasEpicAncestor = ($scopeTree.parentChain | Where-Object { $_ -match "^ACA-" } | Measure-Object).Count -gt 0

  $dependencyCandidates = @{}
  $dependencyEvaluationFailed = $false
  $graph = Get-IssueGraph -RootKey $jiraKey -MaxDepth 6
  $desc = @()
  foreach ($kv in $graph.GetEnumerator()) {
    $node = $kv.Value
    if (-not $node.fetchOk) {
      $dependencyEvaluationFailed = $true
      $dependencyGate.fetchFailures += [string]$node.key
      $desc += @{
        key = $node.key
        fetchOk = $false
        type = "<unknown>"
        status = "<unknown>"
        summary = "<unknown>"
        priority = "<unknown>"
        startDate = $null
        dueDate = $null
        storyPoints = $null
        sprint = @()
        labels = @()
        children = $node.children
      }
      continue
    }

    $ij = $node.json
    $dependencyCandidates[[string]$ij.key] = $ij
    $desc += @{
      key = [string]$ij.key
      fetchOk = $true
      type = [string](Get-IssueTypeName -IssueJson $ij)
      status = [string](Get-IssueStatusName -IssueJson $ij)
      summary = [string](Get-IssueSummary -IssueJson $ij)
      priority = [string](Get-IssuePriority -IssueJson $ij)
      startDate = Get-IssueStartDate -IssueJson $ij
      dueDate = Get-IssueDueDate -IssueJson $ij
      storyPoints = Get-IssueStoryPoints -IssueJson $ij
      sprint = @(Get-IssueSprintNames -IssueJson $ij)
      labels = @($ij.fields.labels)
      children = $node.children
    }
  }

  foreach ($parentKey in @($scopeTree.parentChain)) {
    if ([string]::IsNullOrWhiteSpace([string]$parentKey)) {
      continue
    }
    if ($dependencyCandidates.ContainsKey([string]$parentKey)) {
      continue
    }

    $parentIssue = Get-JiraIssue -Key ([string]$parentKey)
    if ($parentIssue.ok -and $parentIssue.json) {
      $dependencyCandidates[[string]$parentIssue.json.key] = $parentIssue.json
    }
    else {
      $dependencyEvaluationFailed = $true
      $dependencyGate.fetchFailures += [string]$parentKey
    }
  }

  foreach ($candidate in $dependencyCandidates.GetEnumerator()) {
    $ij = $candidate.Value
    $blockedBy = Get-BlockingInwardIssues -IssueJson $ij
    foreach ($b in $blockedBy) {
      if ($b.status -eq "Done") {
        continue
      }
      $dependencyGate.blockedBy += @{
        issue = [string]$ij.key
        issueSummary = [string]$ij.fields.summary
        blockedByKey = [string]$b.key
        blockedByStatus = [string]$b.status
        blockedBySummary = [string]$b.summary
      }
    }
  }

  $dependencyGate.evaluated = $true
  $dependencyGate.fetchFailures = @($dependencyGate.fetchFailures | Sort-Object -Unique)

  if ($dependencyEvaluationFailed) {
    $dependencyGate.ready = $false
    $dependencyGate.reason = "dependency-evaluation-incomplete"
  }
  elseif (@($dependencyGate.blockedBy).Count -gt 0) {
    $dependencyGate.ready = $false
    $dependencyGate.reason = "blocked-by-open-dependency"
  }
  else {
    $dependencyGate.ready = $true
    $dependencyGate.reason = "ready"
  }
  $scopeTree.descendants = $desc | Sort-Object key
}
$scopeTree.descendants = @($scopeTree.descendants)
$scopeTree.parentChain = @($scopeTree.parentChain)

$blockerDetails = @(Get-BlockerDetails -BlockedByEntries @($dependencyGate.blockedBy))
$proposedActions = @(Get-ProposedActions -DependencyGate $dependencyGate -BlockerDetails $blockerDetails)
$suggestedJiraCommands = @(Get-SuggestedJiraCommands -RootKey $jiraKey -DependencyGate $dependencyGate -BlockerDetails $blockerDetails)

if ($statusSync.enabled -and $jiraIssueJson) {
  $currentStatus = [string]$scopeTree.rootStatus
  if (-not $dependencyGate.ready) {
    $statusSync.startTransition.reason = "dependency-gate-not-ready"
  }
  elseif ($currentStatus -eq "Done") {
    $statusSync.startTransition.reason = "already-done"
  }
  elseif ($currentStatus -eq "In Progress") {
    $statusSync.startTransition.reason = "already-in-progress"
  }
  else {
    $statusSync.startTransition.skipped = $false
    $statusSync.startTransition = Invoke-JiraTransition -Key $jiraKey -Status "In Progress"
    if ($statusSync.startTransition.ok) {
      $scopeTree.rootStatus = "In Progress"
    }
  }

  $statusSync.mergeEvidence = Get-MergeEvidenceFromGit -Key $jiraKey
  if ([string]$scopeTree.rootStatus -eq "Done") {
    $statusSync.doneTransition.reason = "already-done"
  }
  elseif (-not $statusSync.mergeEvidence.hasEvidence) {
    $statusSync.doneTransition.reason = "no-merge-evidence-in-origin-dev"
  }
  else {
    $statusSync.doneTransition.skipped = $false
    $statusSync.doneTransition = Invoke-JiraTransition -Key $jiraKey -Status "Done"
    if ($statusSync.doneTransition.ok) {
      $scopeTree.rootStatus = "Done"
    }
  }
}

$overlapCmd = @(
  "python",
  (Join-Path $scriptRoot "detect_task_overlap.py"),
  "--jira", $jiraKey,
  "--format", "json"
)
if ($NoGh) {
  $overlapCmd += "--no-gh"
}
$overlapResultRaw = Run-Cmd -AllowFailure -Command $overlapCmd

$overlap = $null
if ($overlapResultRaw.ok) {
  try {
    $overlap = $overlapResultRaw.output | ConvertFrom-Json
  }
  catch {
    $overlap = $null
  }
}

$classification = if ($overlap) { $overlap.classification } else { "unknown" }
$decision = if (-not $dependencyGate.ready -and -not $AllowBlockedStart) {
  "STOP: Task is blocked by open dependency. Resolve blockers first."
}
else {
  switch ($classification) {
    "implemented" { "Switch to validation/closure flow; avoid re-implementation." }
    "partial" { "Implement only missing scope with regression-first plan." }
    "missing" { "Proceed with full implementation plan." }
    default { "Manual decision required: overlap detector unavailable." }
  }
}

$summaryText = if ($Summary) { $Summary } else { "<to-fill>" }
$parentText = if ($Parent) { $Parent } else { "<to-fill-if-subtask>" }
$epicText = if ($Epic) { $Epic } else { "<to-fill-if-known>" }
$jiraRefsFlag = if ($NoJiraRefs) { "--no-jira-refs" } else { "" }
$parentChainText = "<none>"
if ($scopeTree.parentChain) {
  $parentChainText = (@($scopeTree.parentChain) -join " -> ")
}

$report = @"
# Task Pipeline Report - $jiraKey

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
Module: $Module
Type: $Type
Summary: $summaryText

## 0) Workspace Hygiene
- Branch: $(git branch --show-current)
- Status:
$(git status -sb)

## 1) Jira Snapshot
- Fetch status: $(if ($jiraSnapshot.ok) { "ok" } else { "failed/skipped" })
```json
$($jiraSnapshot.output)
```

## 1.1) Scope Tree (Hierarchy + Planning fields)
- Root: $($scopeTree.rootKey) [$($scopeTree.rootType)] - $($scopeTree.rootStatus)
- Parent chain: $parentChainText
- Epic ancestor detected: $($scopeTree.hasEpicAncestor)
```json
$($scopeTree | ConvertTo-Json -Depth 10)
```

## 1.2) Dependency Gate (before any git/branch step)
- Ready: $($dependencyGate.ready)
- Reason: $($dependencyGate.reason)
```json
$($dependencyGate | ConvertTo-Json -Depth 10)
```

## 1.6) Jira Status Sync
- Enabled: $($statusSync.enabled)
```json
$($statusSync | ConvertTo-Json -Depth 10)
```

## 1.3) Blocking Tasks Detailed Snapshot
```json
$($blockerDetails | ConvertTo-Json -Depth 10)
```

## 1.4) Propositions
$(($proposedActions | ForEach-Object { "- $_" }) -join "`n")

## 1.5) Commandes Jira suggerees
$(if (@($suggestedJiraCommands).Count -gt 0) {
  (($suggestedJiraCommands | ForEach-Object {
    "- $($_.purpose)`n  `"$($_.command)`""
  }) -join "`n")
} else {
  "- Aucune commande Jira suggeree."
})

## 2) Overlap Check (codebase + commits + PRs)
- Classification: $classification
- Confidence: $(if ($overlap) { $overlap.confidence } else { "<unknown>" })
- Rationale: $(if ($overlap) { $overlap.rationale } else { "detector unavailable" })
```json
$($overlapResultRaw.output)
```

## 3) Decision
- $decision

## 4) Implementation Plan (Template)
1. Confirm acceptance criteria and module boundaries.
2. Implement minimal behavior changes.
3. Add/adjust tests (unit + integration/regression).
4. Apply hardening pass (validation/auth/contracts/side effects).
5. Update docs and operational notes.

## 5) Validation Gates (Alias-first)
- Backend: `beanalyse`, `beverify`, `btest`
- Targeted backend test: `bein php bin/phpunit <path>`
- Frontend: `felint`, `fetype`, `feverify`

## 5.1) Git Start Gate
- Run only if dependency gate is ready:
  - `git checkout dev`
  - `git pull origin dev`
  - then branch/create flow for current Jira key

## 5.2) Glossary
- Baseline: minimum agreed foundation before continuing execution.
- DoD (Definition of Done): checklist required for a task to be considered complete.
- QA (Quality Assurance): validation activities that confirm quality and reduce defects.
- Hardening: reinforcement of reliability, safety, and robustness without changing core functional scope.
- Gate: blocking control point; if the gate fails, execution must stop.
- Fail-closed: secure default mode where missing/unavailable validation keeps the gate blocked.
- Blocker: dependency that must be completed before the current task can proceed.
- Preflight: prerequisite validation run before implementation starts.
- Regression: previously working behavior that breaks after a change.

## 6) Docs Scaffold Commands
```bash
python $scriptRoot/generate_task_kickoff.py --jira $jiraKey --module $Module --type $Type --summary "$summaryText" --parent "$parentText" --epic "$epicText"
python $scriptRoot/generate_jira_description.py --jira $jiraKey --module $Module --type $Type --summary "$summaryText" --parent "$parentText" --epic "$epicText"
```

## 7) PR Package Command
```bash
python $scriptRoot/generate_pr_merge_package.py --jira $jiraKey --module $Module --type $Type --summary "$summaryText" --parent "$parentText" --epic "$epicText" $jiraRefsFlag
```

## 8) Recap
- Pipeline report generated.
- Use this file as execution checkpoint and merge evidence draft.
"@

$state = @{
  jira = $jiraKey
  module = $Module
  type = $Type
  summary = $summaryText
  parent = $Parent
  epic = $Epic
  generatedAt = (Get-Date -Format "o")
  classification = $classification
  decision = $decision
  dependencyGate = $dependencyGate
  blockerDetails = $blockerDetails
  proposedActions = $proposedActions
  suggestedJiraCommands = $suggestedJiraCommands
  scopeTree = $scopeTree
  statusSync = $statusSync
  files = @{
    report = $reportPath
    state = $statePath
  }
}

$report | Set-Content -Path $reportPath -Encoding UTF8
($state | ConvertTo-Json -Depth 8) | Set-Content -Path $statePath -Encoding UTF8

Write-Host "[OK] Report: $reportPath"
Write-Host "[OK] State : $statePath"
