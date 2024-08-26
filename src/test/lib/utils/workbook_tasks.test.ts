import { expect, test } from 'vitest';

import type {
  WorkBookTasksBase,
  WorkBookTasksCreate,
  WorkBookTasksEdit,
} from '$lib/types/workbook';
import type { Task, Tasks } from '$lib/types/task';
import { TaskGrade } from '$lib/types/task';

import {
  updateWorkBookTasks,
  updateWorkBookTaskForTable,
  addTaskToWorkBook,
} from '$lib/utils/workbook_tasks';

// Note: The selectedIndex and selectedTask are arrays so that one or more tasks can be tested with one object.
type TestCaseForWorkBookTasks = {
  workBookTasks: WorkBookTasksBase;
  selectedIndexes: number[];
  selectedTasks: Tasks;
  expected: WorkBookTasksBase;
};

type TestCasesForWorkBookTasks = TestCaseForWorkBookTasks[];

type TestCaseForWorkBookTasksForTable = {
  workBookTasks: WorkBookTasksCreate | WorkBookTasksEdit;
  selectedIndexes: number[];
  selectedTasks: Tasks;
  expected: WorkBookTasksCreate | WorkBookTasksEdit;
};

type TestCasesForWorkBookTasksForTable = TestCaseForWorkBookTasksForTable[];

type TestCaseForAddingTasksToWorkBook = {
  selectedTask: Task;
  workBookTasks: WorkBookTasksBase;
  workBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit;
  newWorkBookTaskIndex: number;
  expected: {
    updatedWorkBookTasks: WorkBookTasksBase;
    updatedWorkBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit;
  };
};

type TestCasesForAddingTasksToWorkBook = TestCaseForAddingTasksToWorkBook[];

// Note: Existing workbook tasks and new selected tasks to be added.
const baseWorkBookTasks = [
  { taskId: 'abc307_c', priority: 1, comment: '' },
  { taskId: 'abc319_c', priority: 2, comment: '' },
  { taskId: 'abc322_d', priority: 3, comment: '' },
];

const baseWorkBookTasksForTable = [
  { taskId: 'abc307_c', priority: 1, comment: '', contestId: 'abc307', title: 'C. Ideal Sheet' },
  { taskId: 'abc319_c', priority: 2, comment: '', contestId: 'abc319', title: 'C. False Hope' },
  { taskId: 'abc322_d', priority: 3, comment: '', contestId: 'abc322', title: 'D. Polyomino' },
];

const newSelectedTask = {
  contest_id: 'abc347',
  task_table_index: 'C',
  task_id: 'abc347_c',
  title: 'C. Ideal Holidays',
  grade: TaskGrade.Q1,
};

