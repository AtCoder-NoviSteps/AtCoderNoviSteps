import { expect, test } from 'vitest';

import {
  classifyContest,
  getContestPriority,
  contestTypePriorities,
  getContestUrl,
  getContestNameLabel,
} from '$lib/utils/contest';
import { ContestType } from '$lib/types/contest';

type TestCaseForContestType = {
  contestId: string;
  expected: ContestType;
};

type TestCasesForContestType = TestCaseForContestType[];

type TestCaseForContestNameLabel = {
  contestId: string;
  expected: string;
};

type TestCasesForContestNameLabel = TestCaseForContestNameLabel[];

describe('Contest', () => {
  // TODO: Add ARC and AOI.
  describe('classify contest', () => {
    test('when contest_id is ABS', () => {
      expect(classifyContest('abs')).toEqual(ContestType.ABS);
    });

    describe('when contest_id contains ABC', () => {
      const testCases = [
        { contestId: 'abc001', expected: ContestType.ABC },
        { contestId: 'abc002', expected: ContestType.ABC },
        { contestId: 'abc099', expected: ContestType.ABC },
        { contestId: 'abc100', expected: ContestType.ABC },
        { contestId: 'abc101', expected: ContestType.ABC },
        { contestId: 'abc200', expected: ContestType.ABC },
        { contestId: 'abc201', expected: ContestType.ABC },
        { contestId: 'abc365', expected: ContestType.ABC },
        { contestId: 'abc999', expected: ContestType.ABC },
      ];

      runTests('classifyContest', testCases, ({ contestId, expected }: TestCaseForContestType) => {
        expect(classifyContest(contestId)).toEqual(expected);
      });
    });

    test('when contest_id starts with APG4b', () => {
      expect(classifyContest('APG4b')).toEqual(ContestType.APG4B);
    });

    test('when contest_id is typical90', () => {
      expect(classifyContest('typical90')).toEqual(ContestType.TYPICAL90);
    });

    test('when contest_id is dp (EDPC)', () => {
      expect(classifyContest('dp')).toEqual(ContestType.EDPC);
    });

    test('when contest_id is tdpc', () => {
      expect(classifyContest('tdpc')).toEqual(ContestType.TDPC);
    });

    describe('when contest_id contains past', () => {
      const testCases = [
        { contestId: 'past17-open', expected: ContestType.PAST },
        { contestId: 'past16-open', expected: ContestType.PAST },
        { contestId: 'past15-open', expected: ContestType.PAST },
        { contestId: 'past202303-open', expected: ContestType.PAST }, // PAST 14th
        { contestId: 'past202212-open', expected: ContestType.PAST }, // PAST 13rd
        { contestId: 'past202005-open', expected: ContestType.PAST }, // PAST 3rd
        { contestId: 'past202004-open', expected: ContestType.PAST }, // PAST 2nd
        { contestId: 'past201912-open', expected: ContestType.PAST }, // PAST 1st
      ];

      runTests('classifyContest', testCases, ({ contestId, expected }: TestCaseForContestType) => {
        expect(classifyContest(contestId)).toEqual(expected);
      });
    });

    test('when contest_id is practice2 (ACL practice)', () => {
      expect(classifyContest('practice2')).toEqual(ContestType.ACL_PRACTICE);
    });

    describe('when contest_id contains joi', () => {
      const testCases = [
        { contestId: 'joig2024-open', expected: ContestType.JOI },
        { contestId: 'joig2023-open', expected: ContestType.JOI },
        { contestId: 'joig2022-open', expected: ContestType.JOI },
        { contestId: 'joig2021-open', expected: ContestType.JOI },
        { contestId: 'joi2024yo1a', expected: ContestType.JOI },
        { contestId: 'joi2024yo1b', expected: ContestType.JOI },
        { contestId: 'joi2024yo1c', expected: ContestType.JOI },
        { contestId: 'joi2023yo1a', expected: ContestType.JOI },
        { contestId: 'joi2023yo1b', expected: ContestType.JOI },
        { contestId: 'joi2023yo1c', expected: ContestType.JOI },
        { contestId: 'joi2018yo', expected: ContestType.JOI },
      ];

      runTests('classifyContest', testCases, ({ contestId, expected }: TestCaseForContestType) => {
        expect(classifyContest(contestId)).toEqual(expected);
      });
    });

    test('when contest_id is tessoku-book', () => {
      expect(classifyContest('tessoku-book')).toEqual(ContestType.TESSOKU_BOOK);
    });

    test('when contest_id is math-and-algorithm', () => {
      expect(classifyContest('math-and-algorithm')).toEqual(ContestType.MATH_AND_ALGORITHM);
    });

    describe('when contest_id contains chokudai_S', () => {
      const testCases = [
        { contestId: 'chokudai_S001', expected: ContestType.OTHERS },
        { contestId: 'chokudai_S002', expected: ContestType.OTHERS },
      ];

      runTests('classifyContest', testCases, ({ contestId, expected }: TestCaseForContestType) => {
        expect(classifyContest(contestId)).toEqual(expected);
      });
    });

    function runTests(
      testName: string,
      testCases: TestCasesForContestType,
      testFunction: (testCase: TestCaseForContestType) => void,
    ) {
      test.each(testCases)(`${testName}(contestId: $contestId)`, testFunction);
    }
  });

  describe('get contest priority', () => {
    test('when contest_id is ABS', () => {
      expect(getContestPriority('abs')).toEqual(contestTypePriorities.get(ContestType.ABS));
    });

    describe('when contest_id contains ABC', () => {
      const testCases = [
        { contestId: 'abc001', expected: ContestType.ABC },
        { contestId: 'abc002', expected: ContestType.ABC },
        { contestId: 'abc099', expected: ContestType.ABC },
        { contestId: 'abc100', expected: ContestType.ABC },
        { contestId: 'abc101', expected: ContestType.ABC },
        { contestId: 'abc200', expected: ContestType.ABC },
        { contestId: 'abc201', expected: ContestType.ABC },
        { contestId: 'abc365', expected: ContestType.ABC },
        { contestId: 'abc999', expected: ContestType.ABC },
      ];

      runTests(
        'getContestPriority',
        testCases,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );
    });

    test('when contest_id starts with APG4b', () => {
      expect(getContestPriority('APG4b')).toEqual(contestTypePriorities.get(ContestType.APG4B));
    });

    test('when contest_id is typical90', () => {
      expect(getContestPriority('typical90')).toEqual(
        contestTypePriorities.get(ContestType.TYPICAL90),
      );
    });

    test('when contest_id is dp (EDPC)', () => {
      expect(getContestPriority('dp')).toEqual(contestTypePriorities.get(ContestType.EDPC));
    });

    test('when contest_id is tdpc', () => {
      expect(getContestPriority('tdpc')).toEqual(contestTypePriorities.get(ContestType.TDPC));
    });

    describe('when contest_id contains past', () => {
      const testCases = [
        { contestId: 'past17-open', expected: ContestType.PAST },
        { contestId: 'past16-open', expected: ContestType.PAST },
        { contestId: 'past15-open', expected: ContestType.PAST },
        { contestId: 'past202303-open', expected: ContestType.PAST }, // PAST 14th
        { contestId: 'past202212-open', expected: ContestType.PAST }, // PAST 13rd
        { contestId: 'past202005-open', expected: ContestType.PAST }, // PAST 3rd
        { contestId: 'past202004-open', expected: ContestType.PAST }, // PAST 2nd
        { contestId: 'past201912-open', expected: ContestType.PAST }, // PAST 1st
      ];

      runTests(
        'getContestPriority',
        testCases,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );
    });

    test('when contest_id is practice2 (ACL practice)', () => {
      expect(getContestPriority('practice2')).toEqual(
        contestTypePriorities.get(ContestType.ACL_PRACTICE),
      );
    });

    describe('when contest_id contains joi', () => {
      const testCases = [
        { contestId: 'joig2024-open', expected: ContestType.JOI },
        { contestId: 'joig2023-open', expected: ContestType.JOI },
        { contestId: 'joig2022-open', expected: ContestType.JOI },
        { contestId: 'joig2021-open', expected: ContestType.JOI },
        { contestId: 'joi2024yo1a', expected: ContestType.JOI },
        { contestId: 'joi2024yo1b', expected: ContestType.JOI },
        { contestId: 'joi2024yo1c', expected: ContestType.JOI },
        { contestId: 'joi2023yo1a', expected: ContestType.JOI },
        { contestId: 'joi2023yo1b', expected: ContestType.JOI },
        { contestId: 'joi2023yo1c', expected: ContestType.JOI },
        { contestId: 'joi2018yo', expected: ContestType.JOI },
      ];

      runTests(
        'getContestPriority',
        testCases,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );
    });

    test('when contest_id is tessoku-book', () => {
      expect(getContestPriority('tessoku-book')).toEqual(
        contestTypePriorities.get(ContestType.TESSOKU_BOOK),
      );
    });

    test('when contest_id is math-and-algorithm', () => {
      expect(getContestPriority('math-and-algorithm')).toEqual(
        contestTypePriorities.get(ContestType.MATH_AND_ALGORITHM),
      );
    });

    describe('when contest_id contains chokudai_S', () => {
      const testCases = [
        { contestId: 'chokudai_S001', expected: ContestType.OTHERS },
        { contestId: 'chokudai_S002', expected: ContestType.OTHERS },
      ];

      runTests(
        'getContestPriority',
        testCases,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForContestType,
      testFunction: (testCase: TestCaseForContestType) => void,
    ) {
      test.each(testCases)(`${testName}(contestId: $contestId)`, testFunction);
    }
  });

  describe('get contest url', () => {
    test('when contest_id is ABC365', () => {
      const contestId = 'abc365';
      const expected = 'https://atcoder.jp/contests/abc365';

      expect(getContestUrl(contestId)).toEqual(expected);
    });
  });

  describe('get contest name label', () => {
    describe('when contest_id contains ABC', () => {
      const testCases = [
        { contestId: 'abc001', expected: 'ABC001' },
        { contestId: 'abc002', expected: 'ABC002' },
        { contestId: 'abc099', expected: 'ABC099' },
        { contestId: 'abc100', expected: 'ABC100' },
        { contestId: 'abc101', expected: 'ABC101' },
        { contestId: 'abc200', expected: 'ABC200' },
        { contestId: 'abc201', expected: 'ABC201' },
        { contestId: 'abc365', expected: 'ABC365' },
        { contestId: 'abc999', expected: 'ABC999' },
      ];

      runTests(
        'getContestNameLabel',
        testCases,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );
    });

    describe('when contest_id starts with APG4b', () => {
      const testCases = [
        { contestId: 'APG4b', expected: 'APG4b' },
        { contestId: 'APG4bPython', expected: 'APG4bPython' },
      ];

      runTests(
        'getContestNameLabel',
        testCases,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );
    });

    test('when contest_id is typical90', () => {
      expect(getContestNameLabel('typical90')).toEqual('競プロ典型 90 問');
    });

    test('when contest_id is dp (EDPC)', () => {
      expect(getContestNameLabel('dp')).toEqual('EDPC');
    });

    test('when contest_id is tdpc', () => {
      expect(getContestNameLabel('tdpc')).toEqual('TDPC');
    });

    // Note: Not yet implemented, because notational distortion needs to be corrected for each contest.
    describe.skip('when contest_id contains past', () => {
      const testCases = [
        { contestId: 'past17-open', expected: '' },
        { contestId: 'past16-open', expected: '' },
        { contestId: 'past15-open', expected: '' },
        { contestId: 'past202303-open', expected: '' }, // PAST 14th
        { contestId: 'past202212-open', expected: '' }, // PAST 13rd
        { contestId: 'past202005-open', expected: '' }, // PAST 3rd
        { contestId: 'past202004-open', expected: '' }, // PAST 2nd
        { contestId: 'past201912-open', expected: '' }, // PAST 1st
      ];

      runTests(
        'getContestNameLabel',
        testCases,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );
    });

    test('when contest_id is practice2 (ACL practice)', () => {
      expect(getContestNameLabel('practice2')).toEqual('ACL Practice');
    });

    // Note: Not yet implemented, because notational distortion needs to be corrected for each contest.
    describe.skip('when contest_id contains joi', () => {
      const testCases = [
        { contestId: 'joig2024-open', expected: '' },
        { contestId: 'joig2023-open', expected: '' },
        { contestId: 'joig2022-open', expected: '' },
        { contestId: 'joig2021-open', expected: '' },
        { contestId: 'joi2024yo1a', expected: '' },
        { contestId: 'joi2024yo1b', expected: '' },
        { contestId: 'joi2024yo1c', expected: '' },
        { contestId: 'joi2023yo1a', expected: '' },
        { contestId: 'joi2023yo1b', expected: '' },
        { contestId: 'joi2023yo1c', expected: '' },
        { contestId: 'joi2018yo', expected: '' },
      ];

      runTests(
        'getContestNameLabel',
        testCases,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );
    });

    test('when contest_id is tessoku-book', () => {
      expect(getContestNameLabel('tessoku-book')).toEqual('競技プログラミングの鉄則');
    });

    test('when contest_id is math-and-algorithm', () => {
      expect(getContestNameLabel('math-and-algorithm')).toEqual('アルゴリズムと数学');
    });

    describe('when contest_id contains chokudai_S', () => {
      const testCases = [
        { contestId: 'chokudai_S001', expected: 'Chokudai SpeedRun 001' },
        { contestId: 'chokudai_S002', expected: 'Chokudai SpeedRun 002' },
      ];

      runTests(
        'getContestNameLabel',
        testCases,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForContestNameLabel,
      testFunction: (testCase: TestCaseForContestNameLabel) => void,
    ) {
      test.each(testCases)(`${testName}(contestId: $contestId)`, testFunction);
    }
  });
});
