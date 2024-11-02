import { expect } from 'vitest';

import { runTestCases, runTests } from '../common/test_helpers';
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

describe('Contest', () => {
  describe('classify contest', () => {
    describe('AtCoder', () => {
      runTestCases(
        'when contest_id is abs',
        TestCasesForContestType.abs,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains abc',
        TestCasesForContestType.abc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id starts with APG4b',
        TestCasesForContestType.apg4b,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is typical90',
        TestCasesForContestType.typical90,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is dp (EDPC)',
        TestCasesForContestType.edpc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is tdpc',
        TestCasesForContestType.tdpc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains past',
        TestCasesForContestType.past,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is practice2 (ACL practice)',
        TestCasesForContestType.aclPractice,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains joi',
        TestCasesForContestType.joi,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is tessoku-book',
        TestCasesForContestType.tessokuBook,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is math-and-algorithm',
        TestCasesForContestType.mathAndAlgorithm,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains arc',
        TestCasesForContestType.arc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains agc',
        TestCasesForContestType.agc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id means arc-like',
        TestCasesForContestType.arcLike,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id means agc-like',
        TestCasesForContestType.agcLike,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id means others',
        TestCasesForContestType.atCoderOthers,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );
    });

    describe('AOJ', () => {
      runTestCases(
        'when contest_id means aoj courses',
        TestCasesForContestType.aojCourses,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id means aoj pck (prelim and final)',
        TestCasesForContestType.aojPck,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        },
      );
    });
  });

  describe('get contest priority', () => {
    describe('AtCoder', () => {
      runTestCases(
        'when contest_id is abs',
        TestCasesForContestType.abs,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id contains abc',
        TestCasesForContestType.abc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id starts with APG4b',
        TestCasesForContestType.apg4b,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id is typical90',
        TestCasesForContestType.typical90,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id is dp (EDPC)',
        TestCasesForContestType.edpc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id is dp TDPC',
        TestCasesForContestType.tdpc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id contains past',
        TestCasesForContestType.past,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id is practice2 (ACL practice)',
        TestCasesForContestType.aclPractice,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id contains joi',
        TestCasesForContestType.joi,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id is tessoku-book',
        TestCasesForContestType.tessokuBook,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id is math-and-algorithm',
        TestCasesForContestType.mathAndAlgorithm,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id contains arc',
        TestCasesForContestType.arc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id contains agc',
        TestCasesForContestType.agc,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id means arc-like',
        TestCasesForContestType.arcLike,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id means agc-like',
        TestCasesForContestType.agcLike,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id means others',
        TestCasesForContestType.atCoderOthers,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );
    });

    describe('AOJ', () => {
      runTestCases(
        'when contest_id means aoj courses',
        TestCasesForContestType.aojCourses,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );

      runTestCases(
        'when contest_id means aoj pck (prelim and final)',
        TestCasesForContestType.aojPck,
        ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        },
      );
    });
  });

  describe('get contest name label', () => {
    describe('AtCoder', () => {
      runTestCases(
        'when contest_id contains abc',
        TestCasesForContestNameLabel.abc,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id starts with APG4b',
        TestCasesForContestNameLabel.apg4b,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is typical90',
        TestCasesForContestNameLabel.typical90,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is dp (EDPC)',
        TestCasesForContestNameLabel.edpc,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is tdpc',
        TestCasesForContestNameLabel.tdpc,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      // Note: Not yet implemented, because notational distortion needs to be corrected for each contest.
      describe.skip('when contest_id contains past', () => {
        TestCasesForContestNameLabel.past.forEach(({ name, value }) => {
          runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
            expect(getContestNameLabel(contestId)).toEqual(expected);
          });
        });
      });

      runTestCases(
        'when contest_id is practice2 (ACL practice)',
        TestCasesForContestNameLabel.aclPractice,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      // Note: Not yet implemented, because notational distortion needs to be corrected for each contest.
      describe.skip('when contest_id contains joi', () => {
        TestCasesForContestNameLabel.joi.forEach(({ name, value }) => {
          runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
            expect(getContestNameLabel(contestId)).toEqual(expected);
          });
        });
      });

      runTestCases(
        'when contest_id is tessoku-book',
        TestCasesForContestNameLabel.tessokuBook,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is math-and-algorithm',
        TestCasesForContestNameLabel.mathAndAlgorithm,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains arc',
        TestCasesForContestNameLabel.arc,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains agc',
        TestCasesForContestNameLabel.agc,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains chokudai_S',
        TestCasesForContestNameLabel.atCoderOthers,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );
    });

    describe('AOJ', () => {
      runTestCases(
        'when contest_id means aoj courses',
        TestCasesForContestNameLabel.aojCourses,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id means aoj pck (prelim and final)',
        TestCasesForContestNameLabel.aojPck,
        ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        },
      );
    });
  });

  describe('add contest name to task index', () => {
    describe('AtCoder', () => {
      runTestCases(
        'when contest_id contains abc',
        TestCasesForContestNameAndTaskIndex.abc,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id starts with APG4b',
        TestCasesForContestNameAndTaskIndex.apg4b,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is typical90',
        TestCasesForContestNameAndTaskIndex.typical90,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is tessoku-book',
        TestCasesForContestNameAndTaskIndex.tessokuBook,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id is math-and-algorithm',
        TestCasesForContestNameAndTaskIndex.mathAndAlgorithm,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains arc',
        TestCasesForContestNameAndTaskIndex.arc,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id contains agc',
        TestCasesForContestNameAndTaskIndex.agc,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );
    });

    describe('AOJ', () => {
      runTestCases(
        'when contest_id means aoj courses',
        TestCasesForContestNameAndTaskIndex.aojCourses,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );

      runTestCases(
        'when contest_id means aoj pck (prelim and final)',
        TestCasesForContestNameAndTaskIndex.aojPck,
        ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
          expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
        },
      );
    });
  });
});
