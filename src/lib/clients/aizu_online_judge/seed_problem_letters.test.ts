import { describe, test, expect } from 'vitest';

import { ContestType } from '#lib/contests/types/contest.js';
import { classifyContest } from '#lib/contests/utils/classification.js';

import { tasks } from '../../../../prisma/tasks';

import { assignProblemLetters } from './utils';

// Same scope as the problem-letter migration; JAG training camps are AOJ_JAG but keep problem ids.
function usesProblemLetters(contestId: string): boolean {
  const contestType = classifyContest(contestId);

  return (
    contestType === ContestType.AOJ_ICPC ||
    (contestType === ContestType.AOJ_JAG && contestId.startsWith('JAGPrelim'))
  );
}

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

describe('problem_index of ICPC / JAG Prelim tasks in prisma/tasks.ts', () => {
  const indicesByContest = groupProblemIndicesByContest();

  // Guards against the filter silently matching fewer tasks.
  test('covers 79 contests and 632 tasks', () => {
    const taskCount = [...indicesByContest.values()].reduce(
      (sum, indices) => sum + indices.size,
      0,
    );

    expect(indicesByContest.size).toBe(79);
    expect(taskCount).toBe(632);
  });

  test.each([...indicesByContest])(
    '%s matches the letters assigned on import',
    (_contestId, indices) => {
      expect(indices).toEqual(assignProblemLetters([...indices.keys()]));
    },
  );

  test('ICPC Prelim 2024 F is problem 1677', () => {
    expect(indicesByContest.get('ICPCPrelim2024')?.get('1677')).toBe('F');
  });
});
