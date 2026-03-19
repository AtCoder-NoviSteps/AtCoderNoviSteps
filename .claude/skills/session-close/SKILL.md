---
name: session-close
description: Standard closing routine for an implementation session. Verifies tests, updates the plan checklist, proposes rule/skill additions, checks for bloat, and detects repeated instructions.
disable-model-invocation: true
argument-hint: '[plan-file-path]'
---

Run the session-close routine described in [instructions.md](instructions.md).

Arguments: path to the active `plan.md` (optional — defaults to the most recently modified `docs/dev-notes/**/plan.md`).
