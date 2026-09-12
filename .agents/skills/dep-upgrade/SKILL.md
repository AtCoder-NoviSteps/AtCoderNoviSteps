---
name: dep-upgrade
description: Analyze a major version dependency upgrade: summarize breaking changes, assess project impact, and propose new features to adopt. Outputs a plan.md and executes the upgrade.
disable-model-invocation: true
argument-hint: '<package-name> <old-major> <new-major>'
---

Analyze and execute the major version upgrade for: $ARGUMENTS

1. **Analyze** — fetch the official migration guide via WebFetch; apply the checklist in [instructions.md](instructions.md)
2. **Generate plan** — create `docs/dev-notes/YYYY-MM-DD/{package}-upgrade/plan.md` with breaking changes, impact, and new features; **stop and ask for confirmation**
3. **Execute** — update `package.json`, run `pnpm install && pnpm lint && pnpm check && pnpm test:unit`; update the plan checklist when done
