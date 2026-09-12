# extract-approach instructions

## What to extract

Record only what changes future behavior. No session log, no timestamps, no narration of the order things happened in.

| Section              | Content                                       |
| -------------------- | --------------------------------------------- |
| 問題                 | Symptom and root cause, one line each         |
| 有効だったアプローチ | What worked, and **why** it worked            |
| ハマった点           | Dead ends actually tried, and why each failed |
| 教訓                 | Reusable rules that apply beyond this task    |

Omit a section that has nothing real to say. An empty ハマった点 is a signal the problem may have been trivial — reconsider the skip condition.

## Align abstraction (抽象度を揃える)

State every 教訓 at the same level of generality:

- One general rule per bullet, optionally followed by a single concrete example from this session.
- Never mix operational steps and principles in the same list.
- A bullet that only makes sense for this one file or this one bug is not a 教訓 — move it to 有効だったアプローチ or drop it.

## Note format

- Path: `docs/dev-notes/YYYY-MM-DD/{task-name-en}/learning.md`, using today's date.
- Directory name: `$ARGUMENTS` if given; else the `plan.md` directory name of the task this problem belongs to (when the session is executing one); else a short kebab-case name.
- Japanese prose, English code identifiers, 30 lines or fewer.
- One semantic paragraph or list item per line; no width-based hard line breaks.
- If the file already exists, append a `---`-separated entry instead of rewriting it.

## Escalating to a durable rule

A 教訓 belongs in a rules document when it would apply to an unrelated future task in the same path. Propose the target file under `docs/guides/agent-rules/` (or `AGENTS.md` for a project-wide principle) and the exact wording, then wait for the user's decision.
