import { describe, expect, test } from 'vitest';

import { Roles } from '$lib/types/user';
import { TaskGrade, type Task, type TaskResult } from '$lib/types/task';
import { type WorkbookList, WorkBookType } from '$features/workbooks/types/workbook';

import {
  canViewWorkBook,
  getUrlSlugFrom,
  getWorkBooksByType,
  buildTaskResultsByWorkBookId,
  calcWorkBookGradeModes,
  getGradeMode,
  getTaskResult,
  countReadableWorkbooks,
} from '$features/workbooks/utils/workbooks';

function createTask(taskId: string, grade: TaskGrade): Task {
  return {
    task_id: taskId,
    contest_id: '',
    task_table_index: '',
    title: '',
    grade,
  };
}

function createTaskResult(taskId: string): TaskResult {
  return {
    task_id: taskId,
    contest_id: 'abc300',
    task_table_index: 'A',
    title: '',
    grade: TaskGrade.Q10,
    user_id: '1',
    status_name: 'AC',
    status_id: '1',
    submission_status_image_path: '',
    submission_status_label_name: 'AC',
    is_ac: true,
    updated_at: new Date(),
  };
}

function createWorkBookListBase(overrides: Partial<WorkbookList> = {}): WorkbookList {
  return {
    id: 1,
    authorId: '3',
    authorName: 'Alice',
    title: '実装力を鍛える問題集',
    description: '',
    editorialUrl: '',
    isPublished: false,
    isOfficial: false,
    isReplenished: false,
    urlSlug: undefined,
    workBookType: WorkBookType.CREATED_BY_USER,
    workBookTasks: [],
    ...overrides,
  };
}

