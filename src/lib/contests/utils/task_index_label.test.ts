import { expect } from 'vitest';

import { runTests } from '../../../test/lib/common/test_helpers';
import * as TestCasesForContestNameAndTaskIndex from '$lib/contests/fixtures/contest_name_and_task_index';
import { type TestCaseForContestNameAndTaskIndex } from '$lib/contests/fixtures/contest_name_and_task_index';
import { addContestNameToTaskIndex } from '$lib/contests/utils/task_index_label';

describe('add contest name to task index', () => {
  describe('AtCoder', () => {
    describe('when contest_id contains abc', () => {
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

    describe('when contest_id contains past', () => {
      TestCasesForContestNameAndTaskIndex.past.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id contains joi', () => {
      TestCasesForContestNameAndTaskIndex.joi.forEach(({ name, value }) => {
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

    describe('when contest_id contains awc', () => {
      TestCasesForContestNameAndTaskIndex.awc.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id matches contests held by university students', () => {
      TestCasesForContestNameAndTaskIndex.universities.forEach(({ name, value }) => {
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

  describe('AOJ', () => {
    describe('when contest_id means AOJ courses', () => {
      TestCasesForContestNameAndTaskIndex.aojCourses.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id means AOJ PCK (prelim and final)', () => {
      TestCasesForContestNameAndTaskIndex.aojPck.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id means AOJ JAG', () => {
      TestCasesForContestNameAndTaskIndex.aojJag.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id is JAG-like but has no 4-digit year', () => {
      test.each(['JAGSummer-day2', 'JAGPrelim', 'JAGRegional-day1'])(
        'does not produce AOJ format for %s',
        (contestId) => {
          expect(addContestNameToTaskIndex(contestId, '1')).not.toMatch(/^AOJ /);
        },
      );
    });

    describe('when contest_id means AOJ ICPC (prelim and regional)', () => {
      TestCasesForContestNameAndTaskIndex.aojIcpc.forEach(({ name, value }) => {
        runTests(
          `${name}`,
          [value],
          ({ contestId, taskTableIndex, expected }: TestCaseForContestNameAndTaskIndex) => {
            expect(addContestNameToTaskIndex(contestId, taskTableIndex)).toEqual(expected);
          },
        );
      });
    });

    describe('when contest_id means AOJ University (RUPC, HUPC, UAPC)', () => {
      TestCasesForContestNameAndTaskIndex.aojUniversity.forEach(({ name, value }) => {
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
