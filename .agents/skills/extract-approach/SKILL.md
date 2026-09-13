---
name: extract-approach
description: Use when a non-trivial problem has just been solved (bug fixed after debugging, tricky implementation completed, blocker resolved) and the session is about to move on. A solution without its learnings note is unfinished work.
argument-hint: '[task-name-en]'
---

Extract the approach from the just-solved problem into a learnings note for: $ARGUMENTS

**Skip when:** trivial fixes (typo, rename, config tweak), dependency bumps, or the insight is already covered by `docs/guides/agent-rules/` or the task's `plan.md`.

1. **Identify the problem** — the symptom from this session and what made it non-trivial; multiple candidates → confirm which one with AskUserQuestion
2. **Extract** — 問題 / 有効だったアプローチ / ハマった点 / 教訓 only; apply the extraction and abstraction rules in [instructions.md](instructions.md)
3. **Write the note** — `docs/dev-notes/YYYY-MM-DD/{task-name-en}/learning.md`; naming and format rules in [instructions.md](instructions.md)
4. **Escalate durable rules** — propose target file and exact wording for project-wide conventions; **do not apply without user confirmation**