const newSelectedTasks = [
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
];

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
          workBookTasks: baseWorkBookTasks,
          selectedIndexes: [0, 0, 0, 0], // 0-indexed
          selectedTasks: newSelectedTasks,
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
          workBookTasks: baseWorkBookTasks,
          selectedIndexes: [3, 4, 5, 6], // 0-indexed
          selectedTasks: newSelectedTasks,
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
          workBookTasks: baseWorkBookTasks,
          selectedIndexes: [1, 1, 1, 1], // 0-indexed
          selectedTasks: newSelectedTasks,
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
          workBookTasks: baseWorkBookTasks,
          selectedIndexes: [0, 1, 2, 3], // 0-indexed
          selectedTasks: newSelectedTasks,
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
          workBookTasks: baseWorkBookTasks,
          selectedIndexes: [3, 4, 0, 0], // 0-indexed
          selectedTasks: newSelectedTasks,
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
          workBookTasks: baseWorkBookTasks,
          selectedIndexes: [2, 0, 4, 5], // 0-indexed
          selectedTasks: newSelectedTasks,
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
          workBookTasks: baseWorkBookTasks,
          selectedIndexes: [-1, -2, 0, 0], // 0-indexed
          selectedTasks: newSelectedTasks,
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
          workBookTasks: baseWorkBookTasks,
          selectedIndexes: [4, 200, 0, 0], // 0-indexed
          selectedTasks: newSelectedTasks,
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

  // Note: It is basically almost the same as the updateWorkBookTasks() method, so only minimal differences are tested.
  describe('create / update workbook tasks for table', () => {
    describe('when adding multiple tasks to an empty workbook task at the top', () => {
      const testCases: TestCasesForWorkBookTasksForTable = [
        {
          workBookTasks: [],
          selectedIndexes: [0, 0, 0, 0], // 0-indexed
          selectedTasks: newSelectedTasks,
          expected: [
            {
              taskId: 'abc271_c',
              priority: 1,
              comment: '',
              contestId: 'abc271',
              title: 'C. Manga',
            },
            {
              taskId: 'abc334_c',
              priority: 2,
              comment: '',
              contestId: 'abc334',
              title: 'C. Socks 2',
            },
            {
              taskId: 'abc359_c',
              priority: 3,
              comment: '',
              contestId: 'abc359',
              title: 'C. Tile Distance 2',
            },
            {
              taskId: 'abc347_c',
              priority: 4,
              comment: '',
              contestId: 'abc347',
              title: 'C. Ideal Holidays',
            },
          ],
        },
      ];

      runTests(
        'updateWorkBookTaskForTable',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasksForTable) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTaskForTable(
                workBookTasks,
                currentSelectedIndex,
                currentSelectedTask,
              );
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding multiple tasks to an empty workbook task at the end', () => {
      const testCases: TestCasesForWorkBookTasksForTable = [
        {
          workBookTasks: [],
          selectedIndexes: [3, 4, 5, 6], // 0-indexed
          selectedTasks: newSelectedTasks,
          expected: [
            {
              taskId: 'abc347_c',
              priority: 1,
              comment: '',
              contestId: 'abc347',
              title: 'C. Ideal Holidays',
            },
            {
              taskId: 'abc359_c',
              priority: 2,
              comment: '',
              contestId: 'abc359',
              title: 'C. Tile Distance 2',
            },
            {
              taskId: 'abc334_c',
              priority: 3,
              comment: '',
              contestId: 'abc334',
              title: 'C. Socks 2',
            },
            {
              taskId: 'abc271_c',
              priority: 4,
              comment: '',
              contestId: 'abc271',
              title: 'C. Manga',
            },
          ],
        },
      ];

      runTests(
        'updateWorkBookTaskForTable',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasksForTable) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTaskForTable(
                workBookTasks,
                currentSelectedIndex,
                currentSelectedTask,
              );
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding multiple tasks to existing workbook tasks at the top', () => {
      const testCases: TestCasesForWorkBookTasksForTable = [
        {
          workBookTasks: baseWorkBookTasksForTable,
          selectedIndexes: [0, 0, 0, 0], // 0-indexed
          selectedTasks: newSelectedTasks,
          expected: [
            {
              taskId: 'abc271_c',
              priority: 1,
              comment: '',
              contestId: 'abc271',
              title: 'C. Manga',
            },
            {
              taskId: 'abc334_c',
              priority: 2,
              comment: '',
              contestId: 'abc334',
              title: 'C. Socks 2',
            },
            {
              taskId: 'abc359_c',
              priority: 3,
              comment: '',
              contestId: 'abc359',
              title: 'C. Tile Distance 2',
            },
            {
              taskId: 'abc347_c',
              priority: 4,
              comment: '',
              contestId: 'abc347',
              title: 'C. Ideal Holidays',
            },
            {
              taskId: 'abc307_c',
              priority: 5,
              comment: '',
              contestId: 'abc307',
              title: 'C. Ideal Sheet',
            },
            {
              taskId: 'abc319_c',
              priority: 6,
              comment: '',
              contestId: 'abc319',
              title: 'C. False Hope',
            },
            {
              taskId: 'abc322_d',
              priority: 7,
              comment: '',
              contestId: 'abc322',
              title: 'D. Polyomino',
            },
          ],
        },
      ];

      runTests(
        'updateWorkBookTaskForTable',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasksForTable) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTaskForTable(
                workBookTasks,
                currentSelectedIndex,
                currentSelectedTask,
              );
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding multiple tasks to existing workbook tasks at the end', () => {
      const testCases: TestCasesForWorkBookTasksForTable = [
        {
          workBookTasks: baseWorkBookTasksForTable,
          selectedIndexes: [3, 4, 5, 6], // 0-indexed
          selectedTasks: newSelectedTasks,
          expected: [
            {
              taskId: 'abc307_c',
              priority: 1,
              comment: '',
              contestId: 'abc307',
              title: 'C. Ideal Sheet',
            },
            {
              taskId: 'abc319_c',
              priority: 2,
              comment: '',
              contestId: 'abc319',
              title: 'C. False Hope',
            },
            {
              taskId: 'abc322_d',
              priority: 3,
              comment: '',
              contestId: 'abc322',
              title: 'D. Polyomino',
            },
            {
              taskId: 'abc347_c',
              priority: 4,
              comment: '',
              contestId: 'abc347',
              title: 'C. Ideal Holidays',
            },
            {
              taskId: 'abc359_c',
              priority: 5,
              comment: '',
              contestId: 'abc359',
              title: 'C. Tile Distance 2',
            },
            {
              taskId: 'abc334_c',
              priority: 6,
              comment: '',
              contestId: 'abc334',
              title: 'C. Socks 2',
            },
            {
              taskId: 'abc271_c',
              priority: 7,
              comment: '',
              contestId: 'abc271',
              title: 'C. Manga',
            },
          ],
        },
      ];

      runTests(
        'updateWorkBookTaskForTable',
        testCases,
        ({
          workBookTasks,
          selectedIndexes: selectedIndex,
          selectedTasks: selectedTask,
          expected,
        }: TestCaseForWorkBookTasksForTable) => {
          const newWorkBookTasks = selectedIndex.reduce(
            (workBookTasks, currentSelectedIndex, index) => {
              const currentSelectedTask = selectedTask[index];
              return updateWorkBookTaskForTable(
                workBookTasks,
                currentSelectedIndex,
                currentSelectedTask,
              );
            },
            workBookTasks,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForWorkBookTasksForTable,
      testFunction: (testCase: TestCaseForWorkBookTasksForTable) => void,
    ) {
      test.each(testCases)(
        `${testName}(workBookTasks: $workBookTasks, selectedIndexes: $selectedIndexes, selectedTasks: $selectedTasks)`,
        testFunction,
      );
    }
  });

  // Note: It is basically almost the same as the updateWorkBookTasks() and updateWorkBookTaskForTable() method, so only minimal differences are tested.
  describe('add tasks to workbook tasks', () => {
    describe('when adding a task to an empty workbook task', () => {
      const testCases: TestCasesForAddingTasksToWorkBook = [
        {
          selectedTask: newSelectedTask,
          workBookTasks: [],
          workBookTasksForTable: [],
          newWorkBookTaskIndex: 0, // 0-indexed
          expected: {
            updatedWorkBookTasks: [
              {
                taskId: 'abc347_c',
                priority: 1,
                comment: '',
              },
            ],
            updatedWorkBookTasksForTable: [
              {
                taskId: 'abc347_c',
                priority: 1,
                comment: '',
                contestId: 'abc347',
                title: 'C. Ideal Holidays',
              },
            ],
          },
        },
      ];

      runTests(
        'addTaskToWorkBook',
        testCases,
        ({
          selectedTask,
          workBookTasks,
          workBookTasksForTable,
          newWorkBookTaskIndex,
          expected,
        }: TestCaseForAddingTasksToWorkBook) => {
          const newWorkBookTasks = addTaskToWorkBook(
            selectedTask,
            workBookTasks,
            workBookTasksForTable,
            newWorkBookTaskIndex,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding a task to existing workbook tasks at the top', () => {
      const testCases: TestCasesForAddingTasksToWorkBook = [
        {
          selectedTask: newSelectedTask,
          workBookTasks: baseWorkBookTasks,
          workBookTasksForTable: baseWorkBookTasksForTable,
          newWorkBookTaskIndex: 0, // 0-indexed
          expected: {
            updatedWorkBookTasks: [
              {
                taskId: 'abc347_c',
                priority: 1,
                comment: '',
              },
              {
                taskId: 'abc307_c',
                priority: 2,
                comment: '',
              },
              {
                taskId: 'abc319_c',
                priority: 3,
                comment: '',
              },
              {
                taskId: 'abc322_d',
                priority: 4,
                comment: '',
              },
            ],
            updatedWorkBookTasksForTable: [
              {
                taskId: 'abc347_c',
                priority: 1,
                comment: '',
                contestId: 'abc347',
                title: 'C. Ideal Holidays',
              },
              {
                taskId: 'abc307_c',
                priority: 2,
                comment: '',
                contestId: 'abc307',
                title: 'C. Ideal Sheet',
              },
              {
                taskId: 'abc319_c',
                priority: 3,
                comment: '',
                contestId: 'abc319',
                title: 'C. False Hope',
              },
              {
                taskId: 'abc322_d',
                priority: 4,
                comment: '',
                contestId: 'abc322',
                title: 'D. Polyomino',
              },
            ],
          },
        },
      ];

      runTests(
        'addTaskToWorkBook',
        testCases,
        ({
          selectedTask,
          workBookTasks,
          workBookTasksForTable,
          newWorkBookTaskIndex,
          expected,
        }: TestCaseForAddingTasksToWorkBook) => {
          const newWorkBookTasks = addTaskToWorkBook(
            selectedTask,
            workBookTasks,
            workBookTasksForTable,
            newWorkBookTaskIndex,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding a task to existing workbook tasks at the end', () => {
      const testCases: TestCasesForAddingTasksToWorkBook = [
        {
          selectedTask: newSelectedTask,
          workBookTasks: baseWorkBookTasks,
          workBookTasksForTable: baseWorkBookTasksForTable,
          newWorkBookTaskIndex: 3, // 0-indexed
          expected: {
            updatedWorkBookTasks: [
              {
                taskId: 'abc307_c',
                priority: 1,
                comment: '',
              },
              {
                taskId: 'abc319_c',
                priority: 2,
                comment: '',
              },
              {
                taskId: 'abc322_d',
                priority: 3,
                comment: '',
              },
              {
                taskId: 'abc347_c',
                priority: 4,
                comment: '',
              },
            ],
            updatedWorkBookTasksForTable: [
              {
                taskId: 'abc307_c',
                priority: 1,
                comment: '',
                contestId: 'abc307',
                title: 'C. Ideal Sheet',
              },
              {
                taskId: 'abc319_c',
                priority: 2,
                comment: '',
                contestId: 'abc319',
                title: 'C. False Hope',
              },
              {
                taskId: 'abc322_d',
                priority: 3,
                comment: '',
                contestId: 'abc322',
                title: 'D. Polyomino',
              },
              {
                taskId: 'abc347_c',
                priority: 4,
                comment: '',
                contestId: 'abc347',
                title: 'C. Ideal Holidays',
              },
            ],
          },
        },
      ];

      runTests(
        'addTaskToWorkBook',
        testCases,
        ({
          selectedTask,
          workBookTasks,
          workBookTasksForTable,
          newWorkBookTaskIndex,
          expected,
        }: TestCaseForAddingTasksToWorkBook) => {
          const newWorkBookTasks = addTaskToWorkBook(
            selectedTask,
            workBookTasks,
            workBookTasksForTable,
            newWorkBookTaskIndex,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    describe('when adding a task to existing workbook tasks at radom', () => {
      const testCases: TestCasesForAddingTasksToWorkBook = [
        {
          selectedTask: newSelectedTask,
          workBookTasks: baseWorkBookTasks,
          workBookTasksForTable: baseWorkBookTasksForTable,
          newWorkBookTaskIndex: 1, // 0-indexed
          expected: {
            updatedWorkBookTasks: [
              {
                taskId: 'abc307_c',
                priority: 1,
                comment: '',
              },
              {
                taskId: 'abc347_c',
                priority: 2,
                comment: '',
              },
              {
                taskId: 'abc319_c',
                priority: 3,
                comment: '',
              },
              {
                taskId: 'abc322_d',
                priority: 4,
                comment: '',
              },
            ],
            updatedWorkBookTasksForTable: [
              {
                taskId: 'abc307_c',
                priority: 1,
                comment: '',
                contestId: 'abc307',
                title: 'C. Ideal Sheet',
              },
              {
                taskId: 'abc347_c',
                priority: 2,
                comment: '',
                contestId: 'abc347',
                title: 'C. Ideal Holidays',
              },
              {
                taskId: 'abc319_c',
                priority: 3,
                comment: '',
                contestId: 'abc319',
                title: 'C. False Hope',
              },
              {
                taskId: 'abc322_d',
                priority: 4,
                comment: '',
                contestId: 'abc322',
                title: 'D. Polyomino',
              },
            ],
          },
        },
        {
          selectedTask: newSelectedTask,
          workBookTasks: baseWorkBookTasks,
          workBookTasksForTable: baseWorkBookTasksForTable,
          newWorkBookTaskIndex: 2, // 0-indexed
          expected: {
            updatedWorkBookTasks: [
              {
                taskId: 'abc307_c',
                priority: 1,
                comment: '',
              },
              {
                taskId: 'abc319_c',
                priority: 2,
                comment: '',
              },
              {
                taskId: 'abc347_c',
                priority: 3,
                comment: '',
              },
              {
                taskId: 'abc322_d',
                priority: 4,
                comment: '',
              },
            ],
            updatedWorkBookTasksForTable: [
              {
                taskId: 'abc307_c',
                priority: 1,
                comment: '',
                contestId: 'abc307',
                title: 'C. Ideal Sheet',
              },
              {
                taskId: 'abc319_c',
                priority: 2,
                comment: '',
                contestId: 'abc319',
                title: 'C. False Hope',
              },
              {
                taskId: 'abc347_c',
                priority: 3,
                comment: '',
                contestId: 'abc347',
                title: 'C. Ideal Holidays',
              },
              {
                taskId: 'abc322_d',
                priority: 4,
                comment: '',
                contestId: 'abc322',
                title: 'D. Polyomino',
              },
            ],
          },
        },
      ];

      runTests(
        'addTaskToWorkBook',
        testCases,
        ({
          selectedTask,
          workBookTasks,
          workBookTasksForTable,
          newWorkBookTaskIndex,
          expected,
        }: TestCaseForAddingTasksToWorkBook) => {
          const newWorkBookTasks = addTaskToWorkBook(
            selectedTask,
            workBookTasks,
            workBookTasksForTable,
            newWorkBookTaskIndex,
          );
          expect(newWorkBookTasks).toStrictEqual(expected);
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForAddingTasksToWorkBook,
      testFunction: (testCase: TestCaseForAddingTasksToWorkBook) => void,
    ) {
      test.each(testCases)(
        `${testName}(selectedTask: $selectedTask, workBookTasks: $workBookTasks, workBookTasksForTable: $workBookTasksForTable, newWorkBookTaskIndex: $newWorkBookTaskIndex)`,
        testFunction,
      );
    }
  });
});
