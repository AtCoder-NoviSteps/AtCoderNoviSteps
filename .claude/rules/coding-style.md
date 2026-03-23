# Coding Style

## Plan Time

### Pre-Implementation Layer Check

Before writing new logic, decide which layer it belongs to. Run this check at plan time (design/architecture phase, before writing any code):

| Layer          | Directory                                              | Key constraints                                                            |
| -------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| DB schema      | `prisma/`                                              | Migrations are immutable after apply                                       |
| DB access      | `src/lib/server/`                                      | Server-only; never import in client code                                   |
| Validation     | `src/**/zod/`                                          | `z.number().int()` for Int fields; comment dual-enforcement with SQL CHECK |
| Domain types   | `src/**/types/` (`_types/` inside `src/routes/`)       | Plural aliases; TSDoc on every export; no `any`                            |
| Test data      | `src/**/fixtures/` (`_fixtures/` inside `src/routes/`) | Write before implementation (TDD); use realistic values                    |
| Business logic | `src/**/services/`                                     | Return pure values or `null`; no `Response`/`json()`                       |
| Pure utilities | `src/**/utils/` (`_utils/` inside `src/routes/`)       | No side effects; adjacent unit test required                               |
| State          | `src/**/stores/`                                       | `.svelte.ts`; class + `$state()`; singleton export                         |
| Route handlers | `src/routes/`                                          | Page: `redirect()`; API: `error()`                                         |
| UI components  | `src/**/*.svelte`                                      | Svelte 5 Runes; business logic → `utils/`                                  |

## Code Structure

### Naming

- **Abbreviations**: avoid non-standard abbreviations (`res` → `response`, `btn` → `button`). When in doubt, spell it out.
- **Lambda parameters**: no single-character names (e.g., use `placement`, `workbook`). Iterator index `i` is the only exception.
- **`upsert`**: only use when the implementation performs both insert and update. For insert-only, use `initialize`, `seed`, or another accurate verb.
- **`any`**: before using `any`, check the value's origin — adding a missing `@types/*` or `devDependency` often provides the correct type.
- **UI labels**: if a label does not match actual behavior, update it or add an inline comment explaining the intentional mismatch.
- **Constant names**: reflect what the value IS (content), not what it is used for (purpose). e.g., a set holding all enum tab values is `EXISTING_TABS`, not `VALID_TABS`.
- **New files**: before naming a new file or directory, grep the relevant `src/` directory to confirm existing conventions. Confirm at plan time, not during implementation:
  - Custom files in routes (utilities, helpers, etc.): `snake_case` (e.g., `user_profile.ts`)
  - SvelteKit special files: follow framework conventions (`+page.svelte`, `+page.server.ts`, `+server.ts`)
  - Helper directories inside `src/routes/`: underscore-prefixed (`_utils/`, `_types/`, `_fixtures/`, `_components/`)
  - Other directories: `kebab-case` (e.g., `contest-table/`)

### Syntax

- **Braces**: always use braces for single-statement `if` blocks. Never `if () return;` — write `if () { return; }`.
- **Plural type aliases**: define `type Placements = Placement[]` instead of using `Placement[]` directly in signatures and variables.

### No Hard-Coded Values

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

### Function Ordering

Within a file, order declarations as follows:

1. Exported functions and classes (public API first)
2. Internal helper functions (supporting the exports above)

Shared helper functions (used by two or more exports) should be grouped at the end of the file.

## Documentation

### Language Policy

Write all project documentation (plans, dev-notes, guides, refactor notes) in Japanese. Write all source code comments, TSDoc, commit messages, and test titles in English. This keeps documentation readable for the team while keeping code comments universally accessible and searchable.

**Exception**: The `## CodeRabbit Findings` section in `refactor.md` must quote findings verbatim in their original language (English). Do not translate CodeRabbit output.

### TSDoc

Add TSDoc comments to every exported function, type, and class. The minimum required fields are `@param` (for non-obvious parameters) and `@returns` (when the return value is not evident from the type). One-liner `/** ... */` is sufficient for simple cases; use multi-line only when behavior needs explanation.

For optional parameters with a default, state it explicitly in `@param`: `Defaults to false.`

