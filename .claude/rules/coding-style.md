# Coding Style

## Naming

- **Abbreviations**: avoid non-standard abbreviations (`res` → `response`, `btn` → `button`). When in doubt, spell it out.
- **Lambda parameters**: no single-character names (e.g., use `placement`, `workbook`). Iterator index `i` is the only exception.
- **`upsert`**: only use when the implementation performs both insert and update. For insert-only, use `initialize`, `seed`, or another accurate verb.
- **`any`**: before using `any`, check the value's origin — adding a missing `@types/*` or `devDependency` often provides the correct type.
- **UI labels**: if a label does not match actual behavior, update it or add an inline comment explaining the intentional mismatch.

## Syntax

- **Braces**: always use braces for single-statement `if` blocks. Never `if () return;` — write `if () { return; }`.
- **Plural type aliases**: define `type Placements = Placement[]` instead of using `Placement[]` directly in signatures and variables.

## Markdown Code Blocks

Always specify a language identifier on every fenced code block. Never write bare ` ``` `.

Common identifiers: `typescript`, `svelte`, `sql`, `bash`, `mermaid`, `json`, `prisma`, `html`, `css`.

## SvelteKit: Routes vs API Endpoints

- Page routes (`+page.server.ts`): use `redirect()` to navigate
- API routes (`+server.ts`): use `error()` — throwing `redirect()` returns a 3xx response; `fetch` follows it by default and receives the HTML page at the redirect target instead of a JSON error

## Dual-Enforcement Constraints

When the same constraint is enforced in two layers (e.g. Zod validation + SQL `CHECK`), add an inline comment stating each layer's role and the obligation to keep them in sync:

```typescript
// XOR constraint: dual enforcement via Zod (early validation) and a CHECK in migration.sql (last line of defence).
// Prisma lacks @@check, so the SQL constraint is maintained manually. Keep both in sync.
.refine(...)
```

## Async Rollback: Capture State Before `await`

Capture `$state` values before the first `await` for safe rollback. A concurrent update can overwrite the variable while awaiting:

```typescript
const previous = items; // capture before await
try {
  await saveToServer(items);
} catch {
  items = previous;
}
```
