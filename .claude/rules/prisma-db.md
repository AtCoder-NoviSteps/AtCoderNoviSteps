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
2. Run `pnpm exec prisma migrate dev --name <description>` to create migration (`<description>` must be `snake_case`, e.g., `add_role_to_user`)

## Naming

- Model names: `PascalCase` (e.g., `User`, `TaskAnswer`)
- Field names: `camelCase` (preferred) or `snake_case` (legacy)
- Relation fields: Descriptive names matching the relation

## Server-Only Code

- Import database client only in `src/lib/server/`
- Use `$lib/server/database` for Prisma client access
- Never import server code in client components

## Service Layer

- All CRUD operations must go through the service layer (`src/lib/services/` or `src/features/**/services/`)
- Route handlers (`+server.ts`, `+page.server.ts`) should call service methods, not use Prisma directly
- Service functions return pure values (e.g., `{ error: string } | null`), never HTTP-specific objects (`Response`, `json()`)

## Transactions

- Use `prisma.$transaction()` for multi-step operations
- Handle errors with try-catch and proper rollback

## Idempotent Writes

- Prefer `createMany({ skipDuplicates: true })` over try-catching P2002 when a unique constraint violation is expected (e.g., double-submit race condition). It maps to `INSERT ... ON CONFLICT DO NOTHING` and keeps intent clear.
- Constraints: top-level `createMany` only (not nested); PostgreSQL, CockroachDB, SQLite only.

## Validate Constraints

Prisma does not support `@@check` in `schema.prisma`. To add a validate constraint:

1. Run `pnpm exec prisma migrate dev --create-only --name <description>` to generate the migration file without applying it (`<description>` must be `snake_case`)
2. Edit the generated `migration.sql` to add the validate constraint manually
3. Run `pnpm exec prisma migrate dev` to apply

After adding a validate constraint, add a comment to `prisma/ERD.md` under the relevant entity:

```mermaid
%% XOR constraint: workbookplacement_xor_grade_category — exactly one of taskGrade or solutionCategory must be non-null
```

This is the only place validate constraints are visible, since Prisma omits them from `schema.prisma`.
