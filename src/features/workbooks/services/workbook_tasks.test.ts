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
  test('taskId / priority / comment を含むタスク配列を返す', () => {
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

  test('workBookTasks が空の場合は空配列を返す', () => {
    expect(getWorkBookTasks(createWorkBook({ workBookTasks: [] }))).toEqual([]);
  });

  test('comment が空文字列でも含めて返す', () => {
    const workBook = createWorkBook({
      workBookTasks: [{ taskId: 'abc300_a', priority: 1, comment: '' }],
    });
    expect(getWorkBookTasks(workBook)).toEqual([{ taskId: 'abc300_a', priority: 1, comment: '' }]);
  });
});

describe('validateRequiredFields', () => {
  test('正常ケース: 全フィールドが揃っている場合はエラーを投げない', () => {
    const tasks: WorkBookTasksBase = [{ taskId: 'abc300_a', priority: 1, comment: '' }];
    expect(() => validateRequiredFields(tasks)).not.toThrow();
  });

  test('空配列の場合はエラーを投げない', () => {
    expect(() => validateRequiredFields([])).not.toThrow();
  });

  test('taskId が空文字列の場合にエラーを投げる（index 0）', () => {
    const tasks: WorkBookTasksBase = [{ taskId: '', priority: 1, comment: '' }];
    expect(() => validateRequiredFields(tasks)).toThrow('index 0');
  });

  test('taskId が空文字列の場合にエラーを投げる（中間タスク）', () => {
    const tasks: WorkBookTasksBase = [
      { taskId: 'abc300_a', priority: 1, comment: '' },
      { taskId: '', priority: 2, comment: '' },
      { taskId: 'abc300_c', priority: 3, comment: '' },
    ];
    expect(() => validateRequiredFields(tasks)).toThrow('index 1');
  });

  test('taskId が空文字列の場合にエラーを投げる（最後のタスク）', () => {
    const tasks: WorkBookTasksBase = [
      { taskId: 'abc300_a', priority: 1, comment: '' },
      { taskId: '', priority: 2, comment: '' },
    ];
    expect(() => validateRequiredFields(tasks)).toThrow('index 1');
  });

  // NOTE: !task.priority は priority === 0 を falsy として扱うためエラーになる。
  // priority は実際には 1 以上の整数で設定されるため、0 は使用されない想定。
  test('priority が 0 の場合にエラーを投げる（index 0）', () => {
    const tasks: WorkBookTasksBase = [{ taskId: 'abc300_a', priority: 0, comment: '' }];
    expect(() => validateRequiredFields(tasks)).toThrow('index 0');
  });

  test('priority が 0 の場合にエラーを投げる（中間タスク）', () => {
    const tasks: WorkBookTasksBase = [
      { taskId: 'abc300_a', priority: 1, comment: '' },
      { taskId: 'abc300_b', priority: 0, comment: '' },
      { taskId: 'abc300_c', priority: 3, comment: '' },
    ];
    expect(() => validateRequiredFields(tasks)).toThrow('index 1');
  });

  test('priority が 0 の場合にエラーを投げる（最後のタスク）', () => {
    const tasks: WorkBookTasksBase = [
      { taskId: 'abc300_a', priority: 1, comment: '' },
      { taskId: 'abc300_b', priority: 0, comment: '' },
    ];
    expect(() => validateRequiredFields(tasks)).toThrow('index 1');
  });

  // 負数・小数は truthy なのでエラーにならない（ドキュメント目的）
  test('priority が負数の場合はエラーを投げない（truthy 扱い）', () => {
    const tasks: WorkBookTasksBase = [{ taskId: 'abc300_a', priority: -1, comment: '' }];
    expect(() => validateRequiredFields(tasks)).not.toThrow();
  });

  test('priority が小数の場合はエラーを投げない（truthy 扱い）', () => {
    const tasks: WorkBookTasksBase = [{ taskId: 'abc300_a', priority: 1.5, comment: '' }];
    expect(() => validateRequiredFields(tasks)).not.toThrow();
  });
});
