---
description: Prisma and database rules
paths:
  - 'prisma/**'
  - 'src/lib/server/**'
  - 'src/lib/services/**'
  - 'src/features/**/services/**'
---

# Prisma & Database

## Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `pnpm exec prisma migrate dev --name <snake_case_description>`

## Naming

- Models: `PascalCase` | Fields: `camelCase` (preferred) or `snake_case` (legacy)

## Server-Only Code

- Import DB client only in `src/lib/server/` via `$lib/server/database`
- Never import server code in client components

## Service Layer

- All CRUD through the service layer (`src/lib/services/` or `src/features/**/services/`)
- Route handlers call service methods — no direct Prisma in `+server.ts` / `+page.server.ts`
- Service functions return pure values (`{ error: string } | null`), never `Response` / `json()`

## Transactions

Use `prisma.$transaction()` for multi-step operations.

## Parallel Queries

When `+page.server.ts` `load` makes multiple independent queries, run them concurrently with `Promise.all` to reduce page load latency:

```typescript
// NG: sequential — each awaits the previous
const workbooks = await getWorkBooksWithAuthors();
const tasks = await getTasksByTaskId();
const results = await getTaskResultsOnlyResultExists(userId, true);

// OK: all three fire at once
const [workbooks, tasks, results] = await Promise.all([
  getWorkBooksWithAuthors(),
  getTasksByTaskId(),
  getTaskResultsOnlyResultExists(userId, true),
]);
```

Only applies when queries are **independent** (no output of one used as input to another).

## N+1 Queries

Replace per-item DB calls in loops with a bulk fetch + `Map`:

```typescript
const records = await prisma.foo.findMany({ where: { id: { in: ids } } });
const map = new Map(records.map((r) => [r.id, r]));
```

## Enum Types

Prisma-generated enums and app-defined enums are distinct TypeScript types even with identical members. Keep explicit casts at the boundary — do not remove them as "redundant".

## Idempotent Writes

Prefer `createMany({ skipDuplicates: true })` over catching P2002 for expected unique violations (e.g., double-submit). Maps to `INSERT ... ON CONFLICT DO NOTHING`. Top-level only (not nested); PostgreSQL/CockroachDB/SQLite only.

## Zod Schema for Int Fields

`z.number().positive()` passes decimals. For Prisma `Int` fields use `z.number().int().positive()`.

## Relation Filter Exclusion

Filtering on a relation field (e.g. `where: { placement: { type: 'CURRICULUM' } }`)
performs an INNER JOIN internally — rows without a matching relation record are
automatically excluded. This is not an IS NOT NULL check; the mechanism is the JOIN.

When documenting this behavior, write "excluded by INNER JOIN" rather than
"implicitly includes IS NOT NULL".

## FK Relations: Always Define @relation

Any field that references another model's ID must have an explicit `@relation` defined. Without `@relation`, Prisma does not generate FK constraints automatically, leading to referential integrity gaps.

```prisma
// Bad: FK without @relation
userId String

// Good: explicit @relation generates FK constraint
userId String
user   User @relation(fields: [userId], references: [id])
```

## DB-Level Value Constraints

Add `CHECK` constraints via manual migration SQL. Document with inline `schema.prisma` comments (e.g., `/// CHECK: count >= 0`). Note: `prisma generate` (via `prisma-markdown`) overwrites `ERD.md`—always keep the constraint definition in `schema.prisma` as the source of truth.

## Service Layer Error Handling

Catch Prisma errors in service functions, return domain values:

- `P2025` (record not found) → `null` (no exception)
- Other errors → re-throw (caller handles as 500)

This removes Prisma imports from route handlers and enables easy testing with mocked returns.

## Dual-Enforcement Constraints

When the same constraint is enforced in both Zod (early validation) and SQL `CHECK` (last line of defense), add an inline comment stating each layer's role and the obligation to keep them in sync:

```typescript
// XOR constraint: dual enforcement via Zod (early validation) and a CHECK in migration.sql (last line of defense).
// Prisma lacks @@check, so the SQL constraint is maintained manually. Keep both in sync.
.refine(...)
```

## @@map and Manual Migration SQL

When writing manual migration SQL for models that use `@@map`, always use the `@@map` value (the actual DB table name), not the Prisma model name. PostgreSQL treats quoted identifiers as case-sensitive, so `"VotedGradeCounter"` and `"votedgradecounter"` refer to different tables.

```sql
-- Bad: Prisma model name does not exist as a table
ALTER TABLE "VotedGradeCounter" ADD CONSTRAINT ...

-- Good: use the @@map value
ALTER TABLE "votedgradecounter" ADD CONSTRAINT ...
```

## P3009: Recovering from a Failed Migration

When a migration leaves `finished_at = NULL` in `_prisma_migrations`:

1. **Delete the broken migration file** from git (`git rm -r prisma/migrations/<name>/`) — leaving it causes `migrate dev` to fail on other machines.
2. Mark it as rolled back: `pnpm exec prisma migrate resolve --rolled-back <name>`
3. Create a **new migration with a new timestamp** containing the corrected SQL and deploy it.

A `--rolled-back` migration is permanently skipped by `migrate deploy`; fixing the original file has no effect.

## Merged Data: Document Uniqueness Loss

Service functions that merge records from multiple sources (e.g., `getMergedTasksMap()` combining base tasks + `ContestTaskPair` entries) lose individual field uniqueness. Document that results contain duplicates in "unique" DB fields.

Example: `getMergedTasksMap()` returns multiple entries with same `task_id` but different `contest_id` — callers must not assume `task_id` is unique. UI layer must use composite keys (see svelte-components.md `{#each}` patterns).

## Validate Constraints

Prisma does not support `@@check`. To add one:

1. `pnpm exec prisma migrate dev --create-only --name <description>` — generate migration without applying
2. Edit the generated `migration.sql` to add the CHECK constraint manually
3. Add an inline comment in `schema.prisma` (e.g., `/// CHECK: constraint description`)
4. `pnpm exec prisma migrate dev` — apply

For visibility, also document complex constraints in `prisma/ERD.md`:

```mermaid
%% XOR constraint: workbookplacement_xor_grade_category — exactly one of taskGrade or solutionCategory must be non-null
```
