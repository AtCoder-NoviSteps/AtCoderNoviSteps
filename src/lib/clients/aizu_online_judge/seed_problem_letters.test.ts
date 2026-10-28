import { describe, test, expect } from 'vitest';

import { ContestType } from '#lib/contests/types/contest.js';
import { isNoJudgeTask } from '#lib/contests/index.js';
import { classifyContest } from '#lib/contests/utils/classification.js';

import { tasks } from '../../../../prisma/tasks';

import { assignProblemLetters } from './utils';

// Same scope as the problem-letter migrations: every AOJ ICPC and JAG contest.
function usesProblemLetters(contestId: string): boolean {
  const contestType = classifyContest(contestId);

  return contestType === ContestType.AOJ_ICPC || contestType === ContestType.AOJ_JAG;
}

// Problems missing from AOJ shift the basic rule here, so letters follow the maintainer's problem list.
// NoJudge ids cannot be sorted with Number(), so contests with NoJudge tasks must be listed here.
const LETTERS_OF_SHIFTED_CONTESTS: Record<string, Record<string, string>> = {
  'JAGSummer2006-day1': {
    'NoJudge-JAGSummer2006-day1_a': 'A',
    '2057': 'B',
    'NoJudge-JAGSummer2006-day1_c': 'C',
  },
  'JAGSummer2006-day3': {
    'NoJudge-JAGSummer2006-day3_a': 'A',
    '2067': 'B',
    '2068': 'C',
    '2069': 'D',
    '2070': 'E',
    '2071': 'F',
    '2072': 'G',
  },
  'JAGWinter2006-day2': {
    'NoJudge-JAGWinter2006-day2_a': 'A',
    'NoJudge-JAGWinter2006-day2_b': 'B',
    'NoJudge-JAGWinter2006-day2_c': 'C',
    '2073': 'D',
    'NoJudge-JAGWinter2006-day2_e': 'E',
    '2074': 'F',
    'NoJudge-JAGWinter2006-day2_g': 'G',
    'NoJudge-JAGWinter2006-day2_h': 'H',
    'NoJudge-JAGWinter2006-day2_i': 'I',
  },
  'JAGWinter2006-day3': {
    '2075': 'A',
    'NoJudge-JAGWinter2006-day3_b': 'B',
    'NoJudge-JAGWinter2006-day3_c': 'C',
    '2076': 'D',
    'NoJudge-JAGWinter2006-day3_e': 'E',
    'NoJudge-JAGWinter2006-day3_f': 'F',
    '2077': 'G',
    '2078': 'H',
    'NoJudge-JAGWinter2006-day3_i': 'I',
    'NoJudge-JAGWinter2006-day3_j': 'J',
  },
  'JAGWinter2007-day3': {
    '2122': 'A',
    '2123': 'B',
    '2124': 'C',
    '2125': 'D',
    'NoJudge-JAGWinter2007-day3_e': 'E',
    '2126': 'F',
    '2127': 'G',
    '2128': 'H',
    '2129': 'I',
    '2130': 'J',
  },
  JAGRegional2005: {
    '2024': 'A',
    '2025': 'B',
    'NoJudge-JAGRegional2005_c': 'C',
    '2026': 'D',
    '2027': 'E',
    'NoJudge-JAGRegional2005_f': 'F',
    '2028': 'G',
    'NoJudge-JAGRegional2005_h': 'H',
    '2029': 'I',
  },
  JAGRegional2008: {
    '2048': 'A',
    '2049': 'B',
    '2050': 'C',
    '2051': 'D',
    '2052': 'E',
    '2053': 'F',
    '2054': 'G',
    '2055': 'H',
    '2056': 'I',
    'NoJudge-JAGRegional2008_j': 'J',
  },
};

function groupProblemIndicesByContest(): Map<string, Map<string, string>> {
  const indicesByContest = new Map<string, Map<string, string>>();

  for (const task of tasks) {
    if (!usesProblemLetters(task.contest_id)) {
      continue;
    }

    const indices = indicesByContest.get(task.contest_id) ?? new Map<string, string>();
    indices.set(task.id, task.problem_index);
    indicesByContest.set(task.contest_id, indices);
  }

  return indicesByContest;
}

describe('problem_index of AOJ ICPC / JAG tasks in prisma/tasks.ts', () => {
  const indicesByContest = groupProblemIndicesByContest();

  // Guards against the filter silently matching fewer tasks.
  test('covers 151 contests and 1355 tasks', () => {
    const taskCount = [...indicesByContest.values()].reduce(
      (sum, indices) => sum + indices.size,
      0,
    );

    expect(indicesByContest.size).toBe(151);
    expect(taskCount).toBe(1355);
  });

  test.each(
    [...indicesByContest].filter(([contestId]) => !(contestId in LETTERS_OF_SHIFTED_CONTESTS)),
  )('%s follows the basic rule (ascending problem ids)', (_contestId, indices) => {
    expect(indices).toEqual(assignProblemLetters([...indices.keys()]));
  });

  test.each(Object.entries(LETTERS_OF_SHIFTED_CONTESTS))(
    '%s follows the official letters',
    (contestId, letters) => {
      expect(Object.fromEntries(indicesByContest.get(contestId) ?? [])).toEqual(letters);
    },
  );

  test('every contest with NoJudge tasks is in LETTERS_OF_SHIFTED_CONTESTS', () => {
    const contestIds = tasks
      .filter((task) => isNoJudgeTask(task.id))
      .map((task) => task.contest_id);

    expect(contestIds.filter((contestId) => !(contestId in LETTERS_OF_SHIFTED_CONTESTS))).toEqual(
      [],
    );
  });

  test('ICPC Prelim 2024 F is problem 1677', () => {
    expect(indicesByContest.get('ICPCPrelim2024')?.get('1677')).toBe('F');
  });

  // AOJ titles are the plain problem name: no "<problem id>. " prefix and nothing lost when it was stripped.
  test('every title equals the problem name', () => {
    const mismatchedTaskIds = tasks
      .filter((task) => usesProblemLetters(task.contest_id) && task.title !== task.name)
      .map((task) => task.id);

    expect(mismatchedTaskIds).toEqual([]);
  });
});
