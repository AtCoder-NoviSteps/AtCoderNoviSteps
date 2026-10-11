# Add Tasks — Checklist

---

## Classify

- Groups in `src/lib/contests/utils/prefixes.ts` match differently:
  - `ABC_LIKE` / `ARC_LIKE`: exact match — a sequel (e.g. `diverta2019-2` next to `diverta2019`) needs its own key
  - `AGC_LIKE` / `ATCODER_UNIVERSITIES` / `ATCODER_OTHERS`: prefix match — check an existing key does not already swallow the new id with the wrong type
  - AOJ: regex (`regexForJag`, `regexForAojUniversity`) — no map edit if the id already matches; otherwise widening the regex also affects `getContestNameLabel` and `AojGenerator.canHandle`, so switch to `add-contest-table-provider`
- `classifyContest` checks the exact-match `CONTEST_TYPES_BY_ID` first, then first-match-wins `CLASSIFICATION_RULES`; confirm no earlier rule (`abc\d{3}`, `past`, `joi`, ...) catches the id. If it already returns the intended type (e.g. adding tasks to `typical90`), skip the `prefixes.ts` edit
- Use the official contest name; Japanese if one exists

## Collect rows

- Source: `https://kenkoooo.com/atcoder/resources/problems.json`
- atcoder.jp is unreachable and WebFetch truncates problems.json, so a miss there is not evidence of absence — ask the user to paste the rows
- Use `id` / `problem_index` / `name` / `title` verbatim; do not derive `id` from contest_id

## Tests

Add cases to the fixtures the contest type exercises (all under `src/lib/contests/fixtures/` unless noted):

- [ ] `contest_type.ts` — always
- [ ] `contest_name_labels.ts` — when the type has a label generator (OTHERS, UNIVERSITY, AOJ\_\*); ABC_LIKE / ARC_LIKE fall back to the uppercased id, so skip
- [ ] `contest_name_and_task_index.ts` — AOJ types
- [ ] `src/test/lib/utils/test_cases/task_url.ts` — AOJ types
- [ ] `pnpm test:unit src/lib/contests/` — **RED**

## Insert

- [ ] Place rows after the existing block of the same group in `prisma/tasks.ts`
- [ ] Contests newest first; tasks within a contest in descending index (F → A)
- [ ] For more than a few rows, generate the entries with a script instead of hand-typing
- [ ] `grep -c` the new ids to confirm the count
