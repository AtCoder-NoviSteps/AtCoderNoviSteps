import { expect, test } from 'vitest';

import type { WorkBookTasksBase } from '$lib/types/workbook';
import type { Tasks } from '$lib/types/task';
import { TaskGrade } from '$lib/types/task';

import { updateWorkBookTasks } from '$lib/utils/workbook_tasks';

// Note: 1つオブジェクトで、1つ以上の問題のテストができるように、selectedIndexとselectedTaskは配列にしている
type TestCaseForWorkBookTasks = {
  workBookTasks: WorkBookTasksBase;
  selectedIndexes: number[];
  selectedTasks: Tasks;
  expected: WorkBookTasksBase;
};

type TestCasesForWorkBookTasks = TestCaseForWorkBookTasks[];

describe('Workbook tasks', () => {
  describe('create / update workbook tasks for db', () => {
    describe('when adding a task to an empty workbook task', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [],
          selectedIndexes: [0], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc322',
              task_table_index: 'D',
              task_id: 'abc322_d',
              title: 'D. Polyomino',
              grade: TaskGrade.Q1,
            },
          ],
          expected: [{ taskId: 'abc322_d', priority: 1, comment: '' }],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding two tasks to an empty workbook task at the top', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [],
          selectedIndexes: [0, 0], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc322',
              task_table_index: 'D',
              task_id: 'abc322_d',
              title: 'D. Polyomino',
              grade: TaskGrade.Q1,
            },

            {
              contest_id: 'abc319',
              task_table_index: 'C',
              task_id: 'abc319_c',
              title: 'C. False Hope',
              grade: TaskGrade.Q1,
            },
          ],
          expected: [
            { taskId: 'abc319_c', priority: 1, comment: '' },
            { taskId: 'abc322_d', priority: 2, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding two tasks to an empty workbook task at the end', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [],
          selectedIndexes: [0, 1], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc322',
              task_table_index: 'D',
              task_id: 'abc322_d',
              title: 'D. Polyomino',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc319',
              task_table_index: 'C',
              task_id: 'abc319_c',
              title: 'C. False Hope',
              grade: TaskGrade.Q1,
            },
          ],
          expected: [
            { taskId: 'abc322_d', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding multiple tasks to an empty workbook task at the top', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [],
          selectedIndexes: [0, 0, 0], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc322',
              task_table_index: 'D',
              task_id: 'abc322_d',
              title: 'D. Polyomino',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc319',
              task_table_index: 'C',
              task_id: 'abc319_c',
              title: 'C. False Hope',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc307',
              task_table_index: 'C',
              task_id: 'abc307_c',
              title: 'C. Ideal Sheet',
              grade: TaskGrade.Q1,
            },
          ],
          expected: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding multiple tasks to an empty workbook task at the end', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [],
          selectedIndexes: [0, 1, 2], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc322',
              task_table_index: 'D',
              task_id: 'abc322_d',
              title: 'D. Polyomino',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc319',
              task_table_index: 'C',
              task_id: 'abc319_c',
              title: 'C. False Hope',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc307',
              task_table_index: 'C',
              task_id: 'abc307_c',
              title: 'C. Ideal Sheet',
              grade: TaskGrade.Q1,
            },
          ],
          expected: [
            { taskId: 'abc322_d', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc307_c', priority: 3, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding multiple tasks to an empty workbook task in any order', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [],
          selectedIndexes: [0, 1, 0], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc322',
              task_table_index: 'D',
              task_id: 'abc322_d',
              title: 'D. Polyomino',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc319',
              task_table_index: 'C',
              task_id: 'abc319_c',
              title: 'C. False Hope',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc307',
              task_table_index: 'C',
              task_id: 'abc307_c',
              title: 'C. Ideal Sheet',
              grade: TaskGrade.Q1,
            },
          ],
          expected: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc322_d', priority: 2, comment: '' },
            { taskId: 'abc319_c', priority: 3, comment: '' },
          ],
        },
        {
          workBookTasks: [],
          selectedIndexes: [0, 1, 1], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc322',
              task_table_index: 'D',
              task_id: 'abc322_d',
              title: 'D. Polyomino',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc319',
              task_table_index: 'C',
              task_id: 'abc319_c',
              title: 'C. False Hope',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc307',
              task_table_index: 'C',
              task_id: 'abc307_c',
              title: 'C. Ideal Sheet',
              grade: TaskGrade.Q1,
            },
          ],
          expected: [
            { taskId: 'abc322_d', priority: 1, comment: '' },
            { taskId: 'abc307_c', priority: 2, comment: '' },
            { taskId: 'abc319_c', priority: 3, comment: '' },
          ],
        },
        {
          workBookTasks: [],
          selectedIndexes: [0, 0, 1], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc322',
              task_table_index: 'D',
              task_id: 'abc322_d',
              title: 'D. Polyomino',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc319',
              task_table_index: 'C',
              task_id: 'abc319_c',
              title: 'C. False Hope',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc307',
              task_table_index: 'C',
              task_id: 'abc307_c',
              title: 'C. Ideal Sheet',
              grade: TaskGrade.Q1,
            },
          ],
          expected: [
            { taskId: 'abc319_c', priority: 1, comment: '' },
            { taskId: 'abc307_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding multiple tasks to existing workbook tasks at the top', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
          selectedIndexes: [0, 0, 0, 0], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc347',
              task_table_index: 'C',
              task_id: 'abc347_c',
              title: 'C. Ideal Holidays',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc359',
              task_table_index: 'C',
              task_id: 'abc359_c',
              title: 'C. Tile Distance 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc334',
              task_table_index: 'C',
              task_id: 'abc334_c',
              title: 'C. Socks 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc271',
              task_table_index: 'C',
              task_id: 'abc271_c',
              title: 'C. Manga',
              grade: TaskGrade.PENDING,
            },
          ],
          expected: [
            { taskId: 'abc271_c', priority: 1, comment: '' },
            { taskId: 'abc334_c', priority: 2, comment: '' },
            { taskId: 'abc359_c', priority: 3, comment: '' },
            { taskId: 'abc347_c', priority: 4, comment: '' },
            { taskId: 'abc307_c', priority: 5, comment: '' },
            { taskId: 'abc319_c', priority: 6, comment: '' },
            { taskId: 'abc322_d', priority: 7, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding multiple tasks to existing workbook tasks at the end', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
          selectedIndexes: [3, 4, 5, 6], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc347',
              task_table_index: 'C',
              task_id: 'abc347_c',
              title: 'C. Ideal Holidays',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc359',
              task_table_index: 'C',
              task_id: 'abc359_c',
              title: 'C. Tile Distance 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc334',
              task_table_index: 'C',
              task_id: 'abc334_c',
              title: 'C. Socks 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc271',
              task_table_index: 'C',
              task_id: 'abc271_c',
              title: 'C. Manga',
              grade: TaskGrade.PENDING,
            },
          ],
          expected: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
            { taskId: 'abc347_c', priority: 4, comment: '' },
            { taskId: 'abc359_c', priority: 5, comment: '' },
            { taskId: 'abc334_c', priority: 6, comment: '' },
            { taskId: 'abc271_c', priority: 7, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding multiple tasks to existing workbook tasks in any order', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
          selectedIndexes: [1, 1, 1, 1], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc347',
              task_table_index: 'C',
              task_id: 'abc347_c',
              title: 'C. Ideal Holidays',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc359',
              task_table_index: 'C',
              task_id: 'abc359_c',
              title: 'C. Tile Distance 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc334',
              task_table_index: 'C',
              task_id: 'abc334_c',
              title: 'C. Socks 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc271',
              task_table_index: 'C',
              task_id: 'abc271_c',
              title: 'C. Manga',
              grade: TaskGrade.PENDING,
            },
          ],
          expected: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc271_c', priority: 2, comment: '' },
            { taskId: 'abc334_c', priority: 3, comment: '' },
            { taskId: 'abc359_c', priority: 4, comment: '' },
            { taskId: 'abc347_c', priority: 5, comment: '' },
            { taskId: 'abc319_c', priority: 6, comment: '' },
            { taskId: 'abc322_d', priority: 7, comment: '' },
          ],
        },
        {
          workBookTasks: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
          selectedIndexes: [0, 1, 2, 3], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc347',
              task_table_index: 'C',
              task_id: 'abc347_c',
              title: 'C. Ideal Holidays',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc359',
              task_table_index: 'C',
              task_id: 'abc359_c',
              title: 'C. Tile Distance 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc334',
              task_table_index: 'C',
              task_id: 'abc334_c',
              title: 'C. Socks 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc271',
              task_table_index: 'C',
              task_id: 'abc271_c',
              title: 'C. Manga',
              grade: TaskGrade.PENDING,
            },
          ],
          expected: [
            { taskId: 'abc347_c', priority: 1, comment: '' },
            { taskId: 'abc359_c', priority: 2, comment: '' },
            { taskId: 'abc334_c', priority: 3, comment: '' },
            { taskId: 'abc271_c', priority: 4, comment: '' },
            { taskId: 'abc307_c', priority: 5, comment: '' },
            { taskId: 'abc319_c', priority: 6, comment: '' },
            { taskId: 'abc322_d', priority: 7, comment: '' },
          ],
        },
        {
          workBookTasks: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
          selectedIndexes: [3, 4, 0, 0], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc347',
              task_table_index: 'C',
              task_id: 'abc347_c',
              title: 'C. Ideal Holidays',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc359',
              task_table_index: 'C',
              task_id: 'abc359_c',
              title: 'C. Tile Distance 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc334',
              task_table_index: 'C',
              task_id: 'abc334_c',
              title: 'C. Socks 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc271',
              task_table_index: 'C',
              task_id: 'abc271_c',
              title: 'C. Manga',
              grade: TaskGrade.PENDING,
            },
          ],
          expected: [
            { taskId: 'abc271_c', priority: 1, comment: '' },
            { taskId: 'abc334_c', priority: 2, comment: '' },
            { taskId: 'abc307_c', priority: 3, comment: '' },
            { taskId: 'abc319_c', priority: 4, comment: '' },
            { taskId: 'abc322_d', priority: 5, comment: '' },
            { taskId: 'abc347_c', priority: 6, comment: '' },
            { taskId: 'abc359_c', priority: 7, comment: '' },
          ],
        },
        {
          workBookTasks: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
          selectedIndexes: [2, 0, 4, 5], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc347',
              task_table_index: 'C',
              task_id: 'abc347_c',
              title: 'C. Ideal Holidays',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc359',
              task_table_index: 'C',
              task_id: 'abc359_c',
              title: 'C. Tile Distance 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc334',
              task_table_index: 'C',
              task_id: 'abc334_c',
              title: 'C. Socks 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc271',
              task_table_index: 'C',
              task_id: 'abc271_c',
              title: 'C. Manga',
              grade: TaskGrade.PENDING,
            },
          ],
          expected: [
            { taskId: 'abc359_c', priority: 1, comment: '' },
            { taskId: 'abc307_c', priority: 2, comment: '' },
            { taskId: 'abc319_c', priority: 3, comment: '' },
            { taskId: 'abc347_c', priority: 4, comment: '' },
            { taskId: 'abc334_c', priority: 5, comment: '' },
            { taskId: 'abc271_c', priority: 6, comment: '' },
            { taskId: 'abc322_d', priority: 7, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when the selected index is given a negative value to existing workbook tasks', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
          selectedIndexes: [-1, -2, 0, 0], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc347',
              task_table_index: 'C',
              task_id: 'abc347_c',
              title: 'C. Ideal Holidays',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc359',
              task_table_index: 'C',
              task_id: 'abc359_c',
              title: 'C. Tile Distance 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc334',
              task_table_index: 'C',
              task_id: 'abc334_c',
              title: 'C. Socks 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc271',
              task_table_index: 'C',
              task_id: 'abc271_c',
              title: 'C. Manga',
              grade: TaskGrade.PENDING,
            },
          ],
          expected: [
            { taskId: 'abc271_c', priority: 1, comment: '' },
            { taskId: 'abc334_c', priority: 2, comment: '' },
            { taskId: 'abc359_c', priority: 3, comment: '' },
            { taskId: 'abc347_c', priority: 4, comment: '' },
            { taskId: 'abc307_c', priority: 5, comment: '' },
            { taskId: 'abc319_c', priority: 6, comment: '' },
            { taskId: 'abc322_d', priority: 7, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when the selected index is given a value greater than the number of workBookTasks to existing workbook tasks', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: [
            { taskId: 'abc307_c', priority: 1, comment: '' },
            { taskId: 'abc319_c', priority: 2, comment: '' },
            { taskId: 'abc322_d', priority: 3, comment: '' },
          ],
          selectedIndexes: [4, 200, 0, 0], // 0-indexed
          selectedTasks: [
            {
              contest_id: 'abc347',
              task_table_index: 'C',
              task_id: 'abc347_c',
              title: 'C. Ideal Holidays',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc359',
              task_table_index: 'C',
              task_id: 'abc359_c',
              title: 'C. Tile Distance 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc334',
              task_table_index: 'C',
              task_id: 'abc334_c',
              title: 'C. Socks 2',
              grade: TaskGrade.Q1,
            },
            {
              contest_id: 'abc271',
              task_table_index: 'C',
              task_id: 'abc271_c',
              title: 'C. Manga',
              grade: TaskGrade.PENDING,
            },
          ],
          expected: [
            { taskId: 'abc271_c', priority: 1, comment: '' },
            { taskId: 'abc334_c', priority: 2, comment: '' },
            { taskId: 'abc307_c', priority: 3, comment: '' },
            { taskId: 'abc319_c', priority: 4, comment: '' },
            { taskId: 'abc322_d', priority: 5, comment: '' },
            { taskId: 'abc347_c', priority: 6, comment: '' },
            { taskId: 'abc359_c', priority: 7, comment: '' },
          ],
        },
      ];

      runTests(
        'updateWorkBookTasks',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasks) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTasks(workBookTasks, currentSelectedIndex, currentSelectedTask);
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForWorkBookTasks,
      testFunction: (testCase: TestCaseForWorkBookTasks) => void,
    ) {
      test.each(testCases)(
        `${testName}(workBookTasks: $workBookTasks, selectedIndexes: $selectedIndexes, selectedTasks: $selectedTasks)`,
        testFunction,
      );
    }
  });
});
