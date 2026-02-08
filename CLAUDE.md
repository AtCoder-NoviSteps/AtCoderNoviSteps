# AtCoder NoviSteps

This unofficial web service enables users to track their submissions on [AtCoder](https://atcoder.jp/) and other competitive programming platforms. Users can track the status of their submissions for problems graded on a scale from Q11 to D6 (17 levels).

**Main Features:**

- Track submission status (AC, AC with editorial, Trying, Pending)
- Browse problems by contest type and difficulty
- Problem collections (workbooks) organized by topic/algorithm

## Technology Stack

**Framework & Language:**

- SvelteKit 2.x (file-based routing)
- Svelte 5.x with Runes mode enabled
- TypeScript with strict mode

**Backend & Database:**

- PostgreSQL (via Supabase)
- Prisma ORM (client generated with `@prisma/client` and `@quramy/prisma-fabbrica`)
- Lucia v2 for authentication

**UI & Styling:**

- Flowbite Svelte (component library)
- Tailwind CSS 4.x
- Lucide icons

**Testing:**

- Vitest for unit tests (`src/**/*.test.ts`)
- Playwright for E2E tests (`tests/`)
- Nock for HTTP mocking in tests

**Deployment:**

- Vercel (Tokyo region: hnd1)
- GitHub Actions for CI/CD

## Essential Commands

### Development

```bash
# Start development server (auto-opens browser at localhost:5174)
pnpm dev

# Start with manual browser opening
pnpm dev --open

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Database

```bash
# Generate Prisma client (auto-runs after pnpm install)
pnpm exec prisma generate

# Push schema changes to database (for development)
pnpm exec prisma db push

# Apply migrations (for production)
pnpm exec prisma migrate deploy

# Seed database with initial data
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio
```

### Testing

```bash
# Run all tests (integration + unit)
pnpm test

# Unit tests only (Vitest)
pnpm test:unit

# Integration tests only (Playwright)
pnpm test:integration

# Coverage report
pnpm coverage
```

### Code Quality

```bash
# Lint code (ESLint)
pnpm lint

# Format code (Prettier)
pnpm format

# Type-check Svelte components
pnpm check

# Type-check in watch mode
pnpm check:watch
```

**Note:** Git hooks (via lefthook) automatically run `prettier` and `eslint` on staged files before commit. To bypass: `LEFTHOOK=0 git commit -m "message"`

### Single Test Execution

```bash
# Run specific unit test file
pnpm exec vitest run path/to/test.test.ts

# Run specific test in watch mode
pnpm exec vitest path/to/test.test.ts

# Run specific Playwright test
pnpm exec playwright test tests/specific.test.ts
```

## Architecture

### SvelteKit Routing Structure

Routes are organized using SvelteKit's file-based routing with route groups:

```
src/routes/
├── +layout.svelte              # Root layout (navbar, common UI)
├── +layout.server.ts           # Root layout data (user session)
├── +page.svelte                # Home page
├── (auth)/                     # Auth route group (no layout impact)
│   ├── login/+page.svelte
│   ├── signup/+page.svelte
│   └── logout/+page.server.ts
├── (admin)/                    # Admin route group
│   ├── tasks/
│   └── tags/
├── problems/                   # Problem listing
│   ├── +page.server.ts
│   └── [slug]/+page.svelte     # Dynamic problem detail
├── workbooks/                  # Problem collections
│   ├── +page.server.ts
│   ├── [slug]/                 # View workbook
│   ├── create/                 # Create new workbook
│   └── edit/[slug]/            # Edit workbook
└── users/
    ├── [username]/             # User profile
    └── edit/                   # Edit profile
```

**Key Pattern:** `+page.server.ts` files handle server-side data loading and form actions. Data flows to `+page.svelte` via the `data` prop.

### Authentication Flow

Authentication uses Lucia v2 with Prisma adapter:

1. **Session validation** happens in `src/hooks.server.ts` for every request
2. Session data is attached to `event.locals.user` (id, name, role, atcoder_name, is_validated)
3. Protected routes check `event.locals.user` in `+page.server.ts` load functions
4. Auth forms use Superforms + Zod for validation

**Key files:**

- `src/lib/server/auth.ts` - Lucia configuration
- `src/hooks.server.ts` - Global request handler
- `prisma/schema.prisma` - User, Session, Key models

### Database Schema (Prisma)

**Core models:**

- `User` - User accounts with AtCoder validation status
- `Task` - Problems from AtCoder with difficulty grades (Q11-D6)
- `TaskAnswer` - User submission status per problem
- `WorkBook` - Problem collections (curriculum, solution-based, user-created)
- `WorkBookTask` - Many-to-many relation between workbooks and tasks
- `Tag` / `TaskTag` - Categorization system for problems

**Important enums:**

- `TaskGrade` - Q11 (easiest) to D6 (hardest)
- `ContestType` - ABC, ARC, AGC, JOI, etc.
- `WorkBookType` - CURRICULUM, SOLUTION, CREATED_BY_USER

**Note:** Schema uses camelCase for field names (Lucia v3 migration requirement). Generate types after schema changes: `pnpm exec prisma generate`

### Directory Structure

```
src/lib/
├── actions/         # Svelte actions (use:action directives)
├── clients/         # HTTP clients for external APIs (AtCoder Problems, AOJ)
│   └── cache.ts     # Response caching with TTL
├── components/      # Reusable Svelte components
├── constants/       # App constants (URLs, links, status codes)
├── server/          # Server-only code (auth, database)
├── services/        # Business logic (users, tags, task_tags)
├── stores/          # Svelte stores (Runes mode: .svelte.ts files)
├── types/           # TypeScript type definitions
├── utils/           # Pure utility functions
└── zod/             # Zod validation schemas
```

**Testing convention:** Tests live in `src/test/` mirroring the `src/lib/` structure

### External API Integration

The app fetches problem data from:

- **AtCoder Problems API** - Contest and task metadata
- **Aizu Online Judge API** - Additional problem sources

**Implementation:** `src/lib/clients/` contains typed HTTP clients with caching (`cache.ts`). Use Nock for mocking in tests (see `src/test/lib/clients/`).

### Svelte 5 Runes Mode

All new Svelte code uses Runes mode:

- Use `$props()`, `$state()`, `$derived()` instead of `export let`, `let x = $state()`
- Stores in `.svelte.ts` files use `$state()` runes
- Legacy components in `node_modules` use compatibility mode (see `svelte.config.js`)

### Deployment Architecture

**Branches:**

- `staging` (default) - Preview environment with staging database
- `main` - Production environment with production database

**CI/CD (GitHub Actions):**

1. Build + Lint + Unit tests on all PRs and pushes
2. Preview deployment to Vercel (on staging branch)
3. Production deployment to Vercel (on main branch)
4. Database migrations run automatically before deployment

**Vercel config:** Tokyo region (hnd1), 3008MB memory, 30s max duration

## Important Conventions

### Naming

- Database fields: `snake_case` (legacy) or `camelCase` (new, preferred)
- TypeScript: `camelCase` for variables/functions, `PascalCase` for types/components
- Files: `kebab-case.ts` or `PascalCase.svelte` for components

### Testing

- Unit tests: `*.test.ts` files alongside source code
- E2E tests: `tests/*.test.ts` (Playwright)
- Use factories from `@quramy/prisma-fabbrica` for test data

### Form Handling

- Use Superforms with Zod schemas for all forms
- Server actions return structured success/error responses
- Client-side validation mirrors server-side schemas

### Code Quality

- Pre-commit hooks enforce formatting and linting
- All new code must pass TypeScript strict mode
- Coverage reports available via `pnpm coverage`

## Development Environment

**Requirements:**

- Node.js 24.x
- pnpm (auto-detected from `package.json`)
- Docker Desktop (for PostgreSQL via Dev Containers)
- VS Code with Dev Containers extension (recommended)

**Setup:**

1. Clone repository
2. Open in VS Code Dev Container (auto-installs dependencies)
3. Run `pnpm exec prisma db push` to initialize database
4. Run `pnpm db:seed` to populate initial data
5. Run `pnpm dev` to start development server

**Docker setup (alternative):**

```bash
docker compose up -d
docker compose exec web pnpm install
docker compose exec web pnpm exec prisma db push
docker compose exec web pnpm dev --host
```

## Special Notes

- **Memory leak prevention:** Vite config excludes large directories from watch (node_modules, .svelte-kit, etc.)
- **Vercel memory:** Increased to 3008MB for `/workbooks/{slug}` route to prevent OOM
- **AtCoder validation:** Users can link AtCoder accounts via validation code
- **Guest account:** Username `guest`, password `Hell0Guest` for demo purposes
- **Difficulty system:** Problems graded Q11-D6 (11 Q grades + 6 D grades = 17 levels)
