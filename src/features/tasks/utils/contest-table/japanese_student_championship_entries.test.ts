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
      'jsc2026advance-final': 7,
      abc464: 7,
      'jsc2026-final': 7,
      arc222: 6,
      'jsc2025advance-final': 7,
      abc412: 7,
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

  test.each([
    {
      contestId: 'jsc2025advance-final',
      expected: {
        A: 'abc422_a',
        B: 'abc422_b',
        C: 'abc422_c',
        D: 'abc422_d',
        E: 'abc422_e',
        F: 'abc422_f',
        G: 'abc422_g',
      },
    },
    {
      contestId: 'jsc2026advance-final',
      expected: {
        A: 'abc474_a',
        B: 'abc474_b',
        C: 'abc474_c',
        D: 'abc474_d',
        E: 'abc474_e',
        F: 'abc474_f',
        G: 'abc474_g',
      },
    },
  ])(
    'maps each letter of $contestId to the same letter of the ABC it reused',
    ({ contestId, expected }) => {
      const problemIdByLetter = Object.fromEntries(
        contest_task_pairs
          .filter((pair) => pair.contest_id === contestId)
          .map((pair) => [pair.problem_index, pair.problem_id]),
      );

      expect(problemIdByLetter).toEqual(expected);
    },
  );

  test('titles each table as the maintainer specified', () => {
    expect(JAPANESE_STUDENT_CHAMPIONSHIP_ENTRIES.map((entry) => entry.title)).toEqual([
      '第七回日本最強プログラマー学生選手権～Advance～（ABC 474）',
      '第七回日本最強プログラマー学生選手権～Advance～ -予選-（ABC 464）',
      '第七回日本最強プログラマー学生選手権 -決勝-',
      '第七回日本最強プログラマー学生選手権 -予選-（ARC 222）',
      '第六回日本最強プログラマー学生選手権～Advance～（ABC 422）',
      '第六回日本最強プログラマー学生選手権～Advance～ -予選-（ABC 412）',
      '第六回日本最強プログラマー学生選手権 -決勝-',
      '第六回日本最強プログラマー学生選手権 -予選-（ARC 201）',
      '第五回日本最強プログラマー学生選手権 -決勝-',
      '第五回日本最強プログラマー学生選手権 -予選-（ARC 180）',
      '第四回日本最強プログラマー学生選手権 -決勝-',
      '第四回日本最強プログラマー学生選手権 -予選-（ABC 313）',
      '第三回日本最強プログラマー学生選手権 -決勝-',
      '第三回日本最強プログラマー学生選手権 -予選-（ABC 262）',
      '第二回日本最強プログラマー学生選手権 エキシビジョン',
      '第二回日本最強プログラマー学生選手権（ABC-like）',
      '第一回日本最強プログラマー学生選手権決勝',
      '第一回日本最強プログラマー学生選手権-予選-（ARC-like）',
    ]);
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
