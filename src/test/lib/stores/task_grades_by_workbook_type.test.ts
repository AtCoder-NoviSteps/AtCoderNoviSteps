import { expect, test } from 'vitest';

import { taskGradesByWorkBookTypeStore } from '$lib/stores/task_grades_by_workbook_type';
import { WorkBookType } from '$lib/types/workbook';
import { TaskGrade } from '$lib/types/task';

type InitialState = {
  workBookType: WorkBookType;
  expected: TaskGrade;
};

type InitialStates = InitialState[];

interface UpdateOnce extends InitialState {
  newGrade: TaskGrade;
}

type UpdateOnces = UpdateOnce[];

interface UpdateTwice extends InitialState {
  firstTimeGradeUpdated: TaskGrade;
  secondTimeGradeUpdated: TaskGrade;
}

describe('Task grades by workbook type', () => {
  describe('initial values is 10Q in each workbook type', () => {
    const testCases = [
      { workBookType: WorkBookType.CURRICULUM, expected: TaskGrade.Q10 },
      { workBookType: WorkBookType.SOLUTION, expected: TaskGrade.Q10 },
    ];
    runTests('getTaskGrade', testCases, ({ workBookType, expected }: InitialState) => {
      expect(taskGradesByWorkBookTypeStore.getTaskGrade(workBookType)).toBe(expected);
    });

    function runTests(
      testName: string,
      testCases: InitialStates,
      testFunction: (testCase: InitialState) => void,
    ) {
      test.each(testCases)(`${testName}(workBookType: $workBookType)`, testFunction);
    }
  });

  describe('update task grade once', () => {
    const testCases = [
      { workBookType: WorkBookType.CURRICULUM, newGrade: TaskGrade.Q10, expected: TaskGrade.Q10 },
      { workBookType: WorkBookType.CURRICULUM, newGrade: TaskGrade.Q9, expected: TaskGrade.Q9 },
      { workBookType: WorkBookType.CURRICULUM, newGrade: TaskGrade.Q8, expected: TaskGrade.Q8 },
      { workBookType: WorkBookType.CURRICULUM, newGrade: TaskGrade.Q7, expected: TaskGrade.Q7 },
    ];
    runTests(
      'updateTaskGradeOnce',
      testCases,
      ({ workBookType, newGrade, expected }: UpdateOnce) => {
        taskGradesByWorkBookTypeStore.updateTaskGrade(workBookType, newGrade);
        expect(taskGradesByWorkBookTypeStore.getTaskGrade(workBookType)).toBe(expected);
      },
    );

    function runTests(
      testName: string,
      testCases: UpdateOnces,
      testFunction: (testCase: UpdateOnce) => void,
    ) {
      test.each(testCases)(
        `${testName}(workBookType: $workBookType, newGrade: $newGrade)`,
        testFunction,
      );
    }
  });

  describe('update task grade twice', () => {
    const testCases = [
      {
        workBookType: WorkBookType.CURRICULUM,
        firstTimeGradeUpdated: TaskGrade.Q10,
        secondTimeGradeUpdated: TaskGrade.Q10,
        expected: TaskGrade.Q10,
      },
      {
        workBookType: WorkBookType.CURRICULUM,
        firstTimeGradeUpdated: TaskGrade.Q9,
        secondTimeGradeUpdated: TaskGrade.Q10,
        expected: TaskGrade.Q10,
      },
      {
        workBookType: WorkBookType.CURRICULUM,
        firstTimeGradeUpdated: TaskGrade.Q9,
        secondTimeGradeUpdated: TaskGrade.Q9,
        expected: TaskGrade.Q9,
      },
      {
        workBookType: WorkBookType.CURRICULUM,
        firstTimeGradeUpdated: TaskGrade.Q9,
        secondTimeGradeUpdated: TaskGrade.Q8,
        expected: TaskGrade.Q8,
      },
      {
        workBookType: WorkBookType.CURRICULUM,
        firstTimeGradeUpdated: TaskGrade.Q6,
        secondTimeGradeUpdated: TaskGrade.Q7,
        expected: TaskGrade.Q7,
      },
    ];

    runTests(
      'updateTaskGradeTwice',
      testCases,
      ({ workBookType, firstTimeGradeUpdated, secondTimeGradeUpdated, expected }: UpdateTwice) => {
        taskGradesByWorkBookTypeStore.updateTaskGrade(workBookType, firstTimeGradeUpdated);
        taskGradesByWorkBookTypeStore.updateTaskGrade(workBookType, secondTimeGradeUpdated);
        expect(taskGradesByWorkBookTypeStore.getTaskGrade(workBookType)).toBe(expected);
      },
    );

    function runTests(
      testName: string,
      testCases: UpdateTwice[],
      testFunction: (testCase: UpdateTwice) => void,
    ) {
      test.each(testCases)(
        `${testName}(workBookType: $workBookType, firstTimeGradeUpdated: $firstTimeGradeUpdated, secondTimeGradeUpdated: $secondTimeGradeUpdated)`,
        testFunction,
      );
    }
  });
});
