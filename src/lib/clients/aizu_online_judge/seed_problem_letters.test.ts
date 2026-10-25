import { describe, test, expect } from 'vitest';

import { ContestType } from '#lib/contests/types/contest.js';
import { classifyContest } from '#lib/contests/utils/classification.js';

import { tasks } from '../../../../prisma/tasks';

import { assignProblemLetters } from './utils';

// Same scope as the problem-letter migrations: every AOJ ICPC and JAG contest.
function usesProblemLetters(contestId: string): boolean {
  const contestType = classifyContest(contestId);

  return contestType === ContestType.AOJ_ICPC || contestType === ContestType.AOJ_JAG;
}

// Problems missing from AOJ shift the basic rule here, so letters follow the maintainer's problem list.
const LETTERS_OF_SHIFTED_CONTESTS: Record<string, Record<string, string>> = {
  'JAGSummer2006-day1': { '2057': 'B' },
  'JAGSummer2006-day3': {
    '2067': 'B',
    '2068': 'C',
    '2069': 'D',
    '2070': 'E',
    '2071': 'F',
    '2072': 'G',
  },
  'JAGWinter2006-day2': { '2073': 'D', '2074': 'F' },
  'JAGWinter2006-day3': { '2075': 'A', '2076': 'D', '2077': 'G', '2078': 'H' },
  'JAGWinter2007-day3': {
    '2122': 'A',
    '2123': 'B',
    '2124': 'C',
    '2125': 'D',
    '2126': 'F',
    '2127': 'G',
    '2128': 'H',
    '2129': 'I',
    '2130': 'J',
  },
  'JAGSummer2024-day3': {
    '3637': 'A',
    '3638': 'B',
    '3639': 'C',
    '3640': 'D',
    '3641': 'E',
    '3642': 'F',
    '3644': 'H',
    '3645': 'I',
    '3646': 'J',
    '3647': 'K',
  },
  JAGRegional2005: {
    '2024': 'A',
    '2025': 'B',
    '2026': 'D',
    '2027': 'E',
    '2028': 'G',
    '2029': 'I',
  },
  JAGRegional2013: {
    '2568': 'D',
    '2569': 'E',
    '2570': 'F',
    '2571': 'G',
    '2572': 'H',
    '2573': 'I',
    '2574': 'J',
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
  test('covers 151 contests and 1329 tasks', () => {
    const taskCount = [...indicesByContest.values()].reduce(
      (sum, indices) => sum + indices.size,
      0,
    );

    expect(indicesByContest.size).toBe(151);
    expect(taskCount).toBe(1329);
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
