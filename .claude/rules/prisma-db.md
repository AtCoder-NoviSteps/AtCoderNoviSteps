---
description: Prisma and database rules
globs:
  - 'prisma/**'
  - 'src/lib/server/**'
  - 'src/lib/services/**'
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

## Transactions

- Use `prisma.$transaction()` for multi-step operations
- Handle errors with try-catch and proper rollback
