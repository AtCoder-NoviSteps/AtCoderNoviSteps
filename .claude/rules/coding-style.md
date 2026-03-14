# Coding Style

## Braces Required

Always use braces for single-statement `if` blocks. Never write `if () return;` — write `if () { return; }`.

## Lambda Parameter Naming

No single-character lambda parameter names. Use descriptive names (e.g., `placement`, `workbook`). Iterator index `i` is the only exception.

## No Uncommon Abbreviations

Avoid non-standard abbreviations. Write out full names for clarity.

- `res` → `response`
- `SolutionCols` → `SolutionCategories`
- `btn` → `button`

When in doubt, spell it out.

## Markdown Code Blocks

Always specify a language identifier on every fenced code block. Never write bare ` ``` `.

Common identifiers: `typescript`, `svelte`, `sql`, `bash`, `mermaid`, `json`, `prisma`, `html`, `css`.

## Plural Type Aliases

Define plural type aliases instead of using `Hoge[]` directly. Use the plural form in function signatures and variables.

```typescript
// Good
type Placements = Placement[];

function getPlacements(): Placements { ... }

// Bad
function getPlacements(): Placement[] { ... }
```
