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
- API routes (`+server.ts`): use `error()` — throwing `redirect()` causes `fetch` clients to receive HTML instead of a JSON error

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
