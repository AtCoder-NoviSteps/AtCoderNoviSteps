# Session Close — Detailed Instructions

## Step 1: Verify Tests and Types

Run both checks and fix any failures before proceeding:

```bash
pnpm test:unit
pnpm test:e2e
pnpm check
```

Only errors introduced by this session need fixing. Pre-existing errors (visible in git diff baseline) may be left as-is with a note.

## Step 2: Update plan.md

Target file: the path passed as `$ARGUMENTS`, or the most recently modified `docs/dev-notes/**/plan.md`.

- Mark completed tasks: `- [ ]` → `- [x]`
- If all tasks in the plan are done, append a one-line completion note, then delete the file or replace its body with a single-line summary. Stale plan files must not be left behind.

## Step 3: Propose Rule / Skill Additions

Read all files in `.claude/rules/` and `.claude/skills/`. Then review the session's changes and identify lessons that meet **all** of the following criteria:

1. Generic enough to apply in future sessions (not specific to this PR's domain)
2. Not already covered by an existing rule or skill
3. Grounded in something that actually happened in this session (a bug caught, a type error, a pattern extracted)

Present each candidate as:

```
→ Add to `<filename>`: under section `<section>`
<code example>
<one-sentence rationale>
```

Do not apply changes until the user confirms.

## Step 4: Validate Rules / Skills for Bloat

For each file in `.claude/rules/`:

- Flag sections that duplicate content in another rule file
- Flag files exceeding 150 lines where consolidation is possible
- Flag outdated or project-specific content that no longer applies

Present a concrete diff proposal for each issue. Do not apply without confirmation.

## Step 5: Detect Repeated User Instructions

Scan the conversation history for instructions the user gave more than once across this or prior sessions (visible in memory or chat context). Categorize each as:

| Pattern                                | Suggested fix                             |
| -------------------------------------- | ----------------------------------------- |
| Always applies to every session        | Add to `AGENTS.md` workflow               |
| Applies to a specific file type        | Add to the relevant `.claude/rules/` file |
| A multi-step workflow called on demand | Promote to a new Skill                    |

Report findings as a short bulleted list. Do not modify files without confirmation.
