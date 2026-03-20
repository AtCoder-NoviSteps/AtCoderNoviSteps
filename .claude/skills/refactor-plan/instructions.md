# Refactoring Investigation Checklist

Scan the target code in this order (lowest risk first). List every concrete finding — do not skip ambiguous cases.

## 1. Naming and Style

- Abbreviated/single-character names (`res`, `btn`, etc.) → expand to full names
- Single-statement `if` without braces → add braces
- Hardcoded string literals matching enum values → replace with enum constants
- `toBeTruthy()` / `toBeFalsy()` in tests → replace with `toBe(true)` / `toBe(false)`

## 2. Type Definitions

- `Hoge[]` in signatures → define a plural type alias
- Inline union literals repeated in multiple places → extract to a named type
- Function argument types broader than needed → narrow to minimum fields used

## 3. Pure Function Extraction

- Side effects mixed with business logic → extract logic as a pure function to `utils/` (use `_utils/` inside `src/routes/`; same rule applies below)
- Extracted `utils/` functions with no adjacent tests → add tests at extraction time

## 4. Component Bloat

- Static constants inside `<script>` → move to `utils/`
- Transformation/calculation logic inside `<script>` → move to `utils/`
- `if (activeTab === '...')` branching → replace with `Record<EnumKey, Config>`
- Snippet vs. component cases → apply `.claude/rules/svelte-components.md` criteria

## 5. Service Layer Structure

- DB query + business logic + DB write in one function → split by responsibility
- Route handlers or `seed.ts` calling Prisma directly → delegate to service layer
- Service functions returning `Response` or `json()` → change to `{ error: string } | null`

## 6. Test Coverage

- Abstract test data (`'t1'`, `'t2'`) → replace with real fixture values
- Test data duplicated across cases → extract to a fixture file
- Repeated `vi.mocked(...).mockResolvedValue(...)` patterns → extract to a helper
- `utils/` functions with no adjacent tests → add tests

## 7. Documentation (always last)

- New patterns not yet in `.claude/rules/` → note which rule file to update
- Record key decisions in dev-note; discard completed plans after the session

---

## Phase Design Principles

- Order phases by risk: isolated mechanical changes first, structural changes last
- State inter-phase dependencies explicitly
- For uncertain changes, add an **investigation sub-step** before the implementation task
- Each task must have single responsibility — verify it touches exactly one layer (prisma / server / zod / types / fixtures / services / utils / stores / routes / components)
- "Implementation + test + commit" should fit within one task; if not, split further

## When to Skip Tests

Skip unit tests when:

- The function has no logic (e.g., `if (!res.ok) throw`)
- The target is `seed.ts` (integration-level scope)
- Testing requires mocking the entire framework (auth redirects, DnD events)

Note "covered by E2E" or "no testable logic" next to these tasks.
