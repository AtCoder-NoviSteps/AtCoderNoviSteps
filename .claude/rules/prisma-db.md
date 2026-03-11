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
2. Run `pnpm exec prisma migrate dev --name <description>` to create migration
3. Run `pnpm exec prisma generate` to update client (auto-runs after migrate)

## Naming

- Model names: `PascalCase` (e.g., `User`, `TaskAnswer`)
- Field names: `camelCase` (preferred) or `snake_case` (legacy)
- Relation fields: Descriptive names matching the relation

## Key Models

- `User`: User accounts with AtCoder validation status
- `Task`: Tasks with difficulty grades (Q11-D6)
- `TaskAnswer`: User submission status per task
- `WorkBook`: task collections
- `Tag` / `TaskTag`: task categorization

## Server-Only Code

- Import database client only in `src/lib/server/`
- Use `$lib/server/database` for Prisma client access
- Never import server code in client components

## Service Layer

- All CRUD operations must go through the service layer (`src/lib/services/` or `src/features/**/services/`)
- Route handlers (`+server.ts`, `+page.server.ts`) and `prisma/seed.ts` should call service methods, not use Prisma directly
- Service functions return pure values (e.g., `{ error: string } | null`), never HTTP-specific objects (`Response`, `json()`)

## Transactions

- Use `prisma.$transaction()` for multi-step operations
- Handle errors with try-catch and proper rollback
