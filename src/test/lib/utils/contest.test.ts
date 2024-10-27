import { expect, test } from 'vitest';

import { runTests } from '../common/test_helpers';
import * as TestCasesForContestType from './test_cases/contest_type';
import { type TestCaseForContestType } from './test_cases/contest_type';
import * as TestCasesForContestNameLabel from './test_cases/contest_name_labels';
import { type TestCaseForContestNameLabel } from './test_cases/contest_name_labels';
import * as TestCasesForContestNameAndTaskIndex from './test_cases/contest_name_and_task_index';
import { type TestCaseForContestNameAndTaskIndex } from './test_cases/contest_name_and_task_index';
import {
  classifyContest,
  getContestPriority,
  contestTypePriorities,
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
      TestCasesForContestType.abc.forEach(({ name, value }) => {
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
      TestCasesForContestType.past.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    test('when contest_id is practice2 (ACL practice)', () => {
      expect(classifyContest('practice2')).toEqual(ContestType.ACL_PRACTICE);
    });

    describe('when contest_id contains joi', () => {
      TestCasesForContestType.joi.forEach(({ name, value }) => {
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
      TestCasesForContestType.arc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains agc', () => {
      TestCasesForContestType.agc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means arc-like', () => {
      TestCasesForContestType.arcLike.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means agc-like', () => {
      TestCasesForContestType.agcLike.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means others', () => {
      TestCasesForContestType.atCoderOthers.forEach(({ name, value }) => {
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
      TestCasesForContestType.abc.forEach(({ name, value }) => {
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
      TestCasesForContestType.past.forEach(({ name, value }) => {
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
      TestCasesForContestType.joi.forEach(({ name, value }) => {
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
      TestCasesForContestType.arc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id contains agc', () => {
      TestCasesForContestType.agc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means arc-like', () => {
      TestCasesForContestType.arcLike.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means agc-like', () => {
      TestCasesForContestType.agcLike.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means others', () => {
      TestCasesForContestType.atCoderOthers.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });
  });

  describe('get contest name label', () => {
    describe('when contest_id contains abc', () => {
      TestCasesForContestNameLabel.abc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id starts with APG4b', () => {
      TestCasesForContestNameLabel.apg4b.forEach(({ name, value }) => {
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
      TestCasesForContestNameLabel.past.forEach(({ name, value }) => {
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
      TestCasesForContestNameLabel.joi.forEach(({ name, value }) => {
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
      TestCasesForContestNameLabel.arc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains agc', () => {
      TestCasesForContestNameLabel.agc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains chokudai_S', () => {
      TestCasesForContestNameLabel.atCoderOthers.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });
  });

  describe('add contest name to task index', () => {
    describe('when contest_id contains ABC', () => {
      TestCasesForContestNameAndTaskIndex.abc.forEach(({ name, value }) => {
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
      TestCasesForContestNameAndTaskIndex.apg4b.forEach(({ name, value }) => {
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
      TestCasesForContestNameAndTaskIndex.typical90.forEach(({ name, value }) => {
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
      TestCasesForContestNameAndTaskIndex.tessokuBook.forEach(({ name, value }) => {
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
      TestCasesForContestNameAndTaskIndex.mathAndAlgorithm.forEach(({ name, value }) => {
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
      TestCasesForContestNameAndTaskIndex.arc.forEach(({ name, value }) => {
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
      TestCasesForContestNameAndTaskIndex.agc.forEach(({ name, value }) => {
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
