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
});
