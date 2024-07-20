import { expect, test } from 'vitest';

import { countAcceptedTasks, countAllTasks, areAllTasksAccepted } from '$lib/utils/task';
import type { WorkBookTaskBase } from '$lib/types/workbook';
import type { TaskResults } from '$lib/types/task';

type TestCaseForTaskResults = {
  taskResults: TaskResults;
  expected?: number;
};

type TestCasesForTaskResults = TestCaseForTaskResults[];

type TestCaseForWorkBookTasks = {
  taskResults?: TaskResults;
  workBookTasks: WorkBookTaskBase[];
  expected?: number;
};

type TestCasesForWorkBookTasks = TestCaseForWorkBookTasks[];

const userId2 = '2';
const userId3 = '3';
const userId4 = '4';
const userId5 = '5';

// 0 out of 3 is accepted
const taskResultsForUserId2 = [
  {
    is_ac: false,
    user_id: userId2,
    status_name: 'wa',
    status_id: '3',
    submission_status_image_path: 'wa.png',
    submission_status_label_name: '挑戦中',
    contest_id: 'abc999',
    task_table_index: 'A',
    task_id: 'abc999_a',
    title: 'A. hoge hoge',
    grade: 'Q7',
    updated_at: new Date(),
  },
  {
    is_ac: false,
    user_id: userId2,
    status_name: 'ns',
    status_id: '4',
    submission_status_image_path: 'ns.png',
    submission_status_label_name: '未挑戦',
    contest_id: 'abc999',
    task_table_index: 'B',
    task_id: 'abc999_b',
    title: 'B. Foo',
    grade: '6Q',
    updated_at: new Date(),
  },
  {
    is_ac: false,
    user_id: userId2,
    status_name: 'ns',
    status_id: '4',
    submission_status_image_path: 'ns.png',
    submission_status_label_name: '未挑戦',
    contest_id: 'abc999',
    task_table_index: 'C',
    task_id: 'abc999_c',
    title: 'C. Bar',
    grade: '4Q',
    updated_at: new Date(),
  },
];

// 2 out of 3 are accepted
const taskResultsForUserId3 = [
  {
    is_ac: true,
    user_id: userId3,
    status_name: 'ac',
    status_id: '1',
    submission_status_image_path: 'ac.png',
    submission_status_label_name: 'AC',
    contest_id: 'abc999',
    task_table_index: 'A',
    task_id: 'abc999_a',
    title: 'A. hoge hoge',
    grade: 'Q7',
    updated_at: new Date(),
  },
  {
    is_ac: true,
    user_id: userId3,
    status_name: 'ac',
    status_id: '1',
    submission_status_image_path: 'ac.png',
    submission_status_label_name: 'AC',
    contest_id: 'abc999',
    task_table_index: 'B',
    task_id: 'abc999_b',
    title: 'B. Foo',
    grade: '6Q',
    updated_at: new Date(),
  },
  {
    is_ac: false,
    user_id: userId3,
    status_name: 'wa',
    status_id: '3',
    submission_status_image_path: 'wa.png',
    submission_status_label_name: '挑戦中',
    contest_id: 'abc999',
    task_table_index: 'C',
    task_id: 'abc999_c',
    title: 'C. Bar',
    grade: '4Q',
    updated_at: new Date(),
  },
];

// 3 out of 3 are accepted
const taskResultsForUserId4 = [
  {
    is_ac: true,
    user_id: userId4,
    status_name: 'ac',
    status_id: '1',
    submission_status_image_path: 'ac.png',
    submission_status_label_name: 'AC',
    contest_id: 'abc999',
    task_table_index: 'A',
    task_id: 'abc999_a',
    title: 'A. hoge hoge',
    grade: 'Q7',
    updated_at: new Date(),
  },
  {
    is_ac: true,
    user_id: userId4,
    status_name: 'ac',
    status_id: '1',
    submission_status_image_path: 'ac.png',
    submission_status_label_name: 'AC',
    contest_id: 'abc999',
    task_table_index: 'B',
    task_id: 'abc999_b',
    title: 'B. Foo',
    grade: '6Q',
    updated_at: new Date(),
  },
  {
    is_ac: true,
    user_id: userId4,
    status_name: 'ac',
    status_id: '1',
    submission_status_image_path: 'ac.png',
    submission_status_label_name: 'AC',
    contest_id: 'abc999',
    task_table_index: 'C',
    task_id: 'abc999_c',
    title: 'C. Bar',
    grade: '4Q',
    updated_at: new Date(),
  },
];

