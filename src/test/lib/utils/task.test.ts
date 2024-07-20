import { expect, test } from 'vitest';

import {
  countAcceptedTasks,
  countAllTasks,
  areAllTasksAccepted,
  compareByContestIdAndTaskId,
} from '$lib/utils/task';
import type { WorkBookTaskBase } from '$lib/types/workbook';
import type { TaskResult, TaskResults } from '$lib/types/task';

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

type TestCaseForSortingTaskResults = {
  first: TaskResult;
  second: TaskResult;
  expected: number;
};

type TestCasesForSortingTaskResults = TestCaseForSortingTaskResults[];

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

const ABS_1: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'ac',
  status_id: '1',
  submission_status_image_path: 'ac.png',
  submission_status_label_name: 'AC',
  contest_id: 'abs',
  task_table_index: '1',
  task_id: 'practice_1',
  title: 'Welcome to AtCoder',
  grade: 'Q10',
  updated_at: new Date(),
};
const abc999_a: TaskResult = {
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
};
const abc052_c: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'wa',
  status_id: '3',
  submission_status_image_path: 'wa.png',
  submission_status_label_name: '挑戦中',
  contest_id: 'abc052',
  task_table_index: 'C',
  task_id: 'arc067_a',
  title: 'C. Factors of Factorial',
  grade: 'Q3',
  updated_at: new Date(),
};
const abc078_c: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'wa',
  status_id: '3',
  submission_status_image_path: 'wa.png',
  submission_status_label_name: '挑戦中',
  contest_id: 'abc078',
  task_table_index: 'C',
  task_id: 'arc085_a',
  title: 'C. HSI',
  grade: 'Q3',
  updated_at: new Date(),
};
const abc347_c: TaskResult = {
  is_ac: false,
  user_id: userId2,
  status_name: 'ns',
  status_id: '4',
  submission_status_image_path: 'ns.png',
  submission_status_label_name: '未挑戦',
  contest_id: 'abc347',
  task_table_index: 'C',
  task_id: 'abc347_c',
  title: 'C. Ideal Holidays',
  grade: 'Q1',
  updated_at: new Date(),
};
const abc347_d: TaskResult = {
  is_ac: false,
  user_id: userId2,
  status_name: 'ns',
  status_id: '4',
  submission_status_image_path: 'ns.png',
  submission_status_label_name: '未挑戦',
  contest_id: 'abc347',
  task_table_index: 'D',
  task_id: 'abc347_d',
  title: 'D. Popcount and XOR',
  grade: 'Q1',
  updated_at: new Date(),
};
const abc347_e: TaskResult = {
  is_ac: false,
  user_id: userId2,
  status_name: 'ns',
  status_id: '4',
  submission_status_image_path: 'ns.png',
  submission_status_label_name: '未挑戦',
  contest_id: 'abc347',
  task_table_index: 'E',
  task_id: 'abc347_e',
  title: 'E. Set Add Query',
  grade: 'Q1',
  updated_at: new Date(),
};
const abc361_a: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'ac',
  status_id: '1',
  submission_status_image_path: 'ac.png',
  submission_status_label_name: 'AC',
  contest_id: 'abc361',
  task_table_index: 'A',
  task_id: 'abc361_a',
  title: 'A. Insert',
  grade: 'Q7',
  updated_at: new Date(),
};
const abc362_a: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'ac',
  status_id: '1',
  submission_status_image_path: 'ac.png',
  submission_status_label_name: 'AC',
  contest_id: 'abc362',
  task_table_index: 'A',
  task_id: 'abc362_a',
  title: 'A. Buy a Pen',
  grade: 'Q8',
  updated_at: new Date(),
};
const APG4b_ct: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'ac',
  status_id: '1',
  submission_status_image_path: 'ac.png',
  submission_status_label_name: 'AC',
  contest_id: 'APG4b',
  task_table_index: 'EX3',
  task_id: 'APG4b_ct',
  title: 'EX3. 1.03',
  grade: 'Q9',
  updated_at: new Date(),
};
const typical90_a: TaskResult = {
  is_ac: false,
  user_id: userId2,
  status_name: 'wa',
  status_id: '3',
  submission_status_image_path: 'wa.png',
  submission_status_label_name: '挑戦中',
  contest_id: 'typical90',
  task_table_index: 'A',
  task_id: 'typical90_a',
  title: '001. Yokan Party（★4）',
  grade: 'Q2',
  updated_at: new Date(),
};
const dp_b: TaskResult = {
  is_ac: false,
  user_id: userId2,
  status_name: 'ns',
  status_id: '4',
  submission_status_image_path: 'ns.png',
  submission_status_label_name: '未挑戦',
  contest_id: 'dp',
  task_table_index: 'B',
  task_id: 'dp_b',
  title: 'B. Frog 2',
  grade: 'Q4',
  updated_at: new Date(),
};
const tdpc_contest: TaskResult = {
  is_ac: false,
  user_id: userId2,
  status_name: 'ns',
  status_id: '4',
  submission_status_image_path: 'ns.png',
  submission_status_label_name: '未挑戦',
  contest_id: 'tdpc',
  task_table_index: 'contest',
  task_id: 'tdpc_contest',
  title: 'A. ツバメ',
  grade: 'PENDING',
  updated_at: new Date(),
};
const acl_a: TaskResult = {
  is_ac: false,
  user_id: userId2,
  status_name: 'ns',
  status_id: '4',
  submission_status_image_path: 'ns.png',
  submission_status_label_name: '未挑戦',
  contest_id: 'practice2',
  task_table_index: 'A',
  task_id: 'practice2_a',
  title: 'A. Disjoint Set Union',
  grade: 'PENDING',
  updated_at: new Date(),
};
const past202309_a: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'ac',
  status_id: '1',
  submission_status_image_path: 'ac.png',
  submission_status_label_name: 'AC',
  contest_id: 'past16-open',
  task_table_index: 'A',
  task_id: 'past202309_a',
  title: 'A. ツバメ',
  grade: 'PENDING',
  updated_at: new Date(),
};
const joi2023_yo1c: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'ac',
  status_id: '1',
  submission_status_image_path: 'ac.png',
  submission_status_label_name: 'AC',
  contest_id: 'joi2023_yo1c',
  task_table_index: 'B',
  task_id: 'joi2023_yo1c_b',
  title: 'B. 11 月 (November)',
  grade: 'Q9',
  updated_at: new Date(),
};
const tessoku_book_a: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'ac',
  status_id: '1',
  submission_status_image_path: 'ac.png',
  submission_status_label_name: 'AC',
  contest_id: 'tessoku-book',
  task_table_index: 'A',
  task_id: 'tessoku_book_a',
  title: 'A01. The First Problem',
  grade: 'Q10',
  updated_at: new Date(),
};
const math_and_algorithm_a: TaskResult = {
  is_ac: true,
  user_id: userId2,
  status_name: 'ac',
  status_id: '1',
  submission_status_image_path: 'ac.png',
  submission_status_label_name: 'AC',
  contest_id: 'math-and-algorithm',
  task_table_index: 'A',
  task_id: 'math_and_algorithm_a',
  title: '001. Print 5+N',
  grade: 'Q10',
  updated_at: new Date(),
};

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

  describe('compare by contest type, contest id and task id', () => {
    describe('when the different contest type tasks are given', () => {
      // Note: Due to the large number of ABC tasks, test cases are prioritized.
      const testCases: TestCasesForSortingTaskResults = [
        {
          first: ABS_1,
          second: abc999_a,
          expected: -1, // order: ABS_1, abc999_a
        },
        {
          first: abc999_a,
          second: APG4b_ct,
          expected: -1, // order: abc999_a, APG4b_ct
        },
        {
          first: abc999_a,
          second: typical90_a,
          expected: -2, // order: abc999_a, typical90_a
        },
        {
          first: abc999_a,
          second: dp_b,
          expected: -3, // order: abc999_a, dp_b
        },
        {
          first: abc999_a,
          second: tdpc_contest,
          expected: -4, // order: abc999_a, tpdc_contest
        },
        {
          first: abc999_a,
          second: past202309_a,
          expected: -5, // order: abc999_a, past202309_a
        },
        {
          first: abc999_a,
          second: acl_a,
          expected: -6, // order: abc999_a, acl_a
        },
        {
          first: abc999_a,
          second: joi2023_yo1c,
          expected: -7, // order: abc999_a, joi2023_yo1c
        },
        {
          first: abc999_a,
          second: tessoku_book_a,
          expected: -8, // order: abc999_a, tessoku_book_a
        },
        {
          first: abc999_a,
          second: math_and_algorithm_a,
          expected: -9, // order: abc999_a, math_and_algorithm_a
        },
      ];

      runTests(
        'compareByContestIdAndTaskId',
        testCases,
        ({ first, second, expected }: TestCaseForSortingTaskResults) => {
          expect(compareByContestIdAndTaskId(first, second)).toBe(expected);
        },
      );
    });

    describe('when different contests are given for the same contest type', () => {
      const testCases: TestCasesForSortingTaskResults = [
        {
          first: abc052_c,
          second: abc078_c,
          expected: 1, // order: abc078_c, abc052_c
        },
        {
          first: abc052_c,
          second: abc361_a,
          expected: 1, // order: abc361_a, abc052_c
        },
        {
          first: abc078_c,
          second: abc361_a,
          expected: 1, // order: abc361_a, abc078_c
        },
        {
          first: abc361_a,
          second: abc362_a,
          expected: 1, // order: abc362_a, abc361_a
        },
      ];

      runTests(
        'compareByContestIdAndTaskId',
        testCases,
        ({ first, second, expected }: TestCaseForSortingTaskResults) => {
          expect(compareByContestIdAndTaskId(first, second)).toBe(expected);
        },
      );
    });

    describe('when different contests are given for the same contest type', () => {
      const testCases: TestCasesForSortingTaskResults = [
        {
          first: abc347_c,
          second: abc347_d,
          expected: -1, // order: abc347_c, abc347_d
        },
        {
          first: abc347_d,
          second: abc347_e,
          expected: -1, // order: abc347_d, abc347_e
        },
        {
          first: abc347_c,
          second: abc347_e,
          expected: -1, // order: abc347_c, abc347_e
        },
      ];

      runTests(
        'compareByContestIdAndTaskId',
        testCases,
        ({ first, second, expected }: TestCaseForSortingTaskResults) => {
          expect(compareByContestIdAndTaskId(first, second)).toBe(expected);
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForSortingTaskResults,
      testFunction: (testCase: TestCaseForSortingTaskResults) => void,
    ) {
      test.each(testCases)(
        `${testName}(first: $first.task_id, second: $second.task_id)`,
        testFunction,
      );
    }
  });
});
