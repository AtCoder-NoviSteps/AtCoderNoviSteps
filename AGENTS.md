# AtCoder NoviSteps

A web service for tracking submissions on AtCoder and other competitive programming sites, which are graded by difficulty (Q11-D6).

## Guidelines

Always prefer simplicity over pathological correctness. YAGNI, KISS, DRY. No backward-compat shims or fallback paths unless they come free without adding cyclomatic complexity.

## Tech Stack

SvelteKit 2 + Svelte 5 (Runes) + TypeScript | PostgreSQL + Prisma | Flowbite Svelte + Tailwind 4 | Vitest + Playwright

## Commands

```bash
pnpm dev              # Start dev server (localhost:5174)
pnpm build            # Build for production
pnpm test             # Run all tests
pnpm test:unit        # Vitest unit tests
pnpm test:integration # Playwright E2E tests
pnpm coverage         # Report test coverage
pnpm lint             # ESLint check
pnpm format           # Prettier format
pnpm check            # Svelte type check
pnpm exec prisma generate           # Generate Prisma client
pnpm exec prisma migrate dev --name # Create migration (with description)
pnpm db:seed          # Seed database
```

## Project Structure

```md
src/routes/ # SvelteKit file-based routing
src/lib/
├── actions/ # SvelteKit actions
├── clients/ # External API clients (AtCoder Problems, AOJ)
├── components/ # Svelte components
├── constants/
├── server/ # Server-only (auth.ts, database.ts)
├── services/ # Business logic
├── stores/ # Svelte stores (.svelte.ts with Runes)
├── types/ # TypeScript types
├── utils/ # Pure utility functions
└── zod/ # Validation schemas
src/test/ # Unit tests (mirrors src/lib/)
tests/ # E2E tests (Playwright)
prisma/schema.prisma # Database schema
```

## Key Conventions

- **Svelte 5 Runes**: Use `$props()`, `$state()`, `$derived()` in all new components
- **Server data**: `+page.server.ts` → `+page.svelte` via `data` prop
- **Forms**: Superforms + Zod validation
- **Tests**: Write tests before implementation (TDD). Use `@quramy/prisma-fabbrica` for factories, Nock for HTTP mocking
- **Naming**: `camelCase` variables, `PascalCase` types/components, `snake_case` files/routes, `kebab-case` directories
- **Pre-commit**: Lefthook runs Prettier + ESLint (bypass: `LEFTHOOK=0 git commit`)

## References

- See `package.json` for versions and scripts
- See `prisma/schema.prisma` for database models
- See `docs/guides/` for detailed documentation
- See `docs/guides/architecture.md` for directory structure and colocation guide
