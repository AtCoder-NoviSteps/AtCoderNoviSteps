import { describe, expect, test } from 'vitest';

import {
  WorkBookType,
  type WorkBook,
  type WorkBookTasksBase,
} from '$features/workbooks/types/workbook';

import {
  getWorkBookTasks,
  validateRequiredFields,
} from '$features/workbooks/services/workbook_tasks';

function createWorkBook(overrides: Partial<Omit<WorkBook, 'id'>> = {}): Omit<WorkBook, 'id'> {
  return {
    authorId: '1',
    title: 'テスト問題集',
    description: '',
    editorialUrl: '',
    isPublished: false,
    isOfficial: false,
    isReplenished: false,
    workBookType: WorkBookType.CREATED_BY_USER,
    urlSlug: null,
    workBookTasks: [],
    ...overrides,
  };
}

describe('getWorkBookTasks', () => {
  test('returns tasks with taskId, priority, and comment', () => {
    const workBook = createWorkBook({
      workBookTasks: [
        { taskId: 'abc300_a', priority: 1, comment: 'コメント' },
        { taskId: 'abc300_b', priority: 2, comment: '' },
      ],
    });
    expect(getWorkBookTasks(workBook)).toEqual([
      { taskId: 'abc300_a', priority: 1, comment: 'コメント' },
      { taskId: 'abc300_b', priority: 2, comment: '' },
    ]);
  });

  test('returns empty array when workBookTasks is empty', () => {
    expect(getWorkBookTasks(createWorkBook({ workBookTasks: [] }))).toEqual([]);
  });

  test('includes tasks with empty comment string', () => {
    const workBook = createWorkBook({
      workBookTasks: [{ taskId: 'abc300_a', priority: 1, comment: '' }],
    });
    expect(getWorkBookTasks(workBook)).toEqual([{ taskId: 'abc300_a', priority: 1, comment: '' }]);
  });
});

describe('validateRequiredFields', () => {
  describe('valid inputs', () => {
    test('does not throw when all fields are present', () => {
      const tasks: WorkBookTasksBase = [{ taskId: 'abc300_a', priority: 1, comment: '' }];
      expect(() => validateRequiredFields(tasks)).not.toThrow();
    });

    test('does not throw for empty array', () => {
      expect(() => validateRequiredFields([])).not.toThrow();
    });

    // Negative and decimal values are truthy so they pass validation (documented behaviour)
    test('does not throw when priority is negative (truthy)', () => {
      const tasks: WorkBookTasksBase = [{ taskId: 'abc300_a', priority: -1, comment: '' }];
      expect(() => validateRequiredFields(tasks)).not.toThrow();
    });

    test('does not throw when priority is a decimal (truthy)', () => {
      const tasks: WorkBookTasksBase = [{ taskId: 'abc300_a', priority: 1.5, comment: '' }];
      expect(() => validateRequiredFields(tasks)).not.toThrow();
    });
  });

  describe('invalid inputs', () => {
    test('throws when taskId is empty string at index 0', () => {
      const tasks: WorkBookTasksBase = [{ taskId: '', priority: 1, comment: '' }];
      expect(() => validateRequiredFields(tasks)).toThrow('index 0');
    });

    test('throws when taskId is empty string at a middle index', () => {
      const tasks: WorkBookTasksBase = [
        { taskId: 'abc300_a', priority: 1, comment: '' },
        { taskId: '', priority: 2, comment: '' },
        { taskId: 'abc300_c', priority: 3, comment: '' },
      ];
      expect(() => validateRequiredFields(tasks)).toThrow('index 1');
    });

    test('throws when taskId is empty string at the last index', () => {
      const tasks: WorkBookTasksBase = [
        { taskId: 'abc300_a', priority: 1, comment: '' },
        { taskId: '', priority: 2, comment: '' },
      ];
      expect(() => validateRequiredFields(tasks)).toThrow('index 1');
    });

    // NOTE: !task.priority treats priority === 0 as falsy, so 0 triggers an error.
    // priority is expected to be a positive integer (>= 1) in practice.
    test('throws when priority is 0 at index 0', () => {
      const tasks: WorkBookTasksBase = [{ taskId: 'abc300_a', priority: 0, comment: '' }];
      expect(() => validateRequiredFields(tasks)).toThrow('index 0');
    });

    test('throws when priority is 0 at a middle index', () => {
      const tasks: WorkBookTasksBase = [
        { taskId: 'abc300_a', priority: 1, comment: '' },
        { taskId: 'abc300_b', priority: 0, comment: '' },
        { taskId: 'abc300_c', priority: 3, comment: '' },
      ];
      expect(() => validateRequiredFields(tasks)).toThrow('index 1');
    });

    test('throws when priority is 0 at the last index', () => {
      const tasks: WorkBookTasksBase = [
        { taskId: 'abc300_a', priority: 1, comment: '' },
        { taskId: 'abc300_b', priority: 0, comment: '' },
      ];
      expect(() => validateRequiredFields(tasks)).toThrow('index 1');
    });
  });
});
