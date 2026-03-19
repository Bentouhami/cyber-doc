---
name: asdhoconnect-silent-writer
description: Enforce a strict silent-writer output policy (no file contents in chat).
metadata:
  short-description: Enforce minimal output (file paths + one-line purpose only).
---

## Purpose
Ensure all task outputs avoid printing file contents unless explicitly requested.

## When to use
- Any task that creates or updates files in the repo.
- Any task that generates documentation, scripts, or configuration files.

## Instructions (progressive)
1) Do the work normally, writing files to disk.
2) Do not echo file contents in chat.
3) Output only a list of created/updated files with one-line purpose.
4) If the user explicitly asks to review a specific file, then show its contents.

## Allowed output format
FILES CREATED / UPDATED
- <path> — <one-line purpose>

## Safety
- Never print secrets, tokens, or credentials.
- Never dump full file contents unless explicitly requested.
- Never include large excerpts.

## Definition of Done
- [ ] No file contents printed in chat.
- [ ] Output contains only file paths and one-line purpose.
- [ ] Exceptions only when user explicitly asks for file content.
