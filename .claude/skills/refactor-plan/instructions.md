# Refactoring Investigation Checklist

Scan the target code for the following problems in this order (lowest risk first).
For each category, list every concrete finding — do not skip ambiguous cases.

## 1. Naming and Style

- Abbreviated or single-character names (`res`, `r`, `btn`, etc.) → expand to full names
- Single-statement `if` without braces → add braces
- Hardcoded string literals that correspond to enum values → replace with enum constants
- `toBeTruthy()` / `toBeFalsy()` in tests → replace with `toBe(true)` / `toBe(false)`

## 2. Type Definitions

- `Hoge[]` used directly in signatures → define a plural type alias
- Inline union literals (`'solutionCategory' | 'taskGrade'`) repeated in multiple places → extract to a named type
- Function argument types broader than needed → narrow to the minimum fields actually used

## 3. Pure Function Extraction

- Side effects (URL manipulation, fetch, DB access) mixed with business logic in a single function → extract the logic as a pure function to `_utils/`
- Functions extracted to `_utils/` that have no adjacent tests → add tests at extraction time

## 4. Component Bloat

- Static configuration constants inside `<script>` → move to `_utils/` constants
- Transformation or calculation logic inside `<script>` → move to `_utils/` pure functions
- `if (activeTab === '...')` branching that could be replaced by `Record<EnumKey, Config>` → refactor
- Ambiguous snippet vs. component cases → apply the judgment criteria in `.claude/rules/svelte-components.md`

## 5. Service Layer Structure

- DB query + business logic + DB write mixed in one function → split by responsibility
- Route handlers or `seed.ts` calling Prisma directly → delegate to the service layer
- Service functions returning `Response` or `json()` → change to `{ error: string } | null`

## 6. Test Coverage

- Abstract test data (`'t1'`, `'t2'`) → replace with real fixture values
- Test data duplicated across multiple test cases → extract to a fixture file
- Repeated `vi.mocked(...).mockResolvedValue(...)` patterns → extract to a helper function in the test file
- `_utils/` functions with no adjacent tests → add tests

## 7. Documentation (always last)

- New patterns found above that are not yet in `.claude/rules/` → note which rule file to update
- Record key decisions and gotchas for the dev-note; discard completed plans after the session

---

## Phase Design Principles

- Order phases by risk: isolated mechanical changes first, structural changes last
- State inter-phase dependencies explicitly (e.g., "Phase 3 depends on Phase 2 type definitions")
- For uncertain changes, add an **investigation sub-step** before the implementation task

## When to Skip Tests

Do not add unit tests when:

- The function has no logic — only a single side effect (e.g., `if (!res.ok) throw`)
- The target is `seed.ts` — treat it as integration-level, not unit-test scope
- The only way to test it is to mock the entire framework (auth redirects, DnD mouse events)

In these cases, note "covered by E2E" or "no testable logic" next to the task.