// 4 out of 4 are accepted
const taskResultsForUserId5 = [
  {
    is_ac: true,
    user_id: userId5,
    status_name: 'ac',
    status_id: '1',
    submission_status_image_path: 'ac.png',
    submission_status_label_name: 'AC',
    contest_id: 'abc999',
    task_table_index: 'A',
    task_id: 'abc999_a',
    title: 'A. hoge hoge',
    grade: 'Q7',
    updated_at: new Date(),
  },
  {
    is_ac: true,
    user_id: userId5,
    status_name: 'ac',
    status_id: '1',
    submission_status_image_path: 'ac.png',
    submission_status_label_name: 'AC',
    contest_id: 'abc999',
    task_table_index: 'B',
    task_id: 'abc999_b',
    title: 'B. Foo',
    grade: '6Q',
    updated_at: new Date(),
  },
  {
    is_ac: true,
    user_id: userId5,
    status_name: 'ac',
    status_id: '1',
    submission_status_image_path: 'ac.png',
    submission_status_label_name: 'AC',
    contest_id: 'abc999',
    task_table_index: 'C',
    task_id: 'abc999_c',
    title: 'C. Bar',
    grade: '4Q',
    updated_at: new Date(),
  },
  {
    is_ac: true,
    user_id: userId5,
    status_name: 'ac',
    status_id: '1',
    submission_status_image_path: 'ac.png',
    submission_status_label_name: 'AC',
    contest_id: 'abc999',
    task_table_index: 'D',
    task_id: 'abc999_d',
    title: 'D. Fizz',
    grade: '1Q',
    updated_at: new Date(),
  },
];

const threeWorkBookTasks = [
  {
    taskId: 'abc999_a',
    priority: 1,
  },
  {
    taskId: 'abc999_b',
    priority: 2,
  },
  {
    taskId: 'abc999_c',
    priority: 3,
  },
];

