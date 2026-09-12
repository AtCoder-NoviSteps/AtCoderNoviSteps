# AtCoder NoviSteps

A web service for tracking submissions on AtCoder and other competitive programming sites, which are graded by difficulty (Q11-D6).

## Principles

- Prefer simple designs: YAGNI, KISS, DRY.
- Do not add compatibility shims or fallback paths unless they are effectively free.
- Write plans and dev notes in Japanese. Write source comments, test names, and commits in English.
- Write Markdown with one semantic paragraph or list item per line; rely on editor soft wrapping instead of width-based hard line breaks.

## Implementation Workflow

1. Before implementation, create a lower-risk-to-higher-risk phased plan at `docs/dev-notes/YYYY-MM-DD/{task-name-en}/plan.md`. Keep it concise without omitting the overview, design rationale, rejected alternatives, or per-phase summary; split it only when that makes the plan easier to understand. For new features, show the proposed signatures of key functions and interfaces, and the props and events contracts of key components.
2. Planning does not authorize implementation. Wait for explicit approval such as "implement" or "let's start".
3. Before each task, identify its layer and single responsibility, search for an existing util/service/type, and state the test name. Split tasks that span multiple layers.
4. Write tests first, implement production code, then run `pnpm test:unit`. Configuration, documentation, type-only changes, and exploratory spikes may skip test-first when they have no branching behavior.
5. Review the result for YAGNI violations, over-abstraction, and missing tests.

Before adding a function, search `src/lib/utils/`, `src/lib/services/`, `src/features/*/utils/`, and `src/features/*/services/`. Extract shared logic when it is used in two or more places.

## Architecture

SvelteKit 2 + Svelte 5 Runes + TypeScript | PostgreSQL + Prisma | Flowbite Svelte + Tailwind 4 | Vitest + Playwright | oxlint + ESLint

| Layer            | Location                                        | Rule                                      |
| ---------------- | ----------------------------------------------- | ----------------------------------------- |
| Prisma           | `prisma/`                                       | Keep applied migrations immutable         |
| Server           | `src/lib/server/`, `src/features/*/server/`     | Never import into client code             |
| Zod              | `src/**/zod/`                                   | Validate at system boundaries             |
| Types / fixtures | `src/**/types/`, `src/**/fixtures/`             | Keep domain-scoped assets with the domain |
| Services         | `src/lib/services/`, `src/features/*/services/` | Framework-agnostic business logic         |
| Utils            | `src/lib/utils/`, `src/features/*/utils/`       | Pure functions with adjacent tests        |
| Stores           | `src/**/stores/`                                | Svelte runes in `.svelte.ts`              |
| Routes           | `src/routes/`                                   | Thin HTTP and navigation boundary         |
| Components       | `src/**/*.svelte`                               | Svelte 5 Runes; move business logic out   |

- Put code used by one domain in `src/features/{feature}/`; put code shared by two or more domains in `src/lib/`.
- Feature-to-feature imports are not allowed. Move shared code to `src/lib/`.
- Route-local `_components/`, `_types/`, `_fixtures/`, and `_utils/` are exceptions for an admin page whose code is tightly coupled to that route's authorization or layout.
- Services return data or `null`; they never call `error()`, `redirect()`, or return HTTP responses. Routes translate service results into HTTP behavior.
- Route handlers do not import Prisma directly.
- Use `$props()`, `$state()`, and `$derived()` in new Svelte components.
- Load server data in `+page.server.ts` and consume it through the `data` prop.
- Use Superforms with Zod for forms.

See `docs/guides/architecture.md` for detailed placement rules.

## Path-specific Rules

Before planning or changing a matching path, read the corresponding document under `docs/guides/agent-rules/`.

| Path                                 | Rules                                                         |
| ------------------------------------ | ------------------------------------------------------------- |
| All source and plans                 | `coding-style.md`                                             |
| `prisma/**`, server and service code | `prisma-db.md`                                                |
| `**/*.test.ts`, `src/test/**`        | `testing.md`                                                  |
| `**/*.spec.ts`, `e2e/**`             | `testing-e2e.md`                                              |
| Svelte components and stores         | `svelte-components.md`, `svelte-runes.md`, `accessibility.md` |
| SvelteKit routes                     | `sveltekit.md`                                                |
| Authentication and admin paths       | `auth.md`                                                     |
| Server cache modules                 | `server-cache.md`                                             |
| `.github/workflows/**`               | `github-actions.md`                                           |

Use project-specific workflows from `.agents/skills/` when a task matches a skill description.

## Testing

- Co-locate feature and utility tests with their source. Existing shared tests may remain in `src/test/`; E2E tests live in `e2e/`.
- Mock the DB in service tests with `vi.mock('$lib/server/database', ...)`.
- Use `@quramy/prisma-fabbrica` only in `prisma/seed.ts`, not service unit tests.
- Use Nock for HTTP mocking.
- Use realistic fixtures and literal expected values; never compute expectations with the code under test.

## Commands

```bash
pnpm dev
pnpm build
pnpm test
pnpm test:unit
pnpm test:e2e
pnpm coverage
pnpm lint
pnpm format
pnpm check
pnpm exec prisma generate
pnpm exec prisma migrate dev --name <description>
pnpm db:seed
```

Lefthook runs Prettier, oxlint for JS/TS, and ESLint for Svelte before commit.

## Verification and Cross-review Before a PR

Every PR must pass the CI build, lint, type/Svelte check, and unit test jobs. Before handing work off, run `pnpm format`, `pnpm lint`, `pnpm check`, relevant tests, and `git diff --check`.

Cross-review is required for AI-led non-trivial changes when any of these apply:

- 30 or more hand-edited source, test, or configuration files
- Authentication, authorization, or secret handling changes
- DB schema, migrations, or data transformations
- Shared architecture or public interface changes

Exclude typo-only, formatting-only, generated, lockfile, snapshot, and other trivial changes from the file count. AI review is optional for changes outside these conditions because the mechanical gate still applies. Codex-led work is reviewed with Claude; Claude-led work is reviewed with Codex. If the other agent is unavailable, use `coderabbit review --plain`. Do not fix review findings without the user's selection; prioritize Critical/Severe findings when recording them in a plan.

## References

- `package.json`: dependency versions and scripts
- `prisma/schema.prisma`: database models
- `docs/guides/`: detailed project guides
