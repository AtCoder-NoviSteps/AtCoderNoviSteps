---
name: refactor-plan
description: Analyze a GitHub issue or file path and produce a phased refactoring plan. Outputs a TODO list only — does not make code changes.
disable-model-invocation: true
argument-hint: '[issue-number | file-path]'
---

Produce a refactoring plan for: $ARGUMENTS

1. **Gather context**
   - If the argument is a number: run `gh issue view $ARGUMENTS` to read the issue title, body, and comments
   - If the argument is a path: read the source files under that path

2. **Investigate**
   - Read the relevant source files
   - Apply the investigation checklist in [instructions.md](instructions.md) to identify problems

3. **Plan**
   - Group findings into phases ordered from lowest to highest risk
   - Each phase must list specific, actionable tasks as a `- [ ]` checklist
   - Note inter-phase dependencies explicitly

4. **Stop — output the plan only. Do not implement any changes.**
