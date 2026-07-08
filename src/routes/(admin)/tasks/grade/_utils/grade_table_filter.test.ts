import { describe, test, expect } from 'vitest';

import { TaskGrade } from '$lib/types/task';
import type { TaskWithVoteInfo } from '$features/votes/services/vote_statistics';

import { countPendingTasks, filterGradeTableTasks } from './grade_table_filter';

function buildTask(overrides: Partial<TaskWithVoteInfo> = {}): TaskWithVoteInfo {
  return {
    task_id: 'abc300_a',
    contest_id: 'abc300',
    title: 'A problem',
    grade: TaskGrade.PENDING,
    task_table_index: 'A',
    estimatedGrade: null,
    voteTotal: 0,
    ...overrides,
  };
}

describe('filterGradeTableTasks', () => {
  describe('empty query', () => {
    const tasks = [
      buildTask({ task_id: 'abc300_a' }),
      buildTask({ task_id: 'abc300_b', task_table_index: 'B' }),
    ];

    test('returns an empty array', () => {
      expect(filterGradeTableTasks(tasks, '')).toEqual([]);
    });

    test('treats a whitespace-only query as empty', () => {
      expect(filterGradeTableTasks(tasks, '   ')).toEqual([]);
    });
  });

  describe('non-empty query', () => {
    test('returns only matching tasks', () => {
      const tasks = [
        buildTask({ task_id: 'abc300_a', title: 'Apple', contest_id: 'abc300' }),
        buildTask({ task_id: 'xyz999_a', title: 'Banana', contest_id: 'xyz999' }),
      ];

      const result = filterGradeTableTasks(tasks, 'banana');

      expect(result.map((task) => task.task_id)).toEqual(['xyz999_a']);
    });

    test('returns an empty array when nothing matches', () => {
      const tasks = [buildTask({ task_id: 'abc300_a', contest_id: 'abc300' })];

      expect(filterGradeTableTasks(tasks, 'nonexistent')).toEqual([]);
    });

    // Regression guard: the grade table pages through all matches, so no result cap.
    test('returns every match without a result limit', () => {
      const tasks = Array.from({ length: 25 }, (_unused, index) =>
        buildTask({ task_id: `abc300_${index}`, contest_id: 'abc300' }),
      );

      const result = filterGradeTableTasks(tasks, 'abc300');

      expect(result).toHaveLength(25);
    });
  });
});

describe('countPendingTasks', () => {
  describe('typical case', () => {
    test('counts only PENDING tasks when PENDING and non-PENDING are mixed', () => {
      const tasks = [
        buildTask({ task_id: 'abc300_a', grade: TaskGrade.PENDING }),
        buildTask({ task_id: 'abc300_b', grade: TaskGrade.Q1 }),
        buildTask({ task_id: 'abc300_c', grade: TaskGrade.PENDING }),
      ];

      expect(countPendingTasks(tasks)).toBe(2);
    });
  });

  describe('boundary cases', () => {
    test('returns the array length when every task is PENDING', () => {
      const tasks = [
        buildTask({ task_id: 'abc300_a', grade: TaskGrade.PENDING }),
        buildTask({ task_id: 'abc300_b', grade: TaskGrade.PENDING }),
      ];

      expect(countPendingTasks(tasks)).toBe(tasks.length);
    });

    test('returns 0 for an empty array', () => {
      expect(countPendingTasks([])).toBe(0);
    });

    test('returns 0 when no task is PENDING', () => {
      const tasks = [
        buildTask({ task_id: 'abc300_a', grade: TaskGrade.Q1 }),
        buildTask({ task_id: 'abc300_b', grade: TaskGrade.D6 }),
      ];

      expect(countPendingTasks(tasks)).toBe(0);
    });
  });
});
