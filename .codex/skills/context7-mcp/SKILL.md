---
name: context7-mcp
description: Fetch up-to-date library/framework documentation via the Context7 MCP server, including API references, setup guides, real code examples, and migration/deprecation notes. Use when a user asks how to integrate or use a specific library/framework/tool, needs current docs beyond model knowledge, or requests official examples for methods/components/configuration.
---

# Context7 MCP

## Overview

Use Context7 MCP to fetch current, official documentation and examples for libraries, frameworks, and tools directly into Codex before answering.

## Workflow

1. Detect a docs question
   - Triggers include: "How do I integrate/use/configure X", "Show me the API for Y", "Find the setup guide for Z", or anything that needs current library docs.
2. Discover the Context7 MCP server
   - Use the configured server name `context7`.
   - If `list_mcp_resources` does not show it, say Context7 MCP is not available and proceed with best-effort guidance.
3. Find the right doc entry
   - Use `list_mcp_resource_templates` for the Context7 server to see required parameters.
   - Prefer templates that accept a library/framework name and optional version or topic.
4. Fetch documentation
   - Use `read_mcp_resource` with the chosen template URI or resource URI to pull the most relevant docs.
   - If the response is large, focus on the specific topic the user asked about.
5. Answer with grounded guidance
   - Summarize the relevant steps and include concise code examples from the fetched docs.
   - Mention the source library/framework and version (if provided).
   - If docs indicate deprecations or migrations, call that out clearly.

## Output Guidelines

- Be explicit about what you fetched (library/framework + topic).
- Use short, verifiable snippets or bullet steps rather than large excerpts.
- If the docs are ambiguous, ask a brief follow-up question to narrow the target (version, framework, specific component).

## Example Triggers

- "Use Context7 to find the BetterAuth setup guide for Next.js 16"
- "How do I integrate BetterAuth with Next.js 16?"
- "Show me the Prisma client API for `findMany`"
