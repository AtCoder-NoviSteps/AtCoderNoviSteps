# Add Contest Table Provider — Implementation Checklist

Reference: `docs/guides/how-to-add-contest-table-provider.md`

---

## Requirements gathering

Step 0 (seed check) is already done. Confirm the following before touching code:

**All patterns:**

- Which pattern? (State your inference from the data, ask to confirm)
  - Pattern 1: numeric range filter (e.g. ABC 001–041)
  - Pattern 2: single fixed contest_id (e.g. NDPC, TDPC, FPS_24)
  - Pattern 3: multiple contest_ids unified in one table (e.g. ABS, ABC-Like)
  - Pattern 4: one class instantiated N times via constructor parameter (e.g. ICPC Prelim by year)
- Nearest neighbor ContestType for insertion order in `contestTypePriorities`?
- New group or merge into existing? If new: group name / `buttonLabel` / `ariaLabel`?

**Pattern 1 additional:**

- Numeric range: start and end (open-ended if no upper bound)?
- Shared problems with another contest (e.g. ARC–ABC overlap)? Which contest_ids appear in both?
- Round label format (e.g. `ABC 042`)?

**Pattern 4 additional:**

- Constructor parameter name and type (e.g. `year: number`)?
- Year/ID range: oldest and latest? Export both as named constants so tests can reference them.
- Iteration order: latest-first so newest table renders on top.
- `task_table_index` values numeric strings? → override `getHeaderIdsForTask`; sort with `Number(a) - Number(b)`.
- Display-only title transform needed (e.g. prepend letter)? → override `generateTable` for the transform AND override `getHeaderIdsForTask` using the same key derivation; mismatched keys between the two methods cause missing cells.
- Known edge cases where the default algorithm breaks? → add a `Record<string, Record<string, string>>` module-level override map keyed by contest_id; exercise the override path in tests by mutating the export in `beforeEach` and cleaning up in `afterEach`.

**Pattern 3 additional:**

- Show the full contest_id list found in `prisma/tasks.ts` — any missing or to exclude?
- Does `prisma/contest_task_pairs.ts` need updating (shared task_ids across contests)?
- task_table_index format: numeric (`001–`) or alphabetic (`A–`)?
- Section splits needed? If yes: split key and section names?

---

## Layer 1 — Prisma schema

- [ ] Add `XXX // Full Contest Name` to `prisma/schema.prisma` ContestType enum (after nearest neighbor)
- [ ] `pnpm exec prisma generate` — non-interactive env; `migrate dev` requires interactive shell
- [ ] `pnpm check` — expect a type error in `src/lib/types/contest.ts` (confirms client regenerated)

## Layer 2 — TypeScript ContestType constant

- [ ] Add `XXX: 'XXX', // Full Contest Name` to `ContestType` in `src/lib/types/contest.ts` (same position as schema)
- [ ] `pnpm check` — error should be gone

## Layer 3 — Contest utilities (TDD)

### Write tests first

- [ ] Add export to `src/test/lib/utils/test_cases/contest_type.ts` (after nearest neighbor)
- [ ] Add export to `src/test/lib/utils/test_cases/contest_name_labels.ts` (after nearest neighbor)
- [ ] Add three `describe('when contest_id is xxx')` blocks to `src/test/lib/utils/contest.test.ts`:
  - under `classify contest`
  - under `get contest priority`
  - under `get contest name label`
- [ ] `pnpm test:unit src/test/lib/utils/contest.test.ts` — **expect RED**

### Implement

- [ ] Add `classifyContest` branch after nearest neighbor's branch in `src/lib/utils/contest.ts`
- [ ] Insert `[ContestType.XXX, N]` into `contestTypePriorities` after nearest neighbor
  - All entries after the insertion point shift by +1
  - **Update the JSDoc numeric ranges** — do NOT rename or split the existing four categories
    (Educational / Contests for genius / Special contests / External platforms)
  - **Search `src/test/lib/utils/task.test.ts` for hardcoded priority-diff expected values**
    and decrement by 1 for every ContestType that shifted
