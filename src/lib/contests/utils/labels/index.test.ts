import { expect } from 'vitest';

import { ContestType } from '$lib/contests/types/contest';
import { runTests } from '../../../../test/lib/common/test_helpers';
import * as TestCasesForContestNameLabel from '$lib/contests/fixtures/contest_name_labels';
import { type TestCaseForContestNameLabel } from '$lib/contests/fixtures/contest_name_labels';
import { getContestNameLabel, LABEL_GENERATORS } from '$lib/contests/utils/labels/index';

/**
 * Contest types that classifyContest can return but LABEL_GENERATORS deliberately
 * does not handle yet, so they fall back to the uppercased contest_id.
 *
 * TODO: Remove this list once contest display names move to the database.
 */
const CONTEST_TYPES_WITHOUT_LABEL_GENERATOR: readonly ContestType[] = [
  // ABS is unwired but harmless: the fallback uppercases 'abs' into the intended 'ABS'.
  ContestType.ABS,
  // These three have display names in prefixes.ts that the fallback never reaches.
  ContestType.ABC_LIKE,
  ContestType.ARC_LIKE,
  ContestType.AGC_LIKE,
];

describe('label generator coverage', () => {
  test('every contest type either has a generator or is a known exception', () => {
    const missing = Object.values(ContestType).filter(
      (contestType) => !LABEL_GENERATORS.has(contestType),
    );

    expect(missing.toSorted()).toEqual([...CONTEST_TYPES_WITHOUT_LABEL_GENERATOR].toSorted());
  });

  test('registers no generator for a contest type outside ContestType', () => {
    const knownTypes = new Set<string>(Object.values(ContestType));
    const unknown = [...LABEL_GENERATORS.keys()].filter(
      (contestType) => !knownTypes.has(contestType),
    );

    expect(unknown).toEqual([]);
  });
});

describe('get contest name label', () => {
  describe('AtCoder', () => {
    describe('when contest_id is dp (EDPC)', () => {
      TestCasesForContestNameLabel.edpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is tdpc', () => {
      TestCasesForContestNameLabel.tdpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is ndpc', () => {
      TestCasesForContestNameLabel.ndpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is practice2 (ACL practice)', () => {
      TestCasesForContestNameLabel.aclPractice.forEach(({ name, value }) => {
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

    describe('when contest_id is math-and-algorithm', () => {
      TestCasesForContestNameLabel.mathAndAlgorithm.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is fps-24', () => {
      TestCasesForContestNameLabel.fps24.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains awc', () => {
      TestCasesForContestNameLabel.awc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means AtCoder World Tour Finals (official onsite finals)', () => {
      TestCasesForContestNameLabel.atCoderMainOfficialOnsite.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });
  });

  describe('AOJ', () => {
    describe('when contest_id means AOJ courses', () => {
      TestCasesForContestNameLabel.aojCourses.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means AOJ PCK (prelim and final)', () => {
      TestCasesForContestNameLabel.aojPck.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means AOJ JAG', () => {
      TestCasesForContestNameLabel.aojJag.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is JAG-like but has no 4-digit year', () => {
      test.each(['JAGSummer-day2', 'JAGPrelim', 'JAGRegional-day1'])(
        'does not return a JAG-style label for %s',
        (contestId) => {
          expect(getContestNameLabel(contestId)).not.toMatch(/^（/);
        },
      );
    });

    describe('when contest_id means AOJ ICPC (prelim and regional)', () => {
      TestCasesForContestNameLabel.aojIcpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means AOJ University (RUPC, HUPC, UAPC)', () => {
      TestCasesForContestNameLabel.aojUniversity.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
          expect(getContestNameLabel(contestId)).toEqual(expected);
        });
      });
    });
  });
});
