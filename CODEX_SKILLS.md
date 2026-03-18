# Codex Skills

This project stores local Codex Skills under `.codex/skills` at the workspace root.
Classification and migration state are tracked in `skills-manifest.json`.
Archived legacy skills are stored in `skills-legacy/asdho`.
Jira-specific legacy tooling (including `atlassian-acli-jira`) is archived there.

## How to use

- Run `/skills` to list available skills in this workspace.
- Use `$skill-installer` to install curated skills or skills from a GitHub repo.
- Ask for tasks that match a skill's triggers, and Codex will select it implicitly.

## Sample interactive session

```text
User: /skills
Codex: nextjs-setup, nextjs-code-style, nextjs-test-generation, nextjs-security-check

User: Initialize a Next.js 16 project with TypeScript, ESLint, Prettier, TailwindCSS
Codex: Using nextjs-setup. Creating the scaffold now...
```

## Created files

- .codex/skills/nextjs-setup/SKILL.md
- .codex/skills/nextjs-code-style/SKILL.md
- .codex/skills/nextjs-test-generation/SKILL.md
- .codex/skills/nextjs-test-generation/scripts/generate-tests.mjs
- .codex/skills/nextjs-security-check/SKILL.md
- CODEX_SKILLS.md