- [ ] Add `getContestNameLabel` branch after nearest neighbor's branch
- [ ] `pnpm test:unit src/test/lib/utils/contest.test.ts` — **expect GREEN**

---

## Layer 4 — Provider class (TDD)

### Pattern 2: single source

- [ ] Add entry to `describe.each` array in `dp_providers.test.ts` (or the appropriate `*_providers.test.ts`)
- [ ] Add import of new Provider class
- [ ] `pnpm test:unit <providers.test.ts>` — **expect RED**
- [ ] Implement Provider class in the appropriate `*_providers.ts` after nearest neighbor
- [ ] `pnpm test:unit <providers.test.ts>` — **expect GREEN**

### Pattern 1: range filter

- [ ] Add test cases covering range boundaries and at least one mid-range value
- [ ] If shared problems exist: add a test case with mixed contest_ids to confirm exclusion
- [ ] `pnpm test:unit <providers.test.ts>` — **expect RED**
- [ ] Implement Provider using `parseContestRound()` range check
- [ ] `pnpm test:unit <providers.test.ts>` — **expect GREEN**

### Pattern 4: N-instances via constructor parameter

- [ ] Export `OLDEST_YEAR` / `LATEST_YEAR` constants (module-level, before `prepareContestProviderPresets`) so tests can assert `getSize() === LATEST - OLDEST + 1`
- [ ] Pass the parameter as `section` in `super(contestType, String(param))` → provider key becomes `TYPE::value` (unique per instance)
- [ ] If `generateTable` is overridden to key the table by `task_table_index` directly: also override `getHeaderIdsForTask` using the same field and sort order
- [ ] If display title needs transformation (e.g. prepend "A. "): do it inside `generateTable`; DB data must remain unchanged
- [ ] Write override map (`Record<string, Record<string, value>>`) for known edge cases; test the override path by mutating the export in `beforeEach` and cleaning up in `afterEach`
- [ ] If provider headings need non-default font/weight/gap: return `titleStyle` (`headingTag` / `fontSize` / `fontWeight` / `bottomGap`) from `getMetadata()`; include all set fields in the `titleStyle` assertion
- [ ] `pnpm test:unit <providers.test.ts>` — **expect GREEN**

### Pattern 3: composite

- [ ] Confirm whether `prisma/contest_task_pairs.ts` needs new entries before writing tests
- [ ] Add test cases for each constituent contest_id, plus a mixed-source test
- [ ] If section splits: add one test per section
- [ ] `pnpm test:unit <providers.test.ts>` — **expect RED**
- [ ] Implement Provider (filter by `classifyContest` equality; add section subclasses if needed)
- [ ] `pnpm test:unit <providers.test.ts>` — **expect GREEN**

---

## Layer 5 — Group registration (TDD)

- [ ] Update `contest_table_provider_groups.test.ts`:
  - New group name string, `buttonLabel`, `ariaLabel` (add `mainTitle` if used)
  - `getSize()` incremented to reflect the new provider count
  - Add `getProvider(ContestType.XXX)` assertion
  - Add import of new Provider class
- [ ] `pnpm test:unit contest_table_provider_groups.test.ts` — **expect RED**
- [ ] Update `contest_table_provider_groups.ts`:
  - Add import of new Provider class
  - Update group name string, `buttonLabel`, `ariaLabel`
  - Add `mainTitle: 'XXX'` if the group needs a single h2 heading rendered above all providers (opt-in; omit when not needed)
  - Add `new XXXProvider(ContestType.XXX)` to `addProviders()`
- [ ] `pnpm test:unit src/features/tasks/utils/contest-table/` — **expect GREEN**

---

## Final verification

- [ ] `pnpm test:unit`
- [ ] `pnpm check`
- [ ] `pnpm lint`

Commit Layer 1–3 and Layer 4–5 as separate commits.
