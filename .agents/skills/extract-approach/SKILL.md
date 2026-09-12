---
name: extract-approach
description: Use when a non-trivial problem has just been solved (bug fixed after debugging, tricky implementation completed, blocker resolved) and the session is about to move on. A solution without its learnings note is unfinished work.
argument-hint: '[task-name-en]'
---

Extract the approach from the just-solved problem into a learnings note.

**Skip when:** trivial fixes (typo, rename, config tweak), dependency bumps, or the insight is already covered by `docs/guides/agent-rules/` or the task's `plan.md`.

1. **Identify the problem** — from the current session: the symptom and what made it non-trivial. Multiple candidates → confirm which one with AskUserQuestion.
2. **Extract, don't narrate** — no session log, no timestamps; record only what changes future behavior:
   - 問題: symptom and root cause, one line each
   - 有効だったアプローチ: what worked and why it worked
   - 行き詰まり: dead ends tried and why they failed
   - 教訓: reusable rules for next time
3. **Align abstraction (抽象度を揃える)** — state every 教訓 at the same level of generality: one general rule per bullet, optionally followed by a single concrete example from this session. Never mix operational steps and principles in the same list.
4. **Write the note** — `docs/dev-notes/YYYY-MM-DD/{task-name-en}/learning.md`, today's date. Directory name: `$ARGUMENTS` if given; else the plan.md directory name of the task this problem belongs to (when the session is executing one); else a short kebab-case name. Japanese prose, English code identifiers, ≤ 30 lines. If the file already exists, append a `---`-separated entry.
5. **Escalate durable rules** — if a 教訓 is a project-wide convention, propose the target file and exact wording; do not apply without user confirmation.
