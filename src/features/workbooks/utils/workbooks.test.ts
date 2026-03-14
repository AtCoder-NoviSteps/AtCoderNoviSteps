import { expect, test } from 'vitest';

import { Roles } from '$lib/types/user';
import { TaskGrade, type Task } from '$lib/types/task';
import { type WorkbookList, WorkBookType } from '$features/workbooks/types/workbook';

import {
  canViewWorkBook,
  getUrlSlugFrom,
  calcWorkBookGradeModes,
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
        expect(canViewWorkBook(Roles.ADMIN, true)).toBeTruthy();
      });

      test('admin can view workbooks privately', () => {
        expect(canViewWorkBook(Roles.ADMIN, false)).toBeTruthy();
      });
    });

    describe('when the user is not admin', () => {
      test('the user can view published workbooks', () => {
        expect(canViewWorkBook(Roles.USER, true)).toBeTruthy();
      });

      test('the user can not view workbooks privately', () => {
        expect(canViewWorkBook(Roles.USER, false)).toBeFalsy();
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
  });
});
