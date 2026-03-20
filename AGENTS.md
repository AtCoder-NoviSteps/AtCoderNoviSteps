# AtCoder NoviSteps

A web service for tracking submissions on AtCoder and other competitive programming sites, which are graded by difficulty (Q11-D6).

## Guidelines

Always prefer simplicity over pathological correctness. YAGNI, KISS, DRY. No backward-compat shims or fallback paths unless they come free without adding cyclomatic complexity.

**When implementing:**

1. Use `/writing-plans` to generate a phased plan (2–5-min tasks, lower risk → higher risk order). Verify each task before starting:
   - Which layer? (prisma / server / zod / types / fixtures / services / utils / stores / routes / components) — split if 2+ layers
   - Single responsibility: one purpose per task
   - Existing util/service/type? Search before creating
   - Test name: state it in the task description
2. Before writing a new function, search `src/lib/utils/`, `src/lib/services/`, `src/features/*/utils/` and `src/features/*/services/` for existing implementations; extract shared logic there when it appears in 2+ places
3. Write tests first, then implement production code, then verify with `pnpm test:unit`
4. Review critically after implementing: flag YAGNI violations, over-abstraction, missing tests
5. Run `/session-close` at the end of each session: updates plan checklist, proposes rule/skill additions, checks for bloat, and detects repeated instructions

## Tech Stack

SvelteKit 2 + Svelte 5 (Runes) + TypeScript | PostgreSQL + Prisma | Flowbite Svelte + Tailwind 4 | Vitest + Playwright

## Commands

```bash
pnpm dev              # Start dev server (localhost:5174)
pnpm build            # Build for production
pnpm test             # Run all tests
pnpm test:unit        # Vitest unit tests
pnpm test:e2e         # Playwright E2E tests
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
src/features/ # Feature-scoped code (single domain)
├── {feature}/
│ ├── components/ # Feature UI (list/, detail/, shared/)
│ ├── fixtures/ # Test data
│ ├── services/ # Feature business logic (CRUD via Prisma)
│ │ └── _.test.ts # Tests co-located next to source (not in src/test/)
│ ├── stores/ # Feature stores
│ ├── types/ # Feature types
│ └── utils/ # Feature utilities
│ └── _.test.ts # Tests co-located next to source
src/test/ # Unit tests (mirrors src/lib/)
e2e/ # E2E tests (Playwright)
prisma/schema.prisma # Database schema
```

## Key Conventions

- **Svelte 5 Runes**: Use `$props()`, `$state()`, `$derived()` in all new components
- **Service layer**: Services return data or `null`; never call `error()` or `redirect()`. HTTP error translation belongs in the route handler — the service must stay framework-agnostic and unit-testable.
- **Server data**: `+page.server.ts` → `+page.svelte` via `data` prop
- **Forms**: Superforms + Zod validation
- **Tests**: Write tests before implementation (TDD). Use `@quramy/prisma-fabbrica` for factories only in `prisma/seed.ts`. For service-layer unit tests, mock the DB with `vi.mock('$lib/server/database', ...)` — do not use fabbrica there. Use Nock for HTTP mocking
- **Naming**: `camelCase` variables, `PascalCase` types/components, `snake_case` files/routes, `kebab-case` directories
- **Pre-commit**: Lefthook runs Prettier + ESLint (bypass: `LEFTHOOK=0 git commit`)

## References

- See `package.json` for versions and scripts
- See `prisma/schema.prisma` for database models
- See `docs/guides/` for detailed documentation
- See `docs/guides/architecture.md` for directory structure and colocation guide
