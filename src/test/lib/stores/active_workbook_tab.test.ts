import { get } from 'svelte/store';
import { expect, test } from 'vitest';

import { activeWorkbookTabStore } from '$lib/stores/active_workbook_tab';
import { WorkBookType } from '$lib/types/workbook';

type InitialState = {
  workBookType: WorkBookType;
};

type InitialStates = InitialState[];

type UpdateOnce = InitialState;

type UpdateOnces = UpdateOnce[];

type UpdateTwice = {
  firstTimeUpdated: WorkBookType;
  secondTimeUpdated: WorkBookType;
};

describe('Active workbook tab store', () => {
  describe('initial values is true only for TEXTBOOK', () => {
    test('getActiveWorkbookTab(workBookType: TEXTBOOK)', () => {
      expect(get(activeWorkbookTabStore).get(WorkBookType.TEXTBOOK)).toBeTruthy();
    });
  });

  describe('initial value is false except for TEXTBOOK', () => {
    const testCases = [
      { workBookType: WorkBookType.SOLUTION },
      { workBookType: WorkBookType.CREATED_BY_USER },
    ];
    runTests('getActiveWorkbookTab', testCases, ({ workBookType }: InitialState) => {
      expect(get(activeWorkbookTabStore).get(workBookType)).toBeFalsy();
    });

    function runTests(
      testName: string,
      testCases: InitialStates,
      testFunction: (testCase: InitialState) => void,
    ) {
      test.each(testCases)(`${testName}(workBookType: $workBookType)`, testFunction);
    }
  });

  describe('update active workbook tab once', () => {
    const testCases = [
      { workBookType: WorkBookType.TEXTBOOK },
      { workBookType: WorkBookType.CREATED_BY_USER },
    ];
    runTests('updateActiveWorkBookTabOnce', testCases, ({ workBookType }: UpdateOnce) => {
      activeWorkbookTabStore.setActiveWorkbookTab(workBookType);

      const workBookTabs = get(activeWorkbookTabStore);
      workBookTabs.forEach((isOpen, activeWorkBookType) => {
        if (activeWorkBookType === workBookType) {
          expect(isOpen).toBeTruthy();
        } else {
          expect(isOpen).toBeFalsy();
        }
      });
    });

    function runTests(
      testName: string,
      testCases: UpdateOnces,
      testFunction: (testCase: UpdateOnce) => void,
    ) {
      test.each(testCases)(`${testName}(workBookType: $workBookType)`, testFunction);
    }
  });

  describe('update active workbook tab twice', () => {
    const testCases = [
      {
        firstTimeUpdated: WorkBookType.TEXTBOOK,
        secondTimeUpdated: WorkBookType.TEXTBOOK,
      },
      {
        firstTimeUpdated: WorkBookType.TEXTBOOK,
        secondTimeUpdated: WorkBookType.SOLUTION,
      },
      {
        firstTimeUpdated: WorkBookType.TEXTBOOK,
        secondTimeUpdated: WorkBookType.CREATED_BY_USER,
      },
      {
        firstTimeUpdated: WorkBookType.SOLUTION,
        secondTimeUpdated: WorkBookType.TEXTBOOK,
      },
      {
        firstTimeUpdated: WorkBookType.SOLUTION,
        secondTimeUpdated: WorkBookType.SOLUTION,
      },
      {
        firstTimeUpdated: WorkBookType.SOLUTION,
        secondTimeUpdated: WorkBookType.CREATED_BY_USER,
      },
      {
        firstTimeUpdated: WorkBookType.CREATED_BY_USER,
        secondTimeUpdated: WorkBookType.TEXTBOOK,
      },
      {
        firstTimeUpdated: WorkBookType.CREATED_BY_USER,
        secondTimeUpdated: WorkBookType.SOLUTION,
      },
      {
        firstTimeUpdated: WorkBookType.CREATED_BY_USER,
        secondTimeUpdated: WorkBookType.CREATED_BY_USER,
      },
    ];

    runTests(
      'updateTaskGradeTwice',
      testCases,
      ({ firstTimeUpdated, secondTimeUpdated }: UpdateTwice) => {
        activeWorkbookTabStore.setActiveWorkbookTab(firstTimeUpdated);
        activeWorkbookTabStore.setActiveWorkbookTab(secondTimeUpdated);

        const workBookTabs = get(activeWorkbookTabStore);
        workBookTabs.forEach((isOpen, activeWorkBookType) => {
          if (activeWorkBookType === secondTimeUpdated) {
            expect(isOpen).toBeTruthy();
          } else {
            expect(isOpen).toBeFalsy();
          }
        });
      },
    );

    function runTests(
      testName: string,
      testCases: UpdateTwice[],
      testFunction: (testCase: UpdateTwice) => void,
    ) {
      test.each(testCases)(
        `${testName}(firstTimeUpdated: $firstTimeUpdated, secondTimeUpdated: $secondTimeUpdated)`,
        testFunction,
      );
    }
  });
});
