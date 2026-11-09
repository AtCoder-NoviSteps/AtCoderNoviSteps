import { describe, test, expect } from 'vitest';

import { isWorldTourFinals } from '#lib/contests/index.js';

import { tasks } from '../../../../../prisma/tasks';

import { ATCODER_WORLD_TOUR_FINALS_ENTRIES } from './atcoder_world_tour_finals_entries';

describe('ATCODER_WORLD_TOUR_FINALS_ENTRIES', () => {
  const entryContestIds = ATCODER_WORLD_TOUR_FINALS_ENTRIES.map((entry) => entry.contestId);

  test('lists every World Tour Finals contest in the seed exactly once', () => {
    const seedContestIds = new Set(tasks.map((task) => task.contest_id));
    const worldTourFinalsSeedContestIds = [...seedContestIds].filter((contestId) =>
      isWorldTourFinals(contestId),
    );

    expect(entryContestIds.toSorted()).toEqual(worldTourFinalsSeedContestIds.toSorted());
  });

  test('seeds every problem of each entry, matching the maintainer spreadsheet', () => {
    const problemCounts = Object.fromEntries(
      entryContestIds.map((contestId) => [
        contestId,
        tasks.filter((task) => task.contest_id === contestId).length,
      ]),
    );

    expect(problemCounts).toEqual({
      awtf2026algo: 5,
      'awtf2025algo-open': 5,
      'awtf2024-open': 5,
      'wtf22-day2': 5,
      'wtf22-day1-open': 5,
      'wtf19-open': 6,
    });
  });

  test('titles each table with its contest name label', () => {
    expect(ATCODER_WORLD_TOUR_FINALS_ENTRIES.map((entry) => entry.title)).toEqual([
      'World Tour Finals 2026 Algorithm',
      'World Tour Finals 2025 Algorithm',
      'World Tour Finals 2024',
      'World Tour Finals 2022 Day2',
      'World Tour Finals 2022 Day1',
      'World Tour Finals 2019',
    ]);
  });
});
