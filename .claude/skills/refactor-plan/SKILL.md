---
name: refactor-plan
description: Analyze a GitHub issue or file path and produce a phased refactoring plan. Outputs a TODO list only — does not make code changes.
disable-model-invocation: true
argument-hint: '[issue-number | file-path]'
---

Produce a refactoring plan for: $ARGUMENTS

1. **Gather context** — number: `gh issue view $ARGUMENTS --comments` (if `gh` unavailable, fetch the issue via WebFetch); path: read source files under that path
2. **Investigate** — read relevant source files; apply the checklist in [instructions.md](instructions.md)
3. **Plan** — group findings into phases (lowest → highest risk); each phase is a `- [ ]` checklist; note inter-phase dependencies
4. **Stop — output the plan only. Do not implement any changes.**