```typescript
/** Returns the URL slug for a workbook, falling back to the workbook ID. */
export function getUrlSlugFrom(workbook: WorkbookList): string { ... }
```

### Markdown Code Blocks

Always specify a language identifier on every fenced code block. Never write bare ` ``` `.

Common identifiers: `typescript`, `svelte`, `sql`, `bash`, `mermaid`, `json`, `prisma`, `html`, `css`.

### Svelte 5: Prefer Official Docs Over Training Knowledge

When Svelte 5 behavior is unclear, fetch the official docs directly via WebFetch instead of relying on training knowledge.

URL pattern: `https://svelte.dev/docs/svelte/{section}`

Examples:

- `$effect` behavior → `https://svelte.dev/docs/svelte/$effect`
- Stores usage → `https://svelte.dev/docs/svelte/stores`
- Runes overview → `https://svelte.dev/docs/svelte/what-are-runes`

## SvelteKit Patterns

### Routes vs API Endpoints

- Page routes (`+page.server.ts`): use `redirect()` to navigate
- API routes (`+server.ts`): use `error()` — throwing `redirect()` returns a 3xx response; `fetch` follows it by default and receives the HTML page at the redirect target instead of a JSON error

### Internal Navigation: `resolve()` Wrapping

`svelte/no-navigation-without-resolve` requires all internal navigation to use `resolve()` from `$app/paths`. Two patterns apply:

**Parameterized routes** — type-safe, preferred:

```typescript
import { resolve } from '$app/paths';
resolve('/workbooks/[slug]', { slug: workbook.slug });
```

**Static routes and computed string paths** — TypeScript declaration merging makes `AppTypes['RouteId']` resolve as `string` (the base overload), which requires 2 arguments for every route. Suppress with a description, and pre-compute in `<script>` when used in templates (where `@ts-expect-error` cannot be placed inline):

```typescript
// @ts-expect-error svelte-check TS2554: AppTypes declaration merging causes RouteId to resolve as string, requiring params. Runtime behavior is correct.
const homeHref = resolve('/');
```

**External links** — add `rel="noreferrer external"` instead of wrapping with `resolve()`.

### Dual-Enforcement Constraints

When the same constraint is enforced in two layers (e.g. Zod validation + SQL `CHECK`), add an inline comment stating each layer's role and the obligation to keep them in sync:

```typescript
// XOR constraint: dual enforcement via Zod (early validation) and a CHECK in migration.sql (last line of defense).
// Prisma lacks @@check, so the SQL constraint is maintained manually. Keep both in sync.
.refine(...)
```

## Security

### Server-side Logging

Do not log user-identifiable or content data (titles, names, IDs that map to users) in server-side `console.log`. Use generic messages instead:

```typescript
// Bad: leaks content and user identity
console.log(`Created workbook "${workBook.title}" by user ${author.id}`);

// Good
console.log('Workbook created successfully');
```

Prefer placing the single authoritative log in the service layer; remove duplicate logs in route handlers that cover the same event.

## Svelte Patterns

### Async Rollback: Capture State Before `await`

Capture `$state` values before the first `await` for safe rollback. A concurrent update can overwrite the variable while awaiting:

```typescript
const previous = items; // capture before await
try {
  await saveToServer(items);
} catch {
  items = previous;
}
```

### Optimistic Updates

Derive computed fields (flags, labels, etc.) from the canonical data source — don't
re-implement the derivation inline. Divergence causes a "works after reload" bug where
the server state is correct but the client-side update is wrong.

**Diagnostic**: "Not reflected live, but fixed after reload" → suspect the optimistic
update payload, not the reactivity system.

## Code Review

### CodeRabbit Review: Severity Triage

Run `coderabbit review --plain` once after all phases are complete (not on every commit).

**Triage by severity:**

- **critical / high / potential_issue (medium)**: Write all findings verbatim to a `## CodeRabbit Findings` section in `refactor.md`. The user decides which to fix before opening the PR. Do not fix any of these findings unilaterally.
- **nitpick / info**: Defer to PR CI — CodeRabbit will re-comment on the open PR.

Writing medium-and-above findings to `refactor.md` serves a dual purpose: it gives the user full visibility for a fix/defer decision, and it builds the implementer's understanding of recurring quality issues.
