# Coding Style

## Naming

- **Abbreviations**: avoid non-standard abbreviations (`res` → `response`, `btn` → `button`). When in doubt, spell it out.
- **Lambda parameters**: no single-character names (e.g., use `placement`, `workbook`). Iterator index `i` is the only exception.
- **`upsert`**: only use when the implementation performs both insert and update. For insert-only, use `initialize`, `seed`, or another accurate verb.
- **`any`**: before using `any`, check the value's origin — adding a missing `@types/*` or `devDependency` often provides the correct type.
- **UI labels**: if a label does not match actual behavior, update it or add an inline comment explaining the intentional mismatch.

## TSDoc

Add TSDoc comments to every exported function, type, and class. The minimum required fields are `@param` (for non-obvious parameters) and `@returns` (when the return value is not evident from the type). One-liner `/** ... */` is sufficient for simple cases; use multi-line only when behaviour needs explanation.

```typescript
/** Returns the URL slug for a workbook, falling back to the workbook ID. */
export function getUrlSlugFrom(workbook: WorkbookList): string { ... }
```

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

## Optimistic Updates

Derive computed fields (flags, labels, etc.) from the canonical data source — don't
re-implement the derivation inline. Divergence causes a "works after reload" bug where
the server state is correct but the client-side update is wrong.

**Diagnostic**: "Not reflected live, but fixed after reload" → suspect the optimistic
update payload, not the reactivity system.

## Server-side Logging

Do not log user-identifiable or content data (titles, names, IDs that map to users) in server-side `console.log`. Use generic messages instead:

```typescript
// Bad: leaks content and user identity
console.log(`Created workbook "${workBook.title}" by user ${author.id}`);

// Good
console.log('Workbook created successfully');
```

Prefer placing the single authoritative log in the service layer; remove duplicate logs in route handlers that cover the same event.

## No Hard-Coded Values

Extract magic numbers and strings to named constants. Never embed literal values whose meaning is not self-evident from the type or immediate context.

```typescript
// Bad
if (grade >= 11) { ... }

const url = '/api/workbooks/submit';

// Good
const MIN_GRADE = 11;

if (grade >= MIN_GRADE) { ... }

const SUBMIT_URL = '/api/workbooks/submit';
```

Place constants at the top of the file, or in a dedicated `constants/` module when shared across files.

## Function Ordering

Within a file, order declarations as follows:

1. Exported functions and classes (public API first)
2. Internal helper functions (supporting the exports above)

Shared helper functions (used by two or more exports) should be grouped at the end of the file.

## Svelte 5: Prefer Official Docs Over Training Knowledge

When Svelte 5 behavior is unclear, fetch the official docs directly via WebFetch instead of relying on training knowledge.

URL pattern: `https://svelte.dev/docs/svelte/{section}`

Examples:

- `$effect` behavior → `https://svelte.dev/docs/svelte/$effect`
- Stores usage → `https://svelte.dev/docs/svelte/stores`
- Runes overview → `https://svelte.dev/docs/svelte/what-are-runes`

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
