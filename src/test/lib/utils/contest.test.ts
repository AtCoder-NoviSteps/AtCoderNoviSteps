import { expect, test } from 'vitest';

import { runTests } from '../common/test_helpers';
import {
  type TestCaseForContestType,
  testCasesForAbcContest,
  testCasesForPastContest,
  testCasesForJoiContest,
  testCasesForArcContest,
  testCasesForAgcContest,
  testCasesForArcLikeContest,
  testCasesForAgcLikeContest,
  testCasesForOthersContest,
} from './test_cases/contest';
import {
  type TestCaseForContestNameLabel,
  testCasesForAbcContestNameLabel,
  testCasesForApg4bContestNameLabel,
  testCasesForPastContestNameLabel,
  testCasesForJoiContestNameLabel,
  testCasesForArcContestNameLabel,
  testCasesForAgcContestNameLabel,
  testCasesForOthersContestLabel,
} from './test_cases/contest_name_labels';
import {
  type TestCaseForContestNameAndTaskIndex,
  testCasesForAbcContestNameAndTaskIndex,
  testCasesForApg4bContestNameAndTaskIndex,
  testCasesForTypical90ContestNameAndTaskIndex,
  testCasesForTessokuBookContestNameAndTaskIndex,
  testCasesForMathAndAlgorithmContestNameAndTaskIndex,
  testCasesForArcContestNameAndTaskIndex,
  testCasesForAgcContestNameAndTaskIndex,
} from './test_cases/contest_name_and_task_index';
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
      testCasesForApg4bContestNameAndTaskIndex.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id is typical90', () => {
      testCasesForTypical90ContestNameAndTaskIndex.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id is tessoku-book', () => {
      testCasesForTessokuBookContestNameAndTaskIndex.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id is math-and-algorithm', () => {
      testCasesForMathAndAlgorithmContestNameAndTaskIndex.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id contains arc', () => {
      testCasesForArcContestNameAndTaskIndex.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id contains agc', () => {
      testCasesForAgcContestNameAndTaskIndex.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });
  });
});
