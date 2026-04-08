# Coding Style

## Plan Time

### Pre-Implementation Layer Check

Before writing new logic, decide which layer it belongs to. Run this check at plan time (design/architecture phase, before writing any code):

| Layer          | Directory                                                | Key constraints                                                            |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| DB schema      | `prisma/`                                                | Migrations are immutable after apply                                       |
| DB access      | `src/lib/server/`                                        | Server-only; never import in client code                                   |
| Validation     | `src/**/zod/`                                            | `z.number().int()` for Int fields; comment dual-enforcement with SQL CHECK |
| Domain types   | `src/**/types/` (`_types/` inside `src/routes/`)         | Plural aliases; TSDoc on every export; avoid `any`; see alternatives       |
| Test data      | `src/**/fixtures/` (`_fixtures/` inside `src/routes/`)   | Write before implementation (TDD); use realistic values                    |
| Business logic | `src/**/services/`                                       | Return pure values or `null`; no `Response`/`json()`                       |
| External APIs  | `src/lib/clients/` or `src/features/*/internal_clients/` | Shared APIs → `lib/clients/`; feature-scoped APIs → `internal_clients/`    |
| Pure utilities | `src/**/utils/` (`_utils/` inside `src/routes/`)         | No side effects; adjacent unit test required                               |
| State          | `src/**/stores/`                                         | `.svelte.ts`; class + `$state()`; singleton export                         |
| Route handlers | `src/routes/`                                            | Page: `redirect()`; API: `error()`                                         |
| UI components  | `src/**/*.svelte`                                        | Svelte 5 Runes; business logic → `utils/`                                  |

## Code Structure

### Naming

- **Abbreviations**: avoid non-standard abbreviations (`res` → `response`, `btn` → `button`). When in doubt, spell it out.
- **Lambda parameters**: no single-character names (e.g., use `placement`, `workbook`). Iterator index `i` is the only exception.
- **`upsert`**: only use when the implementation performs both insert and update. For insert-only, use `initialize`, `seed`, or another accurate verb.
- **Function verbs**: every function name must start with a verb. Noun-only names (`pointOnCircle`, `arcPath`) are ambiguous — use `calcPointOnCircle`, `buildArcPath`, etc. Common prefixes: `get` (read existing), `build`/`create` (construct new), `calc`/`compute` (derive by formula), `update`, `fetch`, `resolve`.
- **`any`**: Before using `any`, check the value's origin. If unavoidable: use `ReturnType<typeof fn>` for complex returns, `Partial<T>` for partial objects, `obj as T & { prop: U }` for property extension. Last resort: `as unknown as T`.

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
- **Empty `catch` blocks**: never use `catch { }` to silence errors. Either re-throw, log, or add a comment justifying suppression. Silent swallowing hides bugs.

```typescript
try { ... } catch (error) { console.error('...'); throw error; }  // good
try { localStorage.setItem(key, value); } catch { /* unavailable */ }  // good + comment
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

### URL Parameter Patterns

#### null-as-ALL: Omitting Params for "All" State

When a filter has an "all" or "unfiltered" state, omit the parameter entirely rather than using a magic value (e.g., "ALL", "\*").

**Pattern:**

- Parse function defaults to `null` when param is absent
- `null` → "show all" (no filter applied)
- URL: `/workbooks?tab=solution` (no `categories=`)
- Browser back button naturally restores default "all" view

**Benefit:** Cleaner URLs, intuitive history behavior, smaller sessionStorage footprint.

**Example:** `parseWorkBookCategory()` defaults to `null` = all categories

### Type Guards: Precise Narrowing for Excluded Values

When a type guard intentionally excludes enum members, use `Exclude<T, 'VALUE'>` in the return type to match runtime behavior. Caller code then trusts the type system; no `as` casts needed.

### Layer-Specific Responsibility: Normalization vs Filtering

When filtering data by multiple criteria (format + role):

- **Service layer**: Normalize raw data format (e.g., `null → PENDING`). Return all data; stay framework-agnostic and testable.
- **UI layer**: Filter by role/context (e.g., "admin sees PENDING, user doesn't"). Apply display rules in component.

**Benefit**: Services remain pure and unit-testable without mocking roles; UI logic explicit in one place.

### Function Composition: Single Responsibility

Separate independent transformations into distinct functions. Compose at call site.

```typescript
// groupBySolutionCategory(): pure grouping (testable)
// filterGroupsByRole(): pure filtering by role (testable)
let filtered = $derived(filterGroupsByRole(groupBySolutionCategory(workbooks, map), role));
```

**Benefit**: Each function testable in isolation; reusable in different contexts.

## Documentation

### Language Policy

Write all project documentation (plans, dev-notes, guides, refactor notes) in Japanese. Write all source code comments, TSDoc, commit messages, and test titles in English. This keeps documentation readable for the team while keeping code comments universally accessible and searchable.

**Exception**: The `## CodeRabbit Findings` section in `plan.md` must quote findings verbatim in their original language (English). Do not translate CodeRabbit output.

### TSDoc

Add TSDoc to every exported function, type, class. Minimum: `@param` (non-obvious), `@returns` (not evident from type). One-liner OK; multi-line for complex behavior only.

### Documentation

Write plans/dev-notes/guides in Japanese. Source code comments in English. Always specify language on code blocks (e.g., `typescript`, `sql`, `bash`). For Svelte 5 unclear behavior: fetch official docs via WebFetch, not training knowledge.

## Security & Code Review

- **Logging**: No user-identifiable data in `console.log`. Single authoritative log in service layer.
- **CodeRabbit**: Run after all phases complete. Write `critical`/`high`/`medium` findings to `plan.md` verbatim; defer `nitpick` to PR CI.

## `+page.server.ts` load() Error Handling

Wrap calls to service functions in try-catch and return safe default values on failure, preventing a single service error from crashing the entire page.

## Auth: Action Audit

When adding an auth guard to one action in `+page.server.ts`, audit all other actions in the same file. Asymmetric guards (some actions protected, others not) are a recurring pattern of vulnerability.

## Auth: success Flag and message Consistency

When an action returns `success: false`, the `message` and `message_type` must also reflect failure. A success flag contradicting the message is a silent bug.

## Dead Code Deletion: Three-Condition Rule

Before deleting a function, grep the full project for callers. Deletion is safe only when all three conditions hold: (1) zero callers, (2) a replacement implementation exists, (3) any fields this function wrote to are also being deleted.
