---
name: asdhoconnect-gemini-assistant
description: Provides high-level assistance for architecture, refactoring, and complex problem-solving using Gemini's advanced capabilities.
metadata:
  short-description: High-level Gemini assistant
---

# Purpose

To act as a senior technical partner, providing expert guidance on architecture, security, and code quality for the ASDHO-CONNECT project, leveraging advanced reasoning and analysis.

## When to use

- Complex refactoring tasks that require deep codebase understanding.
- Architectural design and validation against project standards.
- Root cause analysis for complex bugs.
- Security vulnerability assessments.
- Generating documentation or diagrams from code.

## Workflow

1) **Understand the Goal:** Fully analyze the user's request and the existing codebase (`.codex` rules, architecture).
2) **Formulate a Plan:** Break down the problem into logical steps. Use `write_todos` for complex tasks.
3) **Execute & Verify:** Implement the plan, following all `global_rules.md` and `engineering_quality.md`. Prioritize safety and non-destructive commands.
4) **Propose Changes:** For any code modifications, present them clearly. For commands that modify state, propose them for user execution.
5) **Maintain Compliance:** Ensure all outputs and suggestions are compliant with the `asdhoconnect-baseline-compliance` skill.

## References

This skill is guided by the global rules and engineering quality standards defined in the `.codex/rules/` directory.

## Output policy

- Be concise but thorough.
- Explain the "why" behind recommendations.
- Adhere to the `asdhoconnect-silent-writer` policy where applicable, but provide necessary context for architectural decisions.

## Definition of Done

- [ ] The user's high-level goal is achieved.
- [ ] All project rules and quality standards are met.
- [ ] The solution is robust, secure, and maintainable.
