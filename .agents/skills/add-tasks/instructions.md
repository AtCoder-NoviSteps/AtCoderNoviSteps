# Add Tasks — Checklist

---

## Classify

- Groups in `src/lib/contests/utils/prefixes.ts` match differently:
  - `ABC_LIKE` / `ARC_LIKE`: exact match — a sequel (e.g. `diverta2019-2` next to `diverta2019`) needs its own key
  - `AGC_LIKE` / `ATCODER_UNIVERSITIES` / `ATCODER_OTHERS`: prefix match — check an existing key does not already swallow the new id with the wrong type
  - `ATCODER_MAIN_OFFICIAL_ONSITE`: exact match for onsite finals other than World Tour Finals, which `isWorldTourFinals` (`labels/world_tour_finals.ts`) matches by regex
  - AOJ: regex (`regexForJag`, `regexForAojUniversity`) — no map edit if the id already matches; otherwise widening the regex also affects `getContestNameLabel` and `AojGenerator.canHandle`, so switch to `add-contest-table-provider`
- `classifyContest` checks the exact-match `CONTEST_TYPES_BY_ID` first, then first-match-wins `CLASSIFICATION_RULES`; confirm no earlier rule (`abc\d{3}`, `past`, `joi`, ...) catches the id. If it already returns the intended type (e.g. adding tasks to `typical90`), skip the `prefixes.ts` edit
- Use the official contest name; Japanese if one exists

## Collect rows

- Source: `https://kenkoooo.com/atcoder/resources/problems.json`. atcoder.jp is unreachable and WebFetch truncates problems.json, so a miss there is not evidence of absence — ask the user to paste the rows
- Save pasted rows as JSON next to the plan so a later session can use them; before generating, check the problem count per contest, unique `id`s, and (AtCoder) `title` = `{problem_index}. {name}`; delete the JSON in the seed commit
- Use `id` / `problem_index` / `name` / `title` verbatim; do not derive `id` from contest_id
- AOJ ICPC and every AOJ JAG contest (Prelim, Regional, training camps): set `problem_index` to the problem letter, not the AOJ problem id — A, B, C... in ascending problem id within the contest, as `assignProblemLetters` does on import. When a problem before the last one is missing from AOJ, take the letters from the maintainer's problem list and add the contest to `LETTERS_OF_SHIFTED_CONTESTS`. Keep `title` plain, without a `<problem id>. ` prefix. `seed_problem_letters.test.ts` checks both
- A problem the maintainer's list has but AOJ lacks (even a trailing one): add it with `id` `NoJudge-{contest_id}_{lowercase letter}`, register its jag-icpc.org page in `NO_JUDGE_PAGES` (`src/lib/contests/utils/no_judge.ts`), and add the contest to `LETTERS_OF_SHIFTED_CONTESTS` — `Number()` cannot sort these ids. This is the exception to "do not derive `id` from contest_id". A problem that exists on AOJ but is missing from the contest list keeps its AOJ problem id
- `addContestNameToTaskIndex` takes `taskId` (required); `contest_name_and_task_index.ts` cases set it only for NoJudge

## Tests

Add cases to the fixtures the contest type exercises (all under `src/lib/contests/fixtures/` unless noted):

- [ ] `contest_type.ts` — always
- [ ] `contest_name_labels.ts` — when the type has a label generator (OTHERS, UNIVERSITY, ATCODER_MAIN_OFFICIAL_ONSITE, AOJ\_\*); ABC_LIKE / ARC_LIKE fall back to the uppercased id, so skip
- [ ] `contest_name_and_task_index.ts` — AOJ types
- [ ] `src/test/lib/utils/test_cases/task_url.ts` — AOJ types
- [ ] `pnpm test:unit src/lib/contests/` — **RED**

## Insert

- [ ] Place rows after the existing block of the same group in `prisma/tasks.ts`
- [ ] Contests newest first; tasks within a contest in descending index (F → A)
- [ ] For more than a few rows, generate the entries with a script instead of hand-typing
- [ ] `grep -c` the new ids to confirm the count
