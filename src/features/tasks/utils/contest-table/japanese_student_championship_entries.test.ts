import { describe, test, expect } from 'vitest';

import { tasks } from '../../../../../prisma/tasks';
import { contest_task_pairs } from '../../../../../prisma/contest_task_pairs';

import { JAPANESE_STUDENT_CHAMPIONSHIP_ENTRIES } from './japanese_student_championship_entries';

// JSC contests only: qualifiers held as ABC / ARC rounds share their contest ids with regular rounds.
const SERIES_CONTEST_ID_PATTERN = /^jsc\d{4}/;

describe('JAPANESE_STUDENT_CHAMPIONSHIP_ENTRIES', () => {
  const entryContestIds = JAPANESE_STUDENT_CHAMPIONSHIP_ENTRIES.map((entry) => entry.contestId);
  // jsc2021ex and jsc2025advance-final reuse ABC problems, so they exist only as contest task pairs.
  const countProblems = (contestId: string) =>
    tasks.filter((task) => task.contest_id === contestId).length +
    contest_task_pairs.filter((pair) => pair.contest_id === contestId).length;

  test('lists every jsc contest in the seed exactly once', () => {
    const seedContestIds = new Set([
      ...tasks.map((task) => task.contest_id),
      ...contest_task_pairs.map((pair) => pair.contest_id),
    ]);
    const seriesSeedContestIds = [...seedContestIds].filter((contestId) =>
      SERIES_CONTEST_ID_PATTERN.test(contestId),
    );
    const seriesEntryContestIds = entryContestIds.filter((contestId) =>
      SERIES_CONTEST_ID_PATTERN.test(contestId),
    );

    expect(seriesEntryContestIds.toSorted()).toEqual(seriesSeedContestIds.toSorted());
  });

  test('seeds every problem of each entry, matching the maintainer spreadsheet', () => {
    const problemCounts = Object.fromEntries(
      entryContestIds.map((contestId) => [contestId, countProblems(contestId)]),
    );

    expect(problemCounts).toEqual({
      'jsc2026-final': 7,
      arc222: 6,
      'jsc2025advance-final': 7,
      'jsc2025-final': 6,
      arc201: 6,
      'jsc2024-final': 6,
      arc180: 6,
      'jsc2023-final': 7,
      abc313: 8,
      'jsc2022-final-open': 7,
      abc262: 8,
      jsc2021ex: 12,
      jsc2021: 8,
      'jsc2019-final': 8,
      'jsc2019-qual': 6,
    });
  });

  test('maps each letter of jsc2021ex to the ABC problem it reused, matching the maintainer spreadsheet', () => {
    const problemIdByLetter = Object.fromEntries(
      contest_task_pairs
        .filter((pair) => pair.contest_id === 'jsc2021ex')
        .map((pair) => [pair.problem_index, pair.problem_id]),
    );

    expect(problemIdByLetter).toEqual({
      A: 'abc152_b',
      B: 'abc167_b',
      C: 'abc188_b',
      D: 'abc174_b',
      E: 'abc181_c',
      F: 'abc155_c',
      G: 'abc159_c',
      H: 'abc182_c',
      I: 'abc150_d',
      J: 'abc162_d',
      K: 'abc180_d',
      L: 'abc167_d',
    });
  });

  // The seed skips a pair whose task is missing, so a missing ABC problem would only log a warning.
  test('seeds the original task of every contest task pair in the group', () => {
    const seedTaskIds = new Set(tasks.map((task) => task.id));
    const pairsWithoutTask = contest_task_pairs
      .filter((pair) => entryContestIds.includes(pair.contest_id))
      .filter((pair) => !seedTaskIds.has(pair.problem_id));

    expect(pairsWithoutTask).toEqual([]);
  });
});
