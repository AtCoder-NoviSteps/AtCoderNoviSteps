import { expect, test } from 'vitest';

import {
  classifyContest,
  getContestPriority,
  contestTypePriorities,
  getContestUrl,
  getContestNameLabel,
  addContestNameToTaskIndex,
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

type TestCaseForContestNameAndTaskIndex = {
  contestId: string;
  taskTableIndex: string;
  expected: string;
};

type TestCasesForContestNameAndTaskIndex = TestCaseForContestNameAndTaskIndex[];

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

    describe('when contest_id contains arc', () => {
      const testCases = [
        { contestId: 'arc001', expected: ContestType.ARC },
        { contestId: 'arc002', expected: ContestType.ARC },
        { contestId: 'arc057', expected: ContestType.ARC },
        { contestId: 'arc058', expected: ContestType.ARC },
        { contestId: 'arc099', expected: ContestType.ARC },
        { contestId: 'arc100', expected: ContestType.ARC },
        { contestId: 'arc101', expected: ContestType.ARC },
        { contestId: 'arc103', expected: ContestType.ARC },
        { contestId: 'arc104', expected: ContestType.ARC },
        { contestId: 'arc105', expected: ContestType.ARC },
        { contestId: 'arc182', expected: ContestType.ARC },
        { contestId: 'arc183', expected: ContestType.ARC },
      ];

      runTests('classifyContest', testCases, ({ contestId, expected }: TestCaseForContestType) => {
        expect(classifyContest(contestId)).toEqual(expected);
      });
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

    describe('when contest_id contains arc', () => {
      const testCases = [
        { contestId: 'arc001', expected: ContestType.ARC },
        { contestId: 'arc002', expected: ContestType.ARC },
        { contestId: 'arc057', expected: ContestType.ARC },
        { contestId: 'arc058', expected: ContestType.ARC },
        { contestId: 'arc099', expected: ContestType.ARC },
        { contestId: 'arc100', expected: ContestType.ARC },
        { contestId: 'arc101', expected: ContestType.ARC },
        { contestId: 'arc103', expected: ContestType.ARC },
        { contestId: 'arc104', expected: ContestType.ARC },
        { contestId: 'arc105', expected: ContestType.ARC },
        { contestId: 'arc182', expected: ContestType.ARC },
        { contestId: 'arc183', expected: ContestType.ARC },
      ];

      runTests(
        'getContestPriority',
        testCases,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
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

    test('when contest_id is ARC183', () => {
      const contestId = 'arc183';
      const expected = 'https://atcoder.jp/contests/arc183';

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

    describe('when contest_id contains arc', () => {
      const testCases = [
        { contestId: 'arc001', expected: 'ARC001' },
        { contestId: 'arc002', expected: 'ARC002' },
        { contestId: 'arc057', expected: 'ARC057' },
        { contestId: 'arc058', expected: 'ARC058' },
        { contestId: 'arc099', expected: 'ARC099' },
        { contestId: 'arc100', expected: 'ARC100' },
        { contestId: 'arc101', expected: 'ARC101' },
        { contestId: 'arc103', expected: 'ARC103' },
        { contestId: 'arc104', expected: 'ARC104' },
        { contestId: 'arc105', expected: 'ARC105' },
        { contestId: 'arc182', expected: 'ARC182' },
        { contestId: 'arc183', expected: 'ARC183' },
      ];

      runTests(
        'getContestNameLabel',
        testCases,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );
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

  describe('add contest name to task index', () => {
    describe('when contest_id contains ABC', () => {
      const testCases: TestCasesForContestNameAndTaskIndex = [
        { contestId: 'abc001', taskTableIndex: 'A', expected: 'ABC001 - A' },
        { contestId: 'abc001', taskTableIndex: 'B', expected: 'ABC001 - B' },
        { contestId: 'abc001', taskTableIndex: 'C', expected: 'ABC001 - C' },
        { contestId: 'abc001', taskTableIndex: 'D', expected: 'ABC001 - D' },
        { contestId: 'abc002', taskTableIndex: 'A', expected: 'ABC002 - A' },
        { contestId: 'abc099', taskTableIndex: 'B', expected: 'ABC099 - B' },
        { contestId: 'abc100', taskTableIndex: 'C', expected: 'ABC100 - C' },
        { contestId: 'abc101', taskTableIndex: 'D', expected: 'ABC101 - D' },
        { contestId: 'abc200', taskTableIndex: 'E', expected: 'ABC200 - E' },
        { contestId: 'abc201', taskTableIndex: 'F', expected: 'ABC201 - F' },
        { contestId: 'abc365', taskTableIndex: 'G', expected: 'ABC365 - G' },
        { contestId: 'abc999', taskTableIndex: 'A', expected: 'ABC999 - A' },
      ];

      runTests(
        'addContestNameToTaskIndex',
        testCases,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );
    });

    describe('when contest_id starts with APG4b', () => {
      const testCases = [
        { contestId: 'APG4b', taskTableIndex: 'EX1', expected: 'APG4b - EX1' },
        { contestId: 'APG4b', taskTableIndex: 'EX2', expected: 'APG4b - EX2' },
        { contestId: 'APG4b', taskTableIndex: 'EX10', expected: 'APG4b - EX10' },
        { contestId: 'APG4bPython', taskTableIndex: 'EX1', expected: 'APG4bPython - EX1' },
      ];

      runTests(
        'addContestNameToTaskIndex',
        testCases,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );
    });

    describe('when contest_id is typical90', () => {
      const testCases = [
        { contestId: 'typical90', taskTableIndex: '001', expected: '競プロ典型 90 問 - 001' },
        { contestId: 'typical90', taskTableIndex: '002', expected: '競プロ典型 90 問 - 002' },
        { contestId: 'typical90', taskTableIndex: '010', expected: '競プロ典型 90 問 - 010' },
        { contestId: 'typical90', taskTableIndex: '090', expected: '競プロ典型 90 問 - 090' },
      ];

      runTests(
        'addContestNameToTaskIndex',
        testCases,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );
    });

    describe('when contest_id is tessoku-book', () => {
      const testCases = [
        {
          contestId: 'tessoku-book',
          taskTableIndex: 'A01',
          expected: '競技プログラミングの鉄則 - A01',
        },
        {
          contestId: 'tessoku-book',
          taskTableIndex: 'A10',
          expected: '競技プログラミングの鉄則 - A10',
        },
        {
          contestId: 'tessoku-book',
          taskTableIndex: 'A77',
          expected: '競技プログラミングの鉄則 - A77',
        },
        {
          contestId: 'tessoku-book',
          taskTableIndex: 'B01',
          expected: '競技プログラミングの鉄則 - B01',
        },
        {
          contestId: 'tessoku-book',
          taskTableIndex: 'B10',
          expected: '競技プログラミングの鉄則 - B10',
        },
        {
          contestId: 'tessoku-book',
          taskTableIndex: 'B69',
          expected: '競技プログラミングの鉄則 - B69',
        },
        {
          contestId: 'tessoku-book',
          taskTableIndex: 'C01',
          expected: '競技プログラミングの鉄則 - C01',
        },
        {
          contestId: 'tessoku-book',
          taskTableIndex: 'C10',
          expected: '競技プログラミングの鉄則 - C10',
        },
        {
          contestId: 'tessoku-book',
          taskTableIndex: 'C20',
          expected: '競技プログラミングの鉄則 - C20',
        },
      ];

      runTests(
        'addContestNameToTaskIndex',
        testCases,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );
    });

    describe('when contest_id is math-and-algorithm', () => {
      const testCases = [
        {
          contestId: 'math-and-algorithm',
          taskTableIndex: '001',
          expected: 'アルゴリズムと数学 - 001',
        },
        {
          contestId: 'math-and-algorithm',
          taskTableIndex: '002',
          expected: 'アルゴリズムと数学 - 002',
        },
        {
          contestId: 'math-and-algorithm',
          taskTableIndex: '010',
          expected: 'アルゴリズムと数学 - 010',
        },
        {
          contestId: 'math-and-algorithm',
          taskTableIndex: '099',
          expected: 'アルゴリズムと数学 - 099',
        },
        {
          contestId: 'math-and-algorithm',
          taskTableIndex: '100',
          expected: 'アルゴリズムと数学 - 100',
        },
        {
          contestId: 'math-and-algorithm',
          taskTableIndex: '104',
          expected: 'アルゴリズムと数学 - 104',
        },
      ];

      runTests(
        'addContestNameToTaskIndex',
        testCases,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );
    });

    describe('when contest_id contains arc', () => {
      const testCases = [
        { contestId: 'arc001', taskTableIndex: 'A', expected: 'ARC001 - A' },
        { contestId: 'arc002', taskTableIndex: 'B', expected: 'ARC002 - B' },
        { contestId: 'arc057', taskTableIndex: 'C', expected: 'ARC057 - C' },
        { contestId: 'arc058', taskTableIndex: 'D', expected: 'ARC058 - D' },
        { contestId: 'arc099', taskTableIndex: 'E', expected: 'ARC099 - E' },
        { contestId: 'arc100', taskTableIndex: 'F', expected: 'ARC100 - F' },
        { contestId: 'arc101', taskTableIndex: 'C', expected: 'ARC101 - C' },
        { contestId: 'arc103', taskTableIndex: 'D', expected: 'ARC103 - D' },
        { contestId: 'arc104', taskTableIndex: 'A', expected: 'ARC104 - A' },
        { contestId: 'arc105', taskTableIndex: 'B', expected: 'ARC105 - B' },
        { contestId: 'arc182', taskTableIndex: 'C', expected: 'ARC182 - C' },
        { contestId: 'arc183', taskTableIndex: 'D', expected: 'ARC183 - D' },
      ];

      runTests(
        'addContestNameToTaskIndex',
        testCases,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );
    });

    function runTests(
      testName: string,
      testCases: TestCasesForContestNameAndTaskIndex,
      testFunction: (testCase: TestCaseForContestNameAndTaskIndex) => void,
    ) {
      test.each(testCases)(
        `${testName}(contestId: $contestId, taskTableIndex: $taskTableIndex)`,
        testFunction,
      );
    }
  });
});
