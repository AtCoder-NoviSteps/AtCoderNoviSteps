import { describe, test, expect } from 'vitest';

import { tasks } from '../../../../../prisma/tasks';

import { ATCODER_JAPAN_CHAMPIONSHIP_ENTRIES } from './atcoder_japan_championship_entries';

// Finals and NIKKEI contests only: qualifiers held as ARC rounds share their contest ids with regular ARCs.
const SERIES_CONTEST_ID_PATTERN = /^(ajo\d{4}|nikkei2019)/;

describe('ATCODER_JAPAN_CHAMPIONSHIP_ENTRIES', () => {
  const seedContestIds = new Set(tasks.map((task) => task.contest_id));
  const entryContestIds = ATCODER_JAPAN_CHAMPIONSHIP_ENTRIES.map((entry) => entry.contestId);

  test('lists every ajo and nikkei2019 contest in the seed exactly once', () => {
    const seriesSeedContestIds = [...seedContestIds].filter((contestId) =>
      SERIES_CONTEST_ID_PATTERN.test(contestId),
    );
    const seriesEntryContestIds = entryContestIds.filter((contestId) =>
      SERIES_CONTEST_ID_PATTERN.test(contestId),
    );

    expect(seriesEntryContestIds.toSorted()).toEqual(seriesSeedContestIds.toSorted());
  });

  test('has tasks in the seed for every entry', () => {
    expect(entryContestIds.filter((contestId) => !seedContestIds.has(contestId))).toEqual([]);
  });

  test('seeds every problem of each entry, matching the maintainer spreadsheet', () => {
    const problemCounts = Object.fromEntries(
      entryContestIds.map((contestId) => [
        contestId,
        tasks.filter((task) => task.contest_id === contestId).length,
      ]),
    );

    expect(problemCounts).toEqual({
      arc232: 5,
      'ajo2025-final-open': 5,
      arc207: 5,
      'ajo2024-final': 6,
      arc186: 5,
      'nikkei2019-2-final': 8,
      'nikkei2019-2-qual': 6,
      'nikkei2019-ex': 8,
      'nikkei2019-final': 8,
      'nikkei2019-qual': 6,
    });
  });

  // On AtCoder, these two task ids carry each other's letters.
  test('keeps the letters of nikkei2019ex_e (F) and nikkei2019ex_f (E) as AtCoder lists them', () => {
    const letterByTaskId = new Map(tasks.map((task) => [task.id, task.problem_index]));

    expect(letterByTaskId.get('nikkei2019ex_e')).toBe('F');
    expect(letterByTaskId.get('nikkei2019ex_f')).toBe('E');
  });
});
