---
name: add-tasks
description: Add tasks of contests that an existing ContestType already covers to prisma/tasks.ts, with classification tests first. Use for "問題を追加しましょう" issues. Hands off to add-contest-table-provider when a new ContestType or provider is needed.
argument-hint: '<contest_id> [<contest_id> ...]'
---

Add tasks for: $ARGUMENTS

> When in doubt at any step, use AskUserQuestion before proceeding.

1. **Classify** — decide the ContestType and prefix group per [instructions.md §Classify](instructions.md); a new ContestType or provider → stop and switch to `add-contest-table-provider`
2. **Collect rows** — grep `prisma/tasks.ts`; ask the user to paste missing rows from problems.json; never fetch it yourself
3. **Tests first** — add fixture cases per [instructions.md §Tests](instructions.md); confirm **RED**
4. **Implement** — add the contest name to `prefixes.ts` → **GREEN**; insert rows per [instructions.md §Insert](instructions.md)
5. **Verify** — `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
