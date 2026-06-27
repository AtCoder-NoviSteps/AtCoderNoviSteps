import { describe, test, expect } from 'vitest';

import { TaskGrade } from '$lib/types/task';
import type { TaskWithVoteInfo } from '$features/votes/services/vote_statistics';

import { filterGradeTableTasks } from './grade_table_filter';

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

    test('returns an empty array when search is required', () => {
      expect(filterGradeTableTasks(tasks, '', true)).toEqual([]);
    });

    test('treats a whitespace-only query as empty', () => {
      expect(filterGradeTableTasks(tasks, '   ', true)).toEqual([]);
    });

    test('returns all tasks unchanged when search is not required', () => {
      const result = filterGradeTableTasks(tasks, '', false);

      expect(result).toBe(tasks);
    });
  });

  describe('non-empty query', () => {
    test('returns only matching tasks', () => {
      const tasks = [
        buildTask({ task_id: 'abc300_a', title: 'Apple', contest_id: 'abc300' }),
        buildTask({ task_id: 'xyz999_a', title: 'Banana', contest_id: 'xyz999' }),
      ];

      const result = filterGradeTableTasks(tasks, 'banana', false);

      expect(result.map((task) => task.task_id)).toEqual(['xyz999_a']);
    });

    test('returns an empty array when nothing matches', () => {
      const tasks = [buildTask({ task_id: 'abc300_a', contest_id: 'abc300' })];

      expect(filterGradeTableTasks(tasks, 'nonexistent', false)).toEqual([]);
    });

    // Regression guard: the grade table pages through all matches, so no result cap.
    test('returns every match without a result limit', () => {
      const tasks = Array.from({ length: 25 }, (_unused, index) =>
        buildTask({ task_id: `abc300_${index}`, contest_id: 'abc300' }),
      );

      const result = filterGradeTableTasks(tasks, 'abc300', true);

      expect(result).toHaveLength(25);
    });
  });
});
