import { expect, test } from 'vitest';

import { runTests } from '../common/test_helpers';
import * as TestCasesForTaskUrl from './test_cases/task_url';
import type { TestCaseForTaskUrl } from './test_cases/task_url';
import {
  taskResultsForUserId2,
  taskResultsForUserId3,
  taskResultsForUserId4,
  taskResultsForUserId5,
  threeWorkBookTasks,
  tasksForVerificationOfOrder,
} from './test_cases/task_results';
import {
  getTaskUrl,
  countAcceptedTasks,
  countAllTasks,
  areAllTasksAccepted,
  compareByContestIdAndTaskId,
  removeTaskIndexFromTitle,
} from '$lib/utils/task';
import type { WorkBookTaskBase } from '$lib/types/workbook';
import { type TaskResult, type TaskResults } from '$lib/types/task';

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

type TestCaseForNewTitle = {
  title: string;
  taskTableIndex: string;
  expected: string;
};

type TestCasesForNewTitle = TestCaseForNewTitle[];

describe('Task', () => {
  describe('task url', () => {
    describe('when contest ids and task ids for AtCoder are given', () => {
      TestCasesForTaskUrl.atCoderTasks.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, taskId, expected }: TestCaseForTaskUrl) => {
          expect(getTaskUrl(contestId, taskId)).toBe(expected);
        });
      });
    });

    describe('when contest ids and task ids for AOJ courses are given', () => {
      TestCasesForTaskUrl.aojCourses.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, taskId, expected }: TestCaseForTaskUrl) => {
          expect(getTaskUrl(contestId, taskId)).toBe(expected);
        });
      });
    });

    describe('when contest ids and task ids for AOJ PCK (Prelim and Final) are given', () => {
      TestCasesForTaskUrl.aojPck.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, taskId, expected }: TestCaseForTaskUrl) => {
          expect(getTaskUrl(contestId, taskId)).toBe(expected);
        });
      });
    });
  });

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
  });

  describe('compare by contest type, contest id and task id', () => {
    describe('when the different contest type tasks are given', () => {
      // Note: Due to the large number of ABC tasks, test cases are prioritized.
      const testCases: TestCasesForSortingTaskResults = [
        {
          first: tasksForVerificationOfOrder.ABS_1,
          second: tasksForVerificationOfOrder.abc999_a,
          expected: -1, // order: ABS_1, abc999_a
        },
        {
          first: tasksForVerificationOfOrder.abc999_a,
          second: tasksForVerificationOfOrder.APG4b_ct,
          expected: -1, // order: abc999_a, APG4b_ct
        },
        {
          first: tasksForVerificationOfOrder.abc999_a,
          second: tasksForVerificationOfOrder.typical90_a,
          expected: -2, // order: abc999_a, typical90_a
        },
        {
          first: tasksForVerificationOfOrder.abc999_a,
          second: tasksForVerificationOfOrder.dp_b,
          expected: -3, // order: abc999_a, dp_b
        },
        {
          first: tasksForVerificationOfOrder.abc999_a,
          second: tasksForVerificationOfOrder.tdpc_contest,
          expected: -4, // order: abc999_a, tpdc_contest
        },
        {
          first: tasksForVerificationOfOrder.abc999_a,
          second: tasksForVerificationOfOrder.past202309_a,
          expected: -5, // order: abc999_a, past202309_a
        },
        {
          first: tasksForVerificationOfOrder.abc999_a,
          second: tasksForVerificationOfOrder.acl_a,
          expected: -6, // order: abc999_a, acl_a
        },
        {
          first: tasksForVerificationOfOrder.abc999_a,
          second: tasksForVerificationOfOrder.joi2023_yo1c,
          expected: -7, // order: abc999_a, joi2023_yo1c
        },
        {
          first: tasksForVerificationOfOrder.abc999_a,
          second: tasksForVerificationOfOrder.tessoku_book_a,
          expected: -8, // order: abc999_a, tessoku_book_a
        },
        {
          first: tasksForVerificationOfOrder.abc999_a,
          second: tasksForVerificationOfOrder.math_and_algorithm_a,
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
          first: tasksForVerificationOfOrder.abc052_c,
          second: tasksForVerificationOfOrder.abc078_c,
          expected: 1, // order: abc078_c, abc052_c
        },
        {
          first: tasksForVerificationOfOrder.abc052_c,
          second: tasksForVerificationOfOrder.abc361_a,
          expected: 1, // order: abc361_a, abc052_c
        },
        {
          first: tasksForVerificationOfOrder.abc078_c,
          second: tasksForVerificationOfOrder.abc361_a,
          expected: 1, // order: abc361_a, abc078_c
        },
        {
          first: tasksForVerificationOfOrder.abc361_a,
          second: tasksForVerificationOfOrder.abc362_a,
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
          first: tasksForVerificationOfOrder.abc347_c,
          second: tasksForVerificationOfOrder.abc347_d,
          expected: -1, // order: abc347_c, abc347_d
        },
        {
          first: tasksForVerificationOfOrder.abc347_d,
          second: tasksForVerificationOfOrder.abc347_e,
          expected: -1, // order: abc347_d, abc347_e
        },
        {
          first: tasksForVerificationOfOrder.abc347_c,
          second: tasksForVerificationOfOrder.abc347_e,
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
  });

  describe('remove task index from title', () => {
    describe('when ABC371 is given', () => {
      const testCases: TestCasesForNewTitle = [
        {
          title: 'A. Jiro',
          taskTableIndex: 'A',
          expected: 'Jiro',
        },
        {
          title: 'B. Taro',
          taskTableIndex: 'B',
          expected: 'Taro',
        },
        {
          title: 'C. Make Isomorphic',
          taskTableIndex: 'C',
          expected: 'Make Isomorphic',
        },
        {
          title: 'D. 1D Country',
          taskTableIndex: 'D',
          expected: '1D Country',
        },
        {
          title: 'E. I Hate Sigma Problems',
          taskTableIndex: 'E',
          expected: 'I Hate Sigma Problems',
        },
        {
          title: 'F. Takahashi in Narrow Road',
          taskTableIndex: 'F',
          expected: 'Takahashi in Narrow Road',
        },
        {
          title: 'G. Lexicographically Smallest Permutation',
          taskTableIndex: 'G',
          expected: 'Lexicographically Smallest Permutation',
        },
      ];

      runTests(
        'removeTaskIndexFromTitle',
        testCases,
        ({ title, taskTableIndex, expected }: TestCaseForNewTitle) => {
          expect(removeTaskIndexFromTitle(title, taskTableIndex)).toBe(expected);
        },
      );
    });

    describe('when APG4b is given', () => {
      const testCases: TestCasesForNewTitle = [
        {
          title: 'EX1. 1.01',
          taskTableIndex: 'EX1',
          expected: '1.01',
        },
        {
          title: 'EX2. 1.02',
          taskTableIndex: 'EX2',
          expected: '1.02',
        },
        {
          title: 'EX9. 1.09',
          taskTableIndex: 'EX9',
          expected: '1.09',
        },
        {
          title: 'EX10. 1.10',
          taskTableIndex: 'EX10',
          expected: '1.10',
        },
        {
          title: 'EX16. 2.01',
          taskTableIndex: 'EX16',
          expected: '2.01',
        },
        {
          title: 'EX21. 2.06',
          taskTableIndex: 'EX21',
          expected: '2.06',
        },
        {
          title: 'EX26. 3.06',
          taskTableIndex: 'EX26',
          expected: '3.06',
        },
      ];
      runTests(
        'removeTaskIndexFromTitle',
        testCases,
        ({ title, taskTableIndex, expected }: TestCaseForNewTitle) => {
          expect(removeTaskIndexFromTitle(title, taskTableIndex)).toBe(expected);
        },
      );
    });
  });
});