describe('Task', () => {
  describe('count accepted tasks', () => {
    test('when empty task results are given', () => {
      expect(countAcceptedTasks([])).toBe(0);
    });

    describe('when 0 out of 3 are is_ac = true are given', () => {
      const testCases: TestCasesForTaskResults = [
        {
          taskResults: taskResultsForUserId2,
          expected: 0,
        },
      ];

      runTests(
        'countAcceptedTasks',
        testCases,
        ({ taskResults, expected }: TestCaseForTaskResults) => {
          expect(countAcceptedTasks(taskResults)).toBe(expected);
        },
      );
    });

    describe('when 2 out of 3 are is_ac = true given', () => {
      const testCases: TestCasesForTaskResults = [
        {
          taskResults: taskResultsForUserId3,
          expected: 2,
        },
      ];

      runTests(
        'countAcceptedTasks',
        testCases,
        ({ taskResults, expected }: TestCaseForTaskResults) => {
          expect(countAcceptedTasks(taskResults)).toBe(expected);
        },
      );
    });

    describe('when 3 out of 3 are is_ac = true given', () => {
      const testCases: TestCasesForTaskResults = [
        {
          taskResults: taskResultsForUserId4,
          expected: 3,
        },
      ];

      runTests(
        'countAcceptedTasks',
        testCases,
        ({ taskResults, expected }: TestCaseForTaskResults) => {
          expect(countAcceptedTasks(taskResults)).toBe(expected);
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForTaskResults,
      testFunction: (testCase: TestCaseForTaskResults) => void,
    ) {
      test.each(testCases)(`${testName}(taskResults: $taskResults)`, testFunction);
    }
  });

  describe('count all tasks using taskResults', () => {
    test('when empty task results are given', () => {
      expect(countAllTasks([])).toBe(0);
    });

    describe('when 3 taskResults are given', () => {
      const testCases: TestCasesForTaskResults = [
        {
          taskResults: taskResultsForUserId3,
          expected: 3,
        },
      ];

      runTests('countAllTasks', testCases, ({ taskResults, expected }: TestCaseForTaskResults) => {
        expect(countAllTasks(taskResults)).toBe(expected);
      });
    });

    function runTests(
      testName: string,
      testCases: TestCasesForTaskResults,
      testFunction: (testCase: TestCaseForTaskResults) => void,
    ) {
      test.each(testCases)(`${testName}(taskResults: $taskResults)`, testFunction);
    }
  });

  describe('count all tasks using WorkBookTaskBase[]', () => {
    test('when empty workbook tasks are given', () => {
      expect(countAllTasks([])).toBe(0);
    });

    describe('when 3 workbook tasks are given', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          workBookTasks: threeWorkBookTasks,
          expected: 3,
        },
      ];

      runTests(
        'countAllTasks',
        testCases,
        ({ workBookTasks, expected }: TestCaseForWorkBookTasks) => {
          expect(countAllTasks(workBookTasks)).toBe(expected);
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForWorkBookTasks,
      testFunction: (testCase: TestCaseForWorkBookTasks) => void,
    ) {
      test.each(testCases)(`${testName}(workBookTasks: $workBookTasks)`, testFunction);
    }
  });

  describe('are all tasks accepted using taskResults', () => {
    test('when empty task results are given', () => {
      expect(areAllTasksAccepted([], [])).toBeFalsy();
    });

    describe('when 0 out of 3 are is_ac = true given', () => {
      const testCases: TestCasesForTaskResults = [
        {
          taskResults: taskResultsForUserId2,
        },
      ];

      runTests('areAllTasksAccepted', testCases, ({ taskResults }: TestCaseForTaskResults) => {
        expect(areAllTasksAccepted(taskResults, taskResults)).toBeFalsy();
      });
    });

    describe('when 2 out of 3 are is_ac = true given', () => {
      const testCases: TestCasesForTaskResults = [
        {
          taskResults: taskResultsForUserId3,
        },
      ];

      runTests('areAllTasksAccepted', testCases, ({ taskResults }: TestCaseForTaskResults) => {
        expect(areAllTasksAccepted(taskResults, taskResults)).toBeFalsy();
      });
    });

    describe('when 3 out of 3 are is_ac = true given', () => {
      const testCases: TestCasesForTaskResults = [
        {
          taskResults: taskResultsForUserId4,
        },
      ];

      runTests('areAllTasksAccepted', testCases, ({ taskResults }: TestCaseForTaskResults) => {
        expect(areAllTasksAccepted(taskResults, taskResults)).toBeTruthy();
      });
    });

    describe('when 4 out of 4 are is_ac = true given', () => {
      const testCases: TestCasesForTaskResults = [
        {
          taskResults: taskResultsForUserId5,
        },
      ];

      runTests('areAllTasksAccepted', testCases, ({ taskResults }: TestCaseForTaskResults) => {
        expect(areAllTasksAccepted(taskResults, taskResults)).toBeTruthy();
      });
    });

    function runTests(
      testName: string,
      testCases: TestCasesForTaskResults,
      testFunction: (testCase: TestCaseForTaskResults) => void,
    ) {
      test.each(testCases)(`${testName}(taskResults: $taskResults)`, testFunction);
    }
  });

  describe('are all tasks accepted using WorkBookTaskBase[]', () => {
    test('when empty task results and workbook tasks are given', () => {
      expect(areAllTasksAccepted([], [])).toBeFalsy();
    });

    describe('when 0 out of 3 is is_ac = true task results and 3 workbook tasks are given', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          taskResults: taskResultsForUserId2,
          workBookTasks: threeWorkBookTasks,
        },
      ];

      runTests(
        'areAllTasksAccepted',
        testCases,
        ({ taskResults, workBookTasks }: TestCaseForWorkBookTasks) => {
          if (taskResults) {
            expect(areAllTasksAccepted(taskResults, workBookTasks)).toBeFalsy();
          }
        },
      );
    });

    describe('when 2 out of 3 are is_ac = true task results and 3 workbook tasks are given', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          taskResults: taskResultsForUserId3,
          workBookTasks: threeWorkBookTasks,
        },
      ];

      runTests(
        'areAllTasksAccepted',
        testCases,
        ({ taskResults, workBookTasks }: TestCaseForWorkBookTasks) => {
          if (taskResults) {
            expect(areAllTasksAccepted(taskResults, workBookTasks)).toBeFalsy();
          }
        },
      );
    });

    describe('when 3 out of 3 are is_ac = true task results and 3 workbook tasks are given', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          taskResults: taskResultsForUserId4,
          workBookTasks: threeWorkBookTasks,
        },
      ];

      runTests(
        'areAllTasksAccepted',
        testCases,
        ({ taskResults, workBookTasks }: TestCaseForWorkBookTasks) => {
          if (taskResults) {
            expect(areAllTasksAccepted(taskResults, workBookTasks)).toBeTruthy();
          }
        },
      );
    });

    describe('when 4 out of 4 are is_ac = true task results and 3 workbook tasks are given', () => {
      const testCases: TestCasesForWorkBookTasks = [
        {
          taskResults: taskResultsForUserId5,
          workBookTasks: threeWorkBookTasks,
        },
      ];

      runTests(
        'areAllTasksAccepted',
        testCases,
        ({ taskResults, workBookTasks }: TestCaseForWorkBookTasks) => {
          if (taskResults) {
            expect(areAllTasksAccepted(taskResults, workBookTasks)).toBeFalsy();
          }
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForWorkBookTasks,
      testFunction: (testCase: TestCaseForWorkBookTasks) => void,
    ) {
      test.each(testCases)(`${testName}(workBookTasks: $workBookTasks)`, testFunction);
    }
  });
});
