# Coding Style

## Pre-Implementation Layer Check

Before writing logic, decide which layer it belongs to:

| Layer          | Directory                                   | Constraints                                             |
| -------------- | ------------------------------------------- | ------------------------------------------------------- |
| DB schema      | `prisma/`                                   | Migrations immutable after apply                        |
| DB access      | `src/lib/server/`                           | Server-only; never in client                            |
| Validation     | `src/**/zod/`                               | `z.number().int()` for Int; dual-enforce with SQL CHECK |
| Domain types   | `src/**/types/`                             | Plural aliases; TSDoc; avoid `any`                      |
| Test data      | `src/**/fixtures/`                          | Write before impl (TDD); realistic values               |
| Business logic | `src/**/services/`                          | Pure values/`null`; no `Response`/`json()`              |
| External APIs  | `src/lib/clients/` or `*/internal_clients/` | Shared → `lib`; feature-scoped → `internal_clients`     |
| Utilities      | `src/**/utils/`                             | No side effects; adjacent unit test required            |
| State          | `src/**/stores/`                            | `.svelte.ts`; class + `$state()`; singleton export      |
| Route handlers | `src/routes/`                               | Page: `redirect()`; API: `error()`                      |
| Components     | `src/**/*.svelte`                           | Svelte 5 Runes; logic → `utils/`                        |

## Naming

- **No abbreviations** unless standard (e.g., `id`, `url`)
- **Lambda params**: no single-char (except `i` for loops)
- **Function verbs**: `get` (read), `build`/`create` (construct), `calc`/`compute` (derive), `update`, `fetch`, `resolve`
- **Domain enums**: use domain type, not `string` (validates at boundary, stays typed inside)
- **Constants**: reflect content not purpose; extract magic numbers/strings
- **Files**: `snake_case` in routes, `kebab-case` dirs, underscore-prefix helpers (`_utils/`, `_types/`)

## Syntax

- **Braces**: always for single-statement `if` blocks
- **Catch blocks**: never silent; re-throw, log, or comment
- **Plural aliases**: `type Items = Item[]` in signatures
- **TSDoc**: add when behavior, constraints, or params are non-obvious; omit when names are self-explanatory (`getTaskById(id: string)` needs no `@param id` comment)

## Type Guards at API Boundaries

When receiving enum values from external APIs, validate with a type guard:

```typescript
// Good: `isValidTaskGrade(value): value is TaskGrade`
const grade = isValidTaskGrade(data.grade) ? data.grade : null;
```

Extract to `src/lib/utils/` with adjacent tests.

## Dead Code: Three-Condition Rule

Delete function only if: (1) zero callers, (2) replacement exists, (3) dependent fields also deleted.

Before removing an import, grep the entire file for all usages — removing one call site doesn't mean no others exist.

## Residual-Reference Sweeps

When removing a dependency or renaming a symbol, sweep the **whole repo**, not just `src`:

- `grep --include='*.{ts,svelte,md}'` does NOT brace-expand — it silently matches nothing.
  Use `rg -ni 'name' -g '*.ts' -g '*.svelte' -g '*.md'` instead.
- Include root files (CONTRIBUTING.md, README), `e2e/`, and config (`vite.config.ts`) —
  not only `src prisma .claude`.

## Documentation

- **Plans/dev-notes**: Japanese
- **Code/commits/tests**: English
- **TSDoc**: add when behavior, constraints, or params are non-obvious
- **Code blocks**: specify language (`typescript`, `sql`, `bash`)

## Security

- No user-identifiable data in logs
- No Prisma imports in route handlers
- Validate input at system boundaries
- Return safe defaults on service errors

## Comments: Why, Not What

Comment the **why** (non-obvious reason), not the **what** (code already says).

- Bad: `// increment counter`
- Good: `// use task_id as deterministic ID to avoid SSR/hydration mismatch`

Keep to one line. If longer, refactor code (naming, structure) instead.