describe('Workbooks', () => {
  describe('can view workbooks', () => {
    describe('when the user is admin', () => {
      test('admin can view published workbooks', () => {
        expect(canViewWorkBook(Roles.ADMIN, true)).toBe(true);
      });

      test('admin can view workbooks privately', () => {
        expect(canViewWorkBook(Roles.ADMIN, false)).toBe(true);
      });
    });

    describe('when the user is not admin', () => {
      test('the user can view published workbooks', () => {
        expect(canViewWorkBook(Roles.USER, true)).toBe(true);
      });

      test('the user can not view workbooks privately', () => {
        expect(canViewWorkBook(Roles.USER, false)).toBe(false);
      });
    });
  });

  describe('get url slug from workbook', () => {
    test('returns urlSlug when it exists', () => {
      const workbook = createWorkBookListBase({ id: 1, urlSlug: '2-sat' });
      expect(getUrlSlugFrom(workbook)).toBe('2-sat');
    });

    test('returns id as string when urlSlug is null', () => {
      const workbook = createWorkBookListBase({ id: 10, urlSlug: null });
      expect(getUrlSlugFrom(workbook)).toBe('10');
    });

    test('returns id as string when urlSlug is undefined', () => {
      const workbook = createWorkBookListBase({ id: 123, urlSlug: undefined });
      expect(getUrlSlugFrom(workbook)).toBe('123');
    });

    test('returns id as string when urlSlug is empty string', () => {
      const workbook = createWorkBookListBase({ id: 999, urlSlug: '' });
      expect(getUrlSlugFrom(workbook)).toBe('999');
    });
  });

  describe('getWorkBooksByType', () => {
    test('returns only workbooks of the specified type', () => {
      const workbooks = [
        createWorkBookListBase({ id: 1, workBookType: WorkBookType.CURRICULUM }),
        createWorkBookListBase({ id: 2, workBookType: WorkBookType.SOLUTION }),
        createWorkBookListBase({ id: 3, workBookType: WorkBookType.CURRICULUM }),
      ];
      const result = getWorkBooksByType(workbooks, WorkBookType.CURRICULUM);
      expect(result.map((workbook) => workbook.id)).toEqual([1, 3]);
    });

    test('returns empty array when given an empty array', () => {
      expect(getWorkBooksByType([], WorkBookType.CURRICULUM)).toEqual([]);
    });

    test('returns empty array when no workbook matches the type', () => {
      const workbooks = [createWorkBookListBase({ id: 1, workBookType: WorkBookType.SOLUTION })];
      expect(getWorkBooksByType(workbooks, WorkBookType.CURRICULUM)).toEqual([]);
    });
  });

  describe('buildTaskResultsByWorkBookId', () => {
    test('includes workbook in map when task results exist', () => {
      const taskResult = createTaskResult('abc300_a');
      const taskResultsByTaskId = new Map([['abc300_a', taskResult]]);
      const workbooks = [
        createWorkBookListBase({
          id: 1,
          workBookTasks: [{ taskId: 'abc300_a', priority: 1, comment: '' }],
        }),
      ];
      const result = buildTaskResultsByWorkBookId(workbooks, taskResultsByTaskId);
      expect(result.get(1)).toEqual([taskResult]);
    });

    test('excludes workbook from map when no task results exist', () => {
      const taskResultsByTaskId = new Map<string, TaskResult>();
      const workbooks = [
        createWorkBookListBase({
          id: 1,
          workBookTasks: [{ taskId: 'abc300_a', priority: 1, comment: '' }],
        }),
      ];
      const result = buildTaskResultsByWorkBookId(workbooks, taskResultsByTaskId);
      expect(result.has(1)).toBe(false);
    });

    test('returns empty map when given empty workbooks array', () => {
      const taskResultsByTaskId = new Map<string, TaskResult>();
      const result = buildTaskResultsByWorkBookId([], taskResultsByTaskId);
      expect(result.size).toBe(0);
    });

    test('includes only tasks with existing results when workbook has partial results', () => {
      const taskResult = createTaskResult('abc300_a');
      const taskResultsByTaskId = new Map([['abc300_a', taskResult]]);
      const workbooks = [
        createWorkBookListBase({
          id: 1,
          workBookTasks: [
            { taskId: 'abc300_a', priority: 1, comment: '' },
            { taskId: 'abc300_b', priority: 2, comment: '' },
          ],
        }),
      ];
      const result = buildTaskResultsByWorkBookId(workbooks, taskResultsByTaskId);
      expect(result.get(1)).toEqual([taskResult]);
    });
  });

  describe('calcWorkBookGradeModes', () => {
    test('returns most frequent grade for each workbook', () => {
      const tasksMapByIds: Map<string, Task> = new Map([
        ['abc322_d', createTask('abc322_d', TaskGrade.Q1)],
        ['abc347_c', createTask('abc347_c', TaskGrade.Q1)],
        ['abc307_c', createTask('abc307_c', TaskGrade.Q2)],
      ]);
      const workbooks = [
        createWorkBookListBase({
          id: 1,
          workBookTasks: [
            { taskId: 'abc322_d', priority: 1, comment: '' },
            { taskId: 'abc347_c', priority: 2, comment: '' },
            { taskId: 'abc307_c', priority: 3, comment: '' },
          ],
        }),
      ];
      const result = calcWorkBookGradeModes(workbooks, tasksMapByIds);
      expect(result.get(1)).toBe(TaskGrade.Q1);
    });

    test('returns PENDING for workbook without tasks', () => {
      const tasksMapByIds: Map<string, Task> = new Map();
      const workbooks = [createWorkBookListBase({ id: 1, workBookTasks: [] })];
      const result = calcWorkBookGradeModes(workbooks, tasksMapByIds);
      expect(result.get(1)).toBe(TaskGrade.PENDING);
    });

    test('returns PENDING for workbook with all PENDING tasks', () => {
      const tasksMapByIds: Map<string, Task> = new Map([
        ['abc322_d', createTask('abc322_d', TaskGrade.PENDING)],
        ['abc347_c', createTask('abc347_c', TaskGrade.PENDING)],
        ['abc307_c', createTask('abc307_c', TaskGrade.PENDING)],
      ]);
      const workbooks = [
        createWorkBookListBase({
          id: 1,
          workBookTasks: [
            { taskId: 'abc322_d', priority: 1, comment: '' },
            { taskId: 'abc347_c', priority: 2, comment: '' },
            { taskId: 'abc307_c', priority: 3, comment: '' },
          ],
        }),
      ];
      const result = calcWorkBookGradeModes(workbooks, tasksMapByIds);
      expect(result.get(1)).toBe(TaskGrade.PENDING);
    });

    test('returns empty map for empty workbooks array', () => {
      const tasksMapByIds: Map<string, Task> = new Map();
      const result = calcWorkBookGradeModes([], tasksMapByIds);
      expect(result.size).toBe(0);
    });

    test('ignores tasks not found in tasksMapByIds', () => {
      const tasksMapByIds: Map<string, Task> = new Map([
        ['abc322_d', createTask('abc322_d', TaskGrade.Q9)],
      ]);
      const workbooks = [
        createWorkBookListBase({
          id: 1,
          workBookTasks: [
            { taskId: 'abc322_d', priority: 1, comment: '' },
            { taskId: 'missing', priority: 2, comment: '' },
          ],
        }),
      ];
      const result = calcWorkBookGradeModes(workbooks, tasksMapByIds);
      expect(result.get(1)).toBe(TaskGrade.Q9);
    });

    test('handles multiple workbooks independently', () => {
      const tasksMapByIds: Map<string, Task> = new Map([
        ['abc440_a', createTask('abc440_a', TaskGrade.Q8)],
        ['abc425_a', createTask('abc425_a', TaskGrade.Q7)],
      ]);
      const workbooks = [
        createWorkBookListBase({
          id: 10,
          workBookTasks: [{ taskId: 'abc440_a', priority: 1, comment: '' }],
        }),
        createWorkBookListBase({
          id: 20,
          workBookTasks: [{ taskId: 'abc425_a', priority: 1, comment: '' }],
        }),
      ];
      const result = calcWorkBookGradeModes(workbooks, tasksMapByIds);
      expect(result.get(10)).toBe(TaskGrade.Q8);
      expect(result.get(20)).toBe(TaskGrade.Q7);
    });

    // Tie-break: when two grades share the same frequency, return the easiest (highest Q number)
    // Example: Q8: 2 tasks, Q7: 5 tasks, Q6: 5 tasks => Q7
    test('returns the easiest grade when two grades share the same frequency (Q7 and Q6 → Q7)', () => {
      const tasksMapByIds: Map<string, Task> = new Map([
        ['abc300_a', createTask('abc300_a', TaskGrade.Q8)],
        ['abc300_b', createTask('abc300_b', TaskGrade.Q8)],
        ['abc300_c', createTask('abc300_c', TaskGrade.Q7)],
        ['abc300_d', createTask('abc300_d', TaskGrade.Q7)],
        ['abc300_e', createTask('abc300_e', TaskGrade.Q7)],
        ['abc300_f', createTask('abc300_f', TaskGrade.Q7)],
        ['abc300_g', createTask('abc300_g', TaskGrade.Q7)],
        ['abc300_h', createTask('abc300_h', TaskGrade.Q6)],
        ['abc301_a', createTask('abc301_a', TaskGrade.Q6)],
        ['abc301_b', createTask('abc301_b', TaskGrade.Q6)],
        ['abc301_c', createTask('abc301_c', TaskGrade.Q6)],
        ['abc301_d', createTask('abc301_d', TaskGrade.Q6)],
      ]);
      const workbooks = [
        createWorkBookListBase({
          id: 1,
          workBookTasks: [
            { taskId: 'abc300_a', priority: 1, comment: '' },
            { taskId: 'abc300_b', priority: 2, comment: '' },
            { taskId: 'abc300_c', priority: 3, comment: '' },
            { taskId: 'abc300_d', priority: 4, comment: '' },
            { taskId: 'abc300_e', priority: 5, comment: '' },
            { taskId: 'abc300_f', priority: 6, comment: '' },
            { taskId: 'abc300_g', priority: 7, comment: '' },
            { taskId: 'abc300_h', priority: 8, comment: '' },
            { taskId: 'abc301_a', priority: 9, comment: '' },
            { taskId: 'abc301_b', priority: 10, comment: '' },
            { taskId: 'abc301_c', priority: 11, comment: '' },
            { taskId: 'abc301_d', priority: 12, comment: '' },
          ],
        }),
      ];
      // Q7: 5 tasks, Q6: 5 tasks with same frequency → return easier Q7
      const result = calcWorkBookGradeModes(workbooks, tasksMapByIds);
      expect(result.get(1)).toBe(TaskGrade.Q7);
    });

    test('returns the easiest grade when two grades share the same frequency (Q2 and Q1 → Q2)', () => {
      const tasksMapByIds: Map<string, Task> = new Map([
        ['abc300_a', createTask('abc300_a', TaskGrade.Q2)],
        ['abc300_b', createTask('abc300_b', TaskGrade.Q1)],
      ]);
      const workbooks = [
        createWorkBookListBase({
          id: 1,
          workBookTasks: [
            { taskId: 'abc300_a', priority: 1, comment: '' },
            { taskId: 'abc300_b', priority: 2, comment: '' },
          ],
        }),
      ];
      // Q2 and Q1 with same frequency → return easier Q2
      const result = calcWorkBookGradeModes(workbooks, tasksMapByIds);
      expect(result.get(1)).toBe(TaskGrade.Q2);
    });
  });

  describe('getGradeMode', () => {
    test('returns the grade mode for the given workbook id', () => {
      const map = new Map([[1, TaskGrade.Q5]]);
      expect(getGradeMode(1, map)).toBe(TaskGrade.Q5);
    });

    test('returns PENDING when the workbook id is not in the map', () => {
      const map = new Map<number, TaskGrade>();
      expect(getGradeMode(99, map)).toBe(TaskGrade.PENDING);
    });
  });

  describe('countReadableWorkbooks', () => {
    const userId = '1';
    const authorId = '1';
    const otherUserId = '2';

    test('counts published workbooks regardless of author', () => {
      const workbooks = [
        createWorkBookListBase({ id: 1, isPublished: true, authorId: otherUserId }),
        createWorkBookListBase({ id: 2, isPublished: true, authorId: otherUserId }),
      ];
      expect(countReadableWorkbooks(workbooks, userId)).toBe(2);
    });

    test('counts unpublished workbooks owned by the user', () => {
      const workbooks = [createWorkBookListBase({ id: 1, isPublished: false, authorId })];
      expect(countReadableWorkbooks(workbooks, userId)).toBe(1);
    });

    test('excludes unpublished workbooks owned by other users', () => {
      const workbooks = [
        createWorkBookListBase({ id: 1, isPublished: false, authorId: otherUserId }),
      ];
      expect(countReadableWorkbooks(workbooks, userId)).toBe(0);
    });

    test('returns 0 for empty list', () => {
      expect(countReadableWorkbooks([], userId)).toBe(0);
    });
  });

  describe('getTaskResult', () => {
    test('returns task results for the given workbook id', () => {
      const taskResult = {
        task_id: 'abc300_a',
        contest_id: 'abc300',
        task_table_index: 'A',
        title: '',
        grade: TaskGrade.Q10,
        user_id: '1',
        status_name: 'AC',
        status_id: '1',
        submission_status_image_path: '',
        submission_status_label_name: 'AC',
        is_ac: true,
        updated_at: new Date(),
      };
      const map = new Map([[1, [taskResult]]]);
      expect(getTaskResult(1, map)).toEqual([taskResult]);
    });

    test('returns empty array when the workbook id is not in the map', () => {
      const map = new Map<number, TaskResult[]>();
      expect(getTaskResult(99, map)).toEqual([]);
    });
  });
});
