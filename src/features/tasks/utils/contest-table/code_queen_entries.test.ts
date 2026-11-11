import { describe, test, expect } from 'vitest';

import { tasks } from '../../../../../prisma/tasks';

import { CODE_QUEEN_ENTRIES } from './code_queen_entries';

// Finals only: qualifiers held as ABC rounds share their contest ids with regular ABCs.
const SERIES_CONTEST_ID_PATTERN = /^codequeen\d{4}/;

describe('CODE_QUEEN_ENTRIES', () => {
  const entryContestIds = CODE_QUEEN_ENTRIES.map((entry) => entry.contestId);

  test('lists every codequeen contest in the seed exactly once', () => {
    const seriesSeedContestIds = [...new Set(tasks.map((task) => task.contest_id))].filter(
      (contestId) => SERIES_CONTEST_ID_PATTERN.test(contestId),
    );
    const seriesEntryContestIds = entryContestIds.filter((contestId) =>
      SERIES_CONTEST_ID_PATTERN.test(contestId),
    );

    expect(seriesEntryContestIds.toSorted()).toEqual(seriesSeedContestIds.toSorted());
  });

  // AtCoder Problems lists problems reused in ADT under adt_* letters, so pin the original ones.
  test('seeds every problem of each entry by its letter, matching the maintainer spreadsheet', () => {
    const lettersByContestId = Object.fromEntries(
      entryContestIds.map((contestId) => [
        contestId,
        tasks
          .filter((task) => task.contest_id === contestId)
          .map((task) => task.problem_index)
          .toSorted(),
      ]),
    );

    expect(lettersByContestId).toEqual({
      'codequeen2026-final-Public': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      abc462: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      'codequeen2025-final-Public': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      abc410: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      'codequeen2024-final-N9tn8QqD': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      abc358: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      'codequeen2023-final-open': ['A', 'B', 'C', 'D', 'E', 'F'],
      abc308: ['A', 'B', 'C', 'D', 'E', 'Ex', 'F', 'G'],
    });
  });
});
