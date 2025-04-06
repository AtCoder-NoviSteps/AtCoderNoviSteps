import { expect, test } from 'vitest';

import { runTests } from '../common/test_helpers';
import {
  getGradeOrder,
  taskGradeOrderInfinity,
  calcGradeMode,
  getTaskGradeLabel,
  toChangeTextColorIfNeeds,
  toChangeBorderColorIfNeeds,
} from '$lib/utils/task';

import { TaskGrade, type TaskGrades } from '$lib/types/task';

type TestCaseForTaskGradeOrder = {
  taskGrade: TaskGrade;
  expected: number;
};

type TestCasesForTaskGradeOrder = TestCaseForTaskGradeOrder[];

type TestCaseForTaskGradeMode = {
  taskGrades: TaskGrades;
  expected: TaskGrade;
};

type TestCasesForTaskGradeMode = TestCaseForTaskGradeMode[];

type TestCaseForTaskGradeLabel = {
  taskGrade: TaskGrade | string;
  expected: TaskGrade | string;
};

type TestCasesForTaskGradeLabel = TestCaseForTaskGradeLabel[];

type TestCaseForTaskGrade = {
  taskGrade: TaskGrade;
  expected: string;
};

type TestCasesForTaskGrade = TestCaseForTaskGrade[];

// See: src/lib/utils/task.ts
//
// Note: We split the test file by task and task grade because there are more test cases.
describe('Task grade', () => {
  describe('get task grade order', () => {
    describe('when task grades are given', () => {
      const testCases: TestCasesForTaskGradeOrder = [
        { taskGrade: TaskGrade.Q11, expected: 1 },
        { taskGrade: TaskGrade.Q10, expected: 2 },
        { taskGrade: TaskGrade.Q9, expected: 3 },
        { taskGrade: TaskGrade.Q2, expected: 10 },
        { taskGrade: TaskGrade.Q1, expected: 11 },
        { taskGrade: TaskGrade.D1, expected: 12 },
        { taskGrade: TaskGrade.D2, expected: 13 },
        { taskGrade: TaskGrade.D6, expected: 17 },
        { taskGrade: TaskGrade.PENDING, expected: taskGradeOrderInfinity },
      ];

      runTests('getGradeOrder', testCases, ({ taskGrade, expected }: TestCaseForTaskGradeOrder) => {
        expect(getGradeOrder(taskGrade)).toEqual(expected);
      });
    });

    function runTests(
      testName: string,
      testCases: TestCasesForTaskGradeOrder,
      testFunction: (testCase: TestCaseForTaskGradeOrder) => void,
    ) {
      test.each(testCases)(`${testName}(taskGrade: $taskGrade)`, testFunction);
    }
  });

  describe('calc task grade mode', () => {
    test('when no task grade is given', () => {
      expect(calcGradeMode([])).toEqual(TaskGrade.PENDING);
    });

    test('when pending is given', () => {
      expect(calcGradeMode([TaskGrade.PENDING])).toEqual(TaskGrade.PENDING);
    });

    describe('when a task grade is given', () => {
      const testCases: TestCasesForTaskGradeMode = [
        {
          taskGrades: [TaskGrade.Q10],
          expected: TaskGrade.Q10,
        },
        {
          taskGrades: [TaskGrade.Q9],
          expected: TaskGrade.Q9,
        },
        {
          taskGrades: [TaskGrade.Q8],
          expected: TaskGrade.Q8,
        },
        {
          taskGrades: [TaskGrade.Q7],
          expected: TaskGrade.Q7,
        },
        {
          taskGrades: [TaskGrade.Q6],
          expected: TaskGrade.Q6,
        },
        {
          taskGrades: [TaskGrade.Q2],
          expected: TaskGrade.Q2,
        },
        {
          taskGrades: [TaskGrade.Q1],
          expected: TaskGrade.Q1,
        },
        {
          taskGrades: [TaskGrade.D1],
          expected: TaskGrade.D1,
        },
        {
          taskGrades: [TaskGrade.D2],
          expected: TaskGrade.D2,
        },
        {
          taskGrades: [TaskGrade.D6],
          expected: TaskGrade.D6,
        },
      ];

      runTests('calcGradeMode', testCases, ({ taskGrades, expected }: TestCaseForTaskGradeMode) => {
        expect(calcGradeMode(taskGrades)).toEqual(expected);
      });
    });

    describe('when two same task grades are given', () => {
      const testCases: TestCasesForTaskGradeMode = [
        {
          taskGrades: [TaskGrade.PENDING, TaskGrade.PENDING],
          expected: TaskGrade.PENDING,
        },
        {
          taskGrades: [TaskGrade.Q10, TaskGrade.Q10],
          expected: TaskGrade.Q10,
        },
        {
          taskGrades: [TaskGrade.Q9, TaskGrade.Q9],
          expected: TaskGrade.Q9,
        },
        {
          taskGrades: [TaskGrade.Q5, TaskGrade.Q5],
          expected: TaskGrade.Q5,
        },
        {
          taskGrades: [TaskGrade.Q2, TaskGrade.Q2],
          expected: TaskGrade.Q2,
        },
        {
          taskGrades: [TaskGrade.Q1, TaskGrade.Q1],
          expected: TaskGrade.Q1,
        },
        {
          taskGrades: [TaskGrade.D1, TaskGrade.D1],
          expected: TaskGrade.D1,
        },
        {
          taskGrades: [TaskGrade.D2, TaskGrade.D2],
          expected: TaskGrade.D2,
        },
        {
          taskGrades: [TaskGrade.D6, TaskGrade.D6],
          expected: TaskGrade.D6,
        },
      ];

      runTests('calcGradeMode', testCases, ({ taskGrades, expected }: TestCaseForTaskGradeMode) => {
        expect(calcGradeMode(taskGrades)).toEqual(expected);
      });
    });

    describe('when two different task grades are given', () => {
      const testCases: TestCasesForTaskGradeMode = [
        {
          taskGrades: [TaskGrade.Q10, TaskGrade.PENDING],
          expected: TaskGrade.Q10,
        },
        {
          taskGrades: [TaskGrade.Q10, TaskGrade.Q9],
          expected: TaskGrade.Q10,
        },
        {
          taskGrades: [TaskGrade.Q10, TaskGrade.Q8],
          expected: TaskGrade.Q10,
        },
        {
          taskGrades: [TaskGrade.Q8, TaskGrade.Q9],
          expected: TaskGrade.Q9,
        },
        {
          taskGrades: [TaskGrade.Q5, TaskGrade.Q7],
          expected: TaskGrade.Q7,
        },
        {
          taskGrades: [TaskGrade.Q1, TaskGrade.Q2],
          expected: TaskGrade.Q2,
        },
        {
          taskGrades: [TaskGrade.D1, TaskGrade.Q1],
          expected: TaskGrade.Q1,
        },
        {
          taskGrades: [TaskGrade.D2, TaskGrade.D1],
          expected: TaskGrade.D1,
        },
        {
          taskGrades: [TaskGrade.D2, TaskGrade.D3],
          expected: TaskGrade.D2,
        },
      ];

      runTests('calcGradeMode', testCases, ({ taskGrades, expected }: TestCaseForTaskGradeMode) => {
        expect(calcGradeMode(taskGrades)).toEqual(expected);
      });
    });

    describe('when multiple task grades without pending are given', () => {
      const testCases: TestCasesForTaskGradeMode = [
        {
          taskGrades: [TaskGrade.Q10, TaskGrade.Q10, TaskGrade.Q10],
          expected: TaskGrade.Q10,
        },
        {
          taskGrades: [TaskGrade.Q10, TaskGrade.Q10, TaskGrade.Q9],
          expected: TaskGrade.Q10,
        },
        {
          taskGrades: [TaskGrade.Q9, TaskGrade.Q10, TaskGrade.Q9],
          expected: TaskGrade.Q9,
        },
        {
          taskGrades: [
            TaskGrade.Q9,
            TaskGrade.Q8,
            TaskGrade.Q8,
            TaskGrade.Q8,
            TaskGrade.Q7,
            TaskGrade.Q7,
            TaskGrade.Q7,
          ],
          expected: TaskGrade.Q8,
        },
        {
          taskGrades: [TaskGrade.Q5, TaskGrade.Q5, TaskGrade.Q5, TaskGrade.Q5],
          expected: TaskGrade.Q5,
        },
        {
          taskGrades: [
            TaskGrade.Q4,
            TaskGrade.Q4,
            TaskGrade.Q4,
            TaskGrade.Q4,
            TaskGrade.Q5,
            TaskGrade.Q5,
            TaskGrade.Q5,
          ],
          expected: TaskGrade.Q4,
        },
        {
          taskGrades: [
            TaskGrade.Q4,
            TaskGrade.Q3,
            TaskGrade.Q3,
            TaskGrade.Q1,
            TaskGrade.Q1,
            TaskGrade.Q1,
          ],
          expected: TaskGrade.Q1,
        },
        {
          taskGrades: [
            TaskGrade.Q6,
            TaskGrade.Q5,
            TaskGrade.Q3,
            TaskGrade.Q2,
            TaskGrade.Q1,
            TaskGrade.Q1,
            TaskGrade.Q1,
            TaskGrade.Q1,
            TaskGrade.Q1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
          ],
          expected: TaskGrade.D1,
        },
        {
          taskGrades: [
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
          ],
          expected: TaskGrade.D1,
        },
      ];

      runTests('calcGradeMode', testCases, ({ taskGrades, expected }: TestCaseForTaskGradeMode) => {
        expect(calcGradeMode(taskGrades)).toEqual(expected);
      });
    });

    describe('when multiple task grades with pending are given', () => {
      const testCases: TestCasesForTaskGradeMode = [
        {
          taskGrades: [
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
          ],
          expected: TaskGrade.PENDING,
        },
        {
          taskGrades: [
            TaskGrade.Q7,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
          ],
          expected: TaskGrade.Q7,
        },
        {
          taskGrades: [
            TaskGrade.Q9,
            TaskGrade.Q8,
            TaskGrade.Q8,
            TaskGrade.Q8,
            TaskGrade.Q7,
            TaskGrade.Q7,
            TaskGrade.Q7,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
          ],
          expected: TaskGrade.Q8,
        },
        {
          taskGrades: [
            TaskGrade.Q6,
            TaskGrade.Q5,
            TaskGrade.Q3,
            TaskGrade.Q2,
            TaskGrade.Q1,
            TaskGrade.Q1,
            TaskGrade.Q1,
            TaskGrade.Q1,
            TaskGrade.Q1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
          ],
          expected: TaskGrade.D1,
        },
        {
          taskGrades: [
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.D1,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
            TaskGrade.PENDING,
          ],
          expected: TaskGrade.D1,
        },
      ];

      runTests('calcGradeMode', testCases, ({ taskGrades, expected }: TestCaseForTaskGradeMode) => {
        expect(calcGradeMode(taskGrades)).toEqual(expected);
      });
    });

    function runTests(
      testName: string,
      testCases: TestCasesForTaskGradeMode,
      testFunction: (testCase: TestCaseForTaskGradeMode) => void,
    ) {
      test.each(testCases)(`${testName}(taskGrades: $taskGrades)`, testFunction);
    }
  });

  describe('get task grade label', () => {
    describe('when task grades are given', () => {
      const testCases: TestCasesForTaskGradeLabel = [
        {
          taskGrade: TaskGrade.Q11,
          expected: '11Q',
        },
        {
          taskGrade: TaskGrade.Q10,
          expected: '10Q',
        },
        {
          taskGrade: TaskGrade.Q9,
          expected: '9Q',
        },
        {
          taskGrade: TaskGrade.Q2,
          expected: '2Q',
        },
        {
          taskGrade: TaskGrade.Q1,
          expected: '1Q',
        },
        {
          taskGrade: TaskGrade.D1,
          expected: '1D',
        },
        {
          taskGrade: TaskGrade.D2,
          expected: '2D',
        },
        {
          taskGrade: TaskGrade.D6,
          expected: '6D',
        },
      ];

      runTests(
        'getTaskGradeLabel',
        testCases,
        ({ taskGrade, expected }: TestCaseForTaskGradeLabel) => {
          expect(getTaskGradeLabel(taskGrade)).toEqual(expected);
        },
      );
    });

    test('when pending is given', () => {
      expect(getTaskGradeLabel(TaskGrade.PENDING)).toEqual(TaskGrade.PENDING);
    });

    function runTests(
      testName: string,
      testCases: TestCasesForTaskGradeLabel,
      testFunction: (testCase: TestCaseForTaskGradeLabel) => void,
    ) {
      test.each(testCases)(`${testName}(taskGrade: $taskGrade)`, testFunction);
    }
  });

  describe('to change text color if needs', () => {
    describe('when task grades with black text color are given ', () => {
      const testCases: TestCasesForTaskGrade = [
        { taskGrade: TaskGrade.Q11, expected: 'text-black' },
        { taskGrade: TaskGrade.Q10, expected: 'text-black' },
        { taskGrade: TaskGrade.Q6, expected: 'text-black' },
        { taskGrade: TaskGrade.Q5, expected: 'text-black' },
        { taskGrade: TaskGrade.Q1, expected: 'text-black' },
        { taskGrade: TaskGrade.D1, expected: 'text-black' },
        { taskGrade: TaskGrade.D3, expected: 'text-black' },
      ];

      runTests(
        'toChangeTextColorIfNeeds',
        testCases,
        ({ taskGrade, expected }: TestCaseForTaskGrade) => {
          expect(toChangeTextColorIfNeeds(getTaskGradeLabel(taskGrade))).toBe(expected);
        },
      );
    });

    describe('when task grades with white text color are given', () => {
      const testCases: TestCasesForTaskGrade = [
        { taskGrade: TaskGrade.Q4, expected: 'text-white' },
        { taskGrade: TaskGrade.Q3, expected: 'text-white' },
        { taskGrade: TaskGrade.Q2, expected: 'text-white' },
        { taskGrade: TaskGrade.D2, expected: 'text-white' },
        { taskGrade: TaskGrade.D4, expected: 'text-white' },
        { taskGrade: TaskGrade.D5, expected: 'text-white' },
      ];

      runTests(
        'toChangeTextColorIfNeeds',
        testCases,
        ({ taskGrade, expected }: TestCaseForTaskGrade) => {
          expect(toChangeTextColorIfNeeds(getTaskGradeLabel(taskGrade))).toBe(expected);
        },
      );
    });

    describe('when task grades 6D is given', () => {
      const testCases: TestCasesForTaskGrade = [
        { taskGrade: TaskGrade.D6, expected: 'text-white' },
      ];

      runTests(
        'toChangeTextColorIfNeeds',
        testCases,
        ({ taskGrade, expected }: TestCaseForTaskGrade) => {
          expect(toChangeTextColorIfNeeds(getTaskGradeLabel(taskGrade))).toBe(expected);
        },
      );
    });
  });

  describe('to change border color if needs', () => {
    describe('when task grades from 11Q to 5D are given', () => {
      const testCasesForQGrades = [
        { taskGrade: TaskGrade.Q11, expected: 'border-white' },
        { taskGrade: TaskGrade.Q10, expected: 'border-white' },
        { taskGrade: TaskGrade.Q7, expected: 'border-white' },
        { taskGrade: TaskGrade.Q6, expected: 'border-white' },
        { taskGrade: TaskGrade.Q2, expected: 'border-white' },
        { taskGrade: TaskGrade.Q1, expected: 'border-white' },
      ];
      const testCasesForDGrades = [
        { taskGrade: TaskGrade.D1, expected: 'border-white' },
        { taskGrade: TaskGrade.D2, expected: 'border-white' },
        { taskGrade: TaskGrade.D4, expected: 'border-white' },
        { taskGrade: TaskGrade.D5, expected: 'border-white' },
      ];
      const testCases: TestCasesForTaskGrade = [...testCasesForQGrades, ...testCasesForDGrades];

      runTests(
        'toChangeBorderColorIfNeeds',
        testCases,
        ({ taskGrade, expected }: TestCaseForTaskGrade) => {
          expect(toChangeBorderColorIfNeeds(getTaskGradeLabel(taskGrade))).toBe(expected);
        },
      );
    });

    describe('when task grade 6D is given ', () => {
      const testCases: TestCasesForTaskGrade = [
        { taskGrade: TaskGrade.D6, expected: 'border-atcoder-bronze' },
      ];

      runTests(
        'toChangeBorderColorIfNeeds',
        testCases,
        ({ taskGrade, expected }: TestCaseForTaskGrade) => {
          expect(toChangeBorderColorIfNeeds(getTaskGradeLabel(taskGrade))).toBe(expected);
        },
      );
    });
  });
});
