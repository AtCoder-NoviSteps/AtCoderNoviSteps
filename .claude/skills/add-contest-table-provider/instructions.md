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
  - Pattern 4: one class instantiated N times via constructor parameter (e.g. ICPC by year)
- Nearest neighbor ContestType for insertion order in `contestTypePriorities`?
- New group or merge into existing? If new: group name / `buttonLabel` / `ariaLabel`?

**Pattern 1:** For AWC, use config-driven `AWCRangeProvider` (skip Layer 4; instantiate in Layer 5 only. See `awc_provider.ts`). Otherwise confirm range, shared problems, and round label format.

**Pattern 2:** For AWC special rounds, use config-driven `AWCSpecialContestProvider` (same as above).

**Pattern 3:** Show the contest_id list from `prisma/tasks.ts`. Confirm `contest_task_pairs.ts` update needed, index format (numeric/alphabetic), section splits.

**Pattern 4:** Confirm parameter name/type, range (oldest/latest), whether index is numeric string, display label transformation needed, known edge cases.

---

## Layers 1–2 — Add ContestType

> Skip when an existing ContestType already covers this contest family (e.g. `AOJ_JAG` for JAG Prelim).

- [ ] Add to `prisma/schema.prisma` ContestType enum → `pnpm exec prisma generate`
- [ ] Add to `ContestType` in `src/lib/contests/types/contest.ts` (same position as schema)
- [ ] `pnpm check` — confirm error resolved

## Layer 3 — Contest utilities (TDD)

### Tests first

- [ ] Add exports to `src/lib/contests/fixtures/contest_type.ts` and `contest_name_labels.ts`
- [ ] Add `describe` block to `src/lib/contests/utils/classification.test.ts` (classify)
- [ ] Add `describe` block to `src/lib/contests/utils/priority.test.ts` (priority)
- [ ] Add `describe` block to `src/lib/contests/utils/labels/index.test.ts` (name label)
- [ ] `pnpm test:unit src/lib/contests/` — **RED**

### Implement

- [ ] `CONTEST_TYPES_BY_ID` or `CLASSIFICATION_RULES` in `src/lib/contests/utils/classification.ts`
- [ ] `contestTypePriorities` in `src/lib/contests/utils/priority.ts`
  - After priority insertion, all later entries shift +1 → **update JSDoc numeric ranges** (4 category names are immutable)
  - Fix hardcoded priority-diff expected values in `src/test/lib/utils/task.test.ts` (-1 per shifted entry)
- [ ] `LABEL_GENERATORS` in `src/lib/contests/utils/labels/index.ts` (add label generator, create per-type file if complex)
- [ ] **GREEN**

---

## Layer 4 — Provider class (TDD)

### Pattern 1: range filter

- [ ] Tests: boundary values + mid-range. If shared problems exist, verify exclusion with mixed contest_ids. If splitting a range, verify adjacent range exclusion with `[...fixtureA, ...fixtureB]`
- [ ] **RED** → implement with `parseContestRound()` range check → **GREEN**

### Pattern 2: single source

- [ ] Tests: add entry to `describe.each`
- [ ] **RED** → implement Provider class → **GREEN**

### Pattern 3: composite

- [ ] Check whether `prisma/contest_task_pairs.ts` needs updates first
- [ ] Tests: each contest_id + mixed-source. If section splits, one test per section
- [ ] **RED** → implement with `classifyContest` equality filter → **GREEN**

### Pattern 4: constructor parameter

- [ ] Export `OLDEST_YEAR` / `LATEST_YEAR` constants. Use `super(contestType, String(param))` for unique provider key
- [ ] Tests: `getSize() === LATEST - OLDEST + 1`, etc.
- [ ] **RED** → implement → **GREEN**
- [ ] If display label needed: use `getTaskLabels` — do NOT mutate title inside `generateTable` (optimistic update + `$derived` re-run causes prefix accumulation)
- [ ] For AOJ-specific options (`getTaskLabels` / override map / `titleStyle` / `columnWrapThreshold`), see `aoj_icpc_providers.ts` / `aoj_jag_providers.ts`

---

## Layer 5 — Group registration (TDD)

- [ ] `contest_table_provider_groups.test.ts`: add group name, `buttonLabel`, `ariaLabel`, `getSize()`, `getProvider()` assertions; for section-based providers use `getProvider(ContestType.XXX, 'section')`
- [ ] **RED**
- [ ] `contest_table_provider_groups.ts`: add import + `addProvider()` (**call order = display order; first = top**)
- [ ] `pnpm test:unit src/features/tasks/utils/contest-table/` — **GREEN**

---

## Final verification

- [ ] `pnpm test:unit` / `pnpm check` / `pnpm lint`

Commit Layer 1–3 and Layer 4–5 as separate commits.
