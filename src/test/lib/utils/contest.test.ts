import { expect, test } from 'vitest';

import { runTests } from '../common/test_helpers';
import {
  type TestCaseForContestType,
  type TestCaseForContestNameLabel,
  type TestCaseForContestNameAndTaskIndex,
  testCasesForAbcContest,
  testCasesForPastContest,
  testCasesForJoiContest,
  testCasesForArcContest,
  testCasesForAgcContest,
  testCasesForArcLikeContest,
  testCasesForAgcLikeContest,
  testCasesForOthersContest,
  testCasesForAbcContestNameLabel,
  testCasesForApg4bContestNameLabel,
  testCasesForPastContestNameLabel,
  testCasesForJoiContestNameLabel,
  testCasesForArcContestNameLabel,
  testCasesForAgcContestNameLabel,
  testCasesForOthersContestLabel,
  testCasesForAbcContestNameAndTaskIndex,
} from './test_cases/contest';
import {
  classifyContest,
  getContestPriority,
  contestTypePriorities,
  getContestUrl,
  getContestNameLabel,
  addContestNameToTaskIndex,
} from '$lib/utils/contest';
import { ContestType } from '$lib/types/contest';

// TODO: Add AOJ.
describe('Contest', () => {
  describe('classify contest', () => {
    test('when contest_id is ABS', () => {
      expect(classifyContest('abs')).toEqual(ContestType.ABS);
    });

    describe('when contest_id contains abc', () => {
      testCasesForAbcContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
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
      testCasesForPastContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    test('when contest_id is practice2 (ACL practice)', () => {
      expect(classifyContest('practice2')).toEqual(ContestType.ACL_PRACTICE);
    });

    describe('when contest_id contains joi', () => {
      testCasesForJoiContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    test('when contest_id is tessoku-book', () => {
      expect(classifyContest('tessoku-book')).toEqual(ContestType.TESSOKU_BOOK);
    });

    test('when contest_id is math-and-algorithm', () => {
      expect(classifyContest('math-and-algorithm')).toEqual(ContestType.MATH_AND_ALGORITHM);
    });

    describe('when contest_id contains arc', () => {
      testCasesForArcContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains agc', () => {
      testCasesForAgcContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means arc-like', () => {
      testCasesForArcLikeContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means agc-like', () => {
      testCasesForAgcLikeContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means others', () => {
      testCasesForOthersContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });
  });

  describe('get contest priority', () => {
    test('when contest_id is abs', () => {
      expect(getContestPriority('abs')).toEqual(contestTypePriorities.get(ContestType.ABS));
    });

    describe('when contest_id contains abc', () => {
      testCasesForAbcContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
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
      testCasesForPastContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    test('when contest_id is practice2 (ACL practice)', () => {
      expect(getContestPriority('practice2')).toEqual(
        contestTypePriorities.get(ContestType.ACL_PRACTICE),
      );
    });

    describe('when contest_id contains joi', () => {
      testCasesForJoiContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
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
      testCasesForArcContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id contains agc', () => {
      testCasesForAgcContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means arc-like', () => {
      testCasesForArcLikeContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means agc-like', () => {
      testCasesForAgcLikeContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means others', () => {
      testCasesForOthersContest.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });
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
    describe('when contest_id contains abc', () => {
      testCasesForAbcContestNameLabel.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id starts with APG4b', () => {
      testCasesForApg4bContestNameLabel.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
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
      testCasesForPastContestNameLabel.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    test('when contest_id is practice2 (ACL practice)', () => {
      expect(getContestNameLabel('practice2')).toEqual('ACL Practice');
    });

    // Note: Not yet implemented, because notational distortion needs to be corrected for each contest.
    describe.skip('when contest_id contains joi', () => {
      testCasesForJoiContestNameLabel.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    test('when contest_id is tessoku-book', () => {
      expect(getContestNameLabel('tessoku-book')).toEqual('競技プログラミングの鉄則');
    });

    test('when contest_id is math-and-algorithm', () => {
      expect(getContestNameLabel('math-and-algorithm')).toEqual('アルゴリズムと数学');
    });

    describe('when contest_id contains arc', () => {
      testCasesForArcContestNameLabel.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains agc', () => {
      testCasesForAgcContestNameLabel.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains chokudai_S', () => {
      testCasesForOthersContestLabel.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });
  });

  describe('add contest name to task index', () => {
    describe('when contest_id contains ABC', () => {
      testCasesForAbcContestNameAndTaskIndex.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
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

    describe('when contest_id contains agc', () => {
      const testCases = [
        { contestId: 'agc001', taskTableIndex: 'A', expected: 'AGC001 - A' },
        { contestId: 'agc002', taskTableIndex: 'B', expected: 'AGC002 - B' },
        { contestId: 'agc009', taskTableIndex: 'C', expected: 'AGC009 - C' },
        { contestId: 'agc010', taskTableIndex: 'D', expected: 'AGC010 - D' },
        { contestId: 'agc011', taskTableIndex: 'E', expected: 'AGC011 - E' },
        { contestId: 'agc066', taskTableIndex: 'F', expected: 'AGC066 - F' },
        { contestId: 'agc067', taskTableIndex: 'E', expected: 'AGC067 - E' },
      ];

      runTests(
        'addContestNameToTaskIndex',
        testCases,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );
    });
  });
});
