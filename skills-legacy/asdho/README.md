# ASDHO Legacy Skill Archive

This folder stores skills imported from ASDHO-CONNECT that are not compatible with CyberDoc's current stack.

## Archived now

- `asdhoconnect-api-platform-resource-builder`
- `asdhoconnect-doctrine-uml-from-entities`
- `atlassian-acli-jira`

## Why archived

- CyberDoc uses Next.js as fullstack runtime.
- These skills depend on Symfony API Platform and Doctrine entities.

## Replacement strategy

- Keep reusable logic in project-neutral skills.
- Rebuild stack-specific workflows for Next.js route handlers, Zod, and Prisma.
- Promote adapted replacements only after validation in real tasks.

## Optional org-specific legacy

- `atlassian-acli-jira` can be restored from this archive if Jira is re-enabled in the project workflow.
