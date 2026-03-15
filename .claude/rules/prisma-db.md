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

## Validate Constraints

Prisma does not support `@@check`. To add one:

1. `pnpm exec prisma migrate dev --create-only --name <description>` — generate migration without applying
2. Edit the generated `migration.sql` to add the CHECK constraint manually
3. `pnpm exec prisma migrate dev` — apply

Document the constraint in `prisma/ERD.md` (the only place it's visible):

```mermaid
%% XOR constraint: workbookplacement_xor_grade_category — exactly one of taskGrade or solutionCategory must be non-null
```
