# Coding Style

## Plan Time

### Pre-Implementation Layer Check

Before writing new logic, decide which layer it belongs to. Run this check at plan time (design/architecture phase, before writing any code):

| Layer          | Directory                                              | Key constraints                                                            |
| -------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| DB schema      | `prisma/`                                              | Migrations are immutable after apply                                       |
| DB access      | `src/lib/server/`                                      | Server-only; never import in client code                                   |
| Validation     | `src/**/zod/`                                          | `z.number().int()` for Int fields; comment dual-enforcement with SQL CHECK |
| Domain types   | `src/**/types/` (`_types/` inside `src/routes/`)       | Plural aliases; TSDoc on every export; avoid `any`; see alternatives       |
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
- **`any`**: before using `any`, check the value's origin — adding a missing `@types/*` or `devDependency` often provides the correct type. When `any` seems unavoidable, use the narrowest alternative:

  | Situation                                                  | Alternative                                                              |
  | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
  | Assign to a property not on the type                       | `obj as T & { prop: U }` (intersection cast)                             |
  | Return type too complex to write manually                  | `ReturnType<typeof fn>`                                                  |
  | Partial mock: only specific properties matter              | `Partial<T>`, `Pick<T, 'a' \| 'b'>`, or `satisfies` — prefer these first |
  | Partial mock: none of the above narrow the type far enough | `as unknown as T` — last resort; bypasses type checking entirely         |
  | Inline `: any` annotation where inference reaches          | Delete the annotation                                                    |

- **UI labels**: if a label does not match actual behavior, update it or add an inline comment explaining the intentional mismatch.
- **Constant names**: reflect what the value IS (content), not what it is used for (purpose). e.g., a set holding all enum tab values is `EXISTING_TABS`, not `VALID_TABS`.
- **New files**: before naming a new file or directory, grep the relevant `src/` directory to confirm existing conventions. Confirm at plan time, not during implementation:
  - Custom files in routes (utilities, helpers, etc.): `snake_case` (e.g., `user_profile.ts`)
  - SvelteKit special files: follow framework conventions (`+page.svelte`, `+page.server.ts`, `+server.ts`)
  - Helper directories inside `src/routes/`: underscore-prefixed (`_utils/`, `_types/`, `_fixtures/`, `_components/`)
  - Other directories: `kebab-case` (e.g., `contest-table/`)

### Syntax

- **Braces**: always use braces for single-statement `if` blocks. Never `if () return;` — write `if () { return; }`.
- **Domain types over `string`**: when the Prisma schema uses an enum (e.g. `grade: TaskGrade`), the corresponding app-layer type must use the same enum — not `string`. A loose `string` type hides misspellings in fixtures and forces `as TaskGrade` casts throughout the codebase. When a field comes from an external source (form data, query params), validate and narrow it at the boundary; inside the app it must always be the domain type.
- **Plural type aliases**: define `type Placements = Placement[]` instead of using `Placement[]` directly in signatures and variables.
- **Empty `catch` blocks**: never use `catch { }` or `catch (_e)` to silence errors. Every `catch` must re-throw, log, or contain an explanatory comment justifying the suppression. Silent swallowing hides bugs and makes failures untraceable.

```typescript
// Bad: silently discards the error
try { ... } catch { }
try { ... } catch (_e) { }

// Good: log and re-throw (adds context before propagating)
try { ... } catch (error) {
  console.error('Operation failed:', error);
  throw error;
}

// Good: intentional suppression with explanation
try {
  localStorage.setItem(key, value);
} catch {
  // localStorage may be unavailable (private browsing) — fall back to in-memory store
}
```

### No Hard-Coded Values

Extract magic numbers and strings to named constants. Never embed literal values whose meaning is not self-evident from the type or immediate context.

```typescript
// Bad: magic literals embedded inline
if (grade >= 11) { ... }

const response = await fetch('/api/workbooks/submit', options);

// Good
const MIN_GRADE = 11;
const SUBMIT_URL = '/api/workbooks/submit';

if (grade >= MIN_GRADE) { ... }

const response = await fetch(SUBMIT_URL, options);
```

Place constants at the top of the file, or in a dedicated `constants/` module when shared across files.

### Function Ordering

Within a file, order declarations as follows:

1. Exported functions and classes (public API first)
2. Internal helper functions (supporting the exports above)

Place a private helper immediately after the single export that uses it. Place helpers shared by two or more exports at the end of the file.

## Documentation

### Language Policy

Write all project documentation (plans, dev-notes, guides, refactor notes) in Japanese. Write all source code comments, TSDoc, commit messages, and test titles in English. This keeps documentation readable for the team while keeping code comments universally accessible and searchable.

**Exception**: The `## CodeRabbit Findings` section in `plan.md` must quote findings verbatim in their original language (English). Do not translate CodeRabbit output.

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

## Code Review

### CodeRabbit Review: Severity Triage

Run `coderabbit review --plain` once after all phases are complete (not on every commit).

**Triage by severity:**

- **critical / high / potential_issue (medium)**: Write all findings verbatim to a `## CodeRabbit Findings` section in `plan.md`. The user decides which to fix before opening the PR. Do not fix any of these findings unilaterally.
- **nitpick / info**: Defer to PR CI — CodeRabbit will re-comment on the open PR.

Writing medium-and-above findings to `plan.md` serves a dual purpose: it gives the user full visibility for a fix/defer decision, and it builds the implementer's understanding of recurring quality issues.
