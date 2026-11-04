---
description: Dependency update and security override rules
paths:
  - 'package.json'
  - 'pnpm-workspace.yaml'
  - 'renovate.json'
---

# Dependencies

## Fixing a Vulnerable Transitive Dependency

Try these in order:

1. **Remove it.** Check that the direct dependency that pulls it in is still used. If it is not, delete it.
2. **Update the lockfile.** If the parent's declared range already allows the fixed version (e.g. `^8.12.1` and the fix is `8.12.3`), run `pnpm update <pkg>`. No override is needed.
3. **Add an override.** Use it only when the fix is outside the parent's range.

Before you choose 2 or 3, read the advisory's trigger conditions and check whether this project can reach them. If it cannot, dismissing the alert is a valid choice. Judge each advisory on its own: do not reuse the reasoning for one advisory to dismiss another advisory of the same package.

## Writing Overrides

- Make the upper bound equal to the pin: `'pkg@>=1.0.0 <1.1.21': '1.1.21'`. If they differ (`<1.1.13': '1.1.18'`), the pin can become vulnerable later, and the selector will never match it again.
- Overrides ignore the parent's declared range. Pick the lowest fixed version that the parent accepts, not the latest one.
- When you cross a major on purpose, check the API the parent actually uses, and add a comment that says when to remove the override.
- When you review alerts, also check that each existing override still matches a package and that its pin is not vulnerable.
