---
name: add-contest-table-provider
description: Add a new ContestType and ContestTableProvider across 5 layers using TDD. Covers all 3 patterns. Asks targeted questions to gather pattern-specific requirements before touching code.
argument-hint: '<ContestType> <contest_id>'
---

Add a new contest table provider for: $ARGUMENTS

> When in doubt at any step, use AskUserQuestion before proceeding.

0. **Seed check** — grep `prisma/tasks.ts` for the contest_id(s); report count + task_ids; if absent or incomplete, ask the user to add missing rows (reference: `https://kenkoooo.com/atcoder/resources/problems.json`)
1. **Gather requirements** — infer the implementation pattern; confirm per [instructions.md §Requirements](instructions.md)
2. **Implement** — follow [instructions.md](instructions.md) for the confirmed pattern across 5 layers (TDD)
