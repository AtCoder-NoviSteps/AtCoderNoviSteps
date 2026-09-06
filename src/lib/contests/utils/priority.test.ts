import { expect } from 'vitest';

import { runTests } from '../../../test/lib/common/test_helpers';
import * as TestCasesForContestType from '$lib/contests/fixtures/contest_type';
import { type TestCaseForContestType } from '$lib/contests/fixtures/contest_type';
import { getContestPriority, contestTypePriorities } from '$lib/contests/utils/priority';

describe('get contest priority', () => {
  describe('AtCoder', () => {
    describe('when contest_id is abs', () => {
      TestCasesForContestType.abs.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id contains abc', () => {
      TestCasesForContestType.abc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id starts with APG4b', () => {
      TestCasesForContestType.apg4b.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id is typical90', () => {
      TestCasesForContestType.typical90.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id is dp (EDPC)', () => {
      TestCasesForContestType.edpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id is tdpc', () => {
      TestCasesForContestType.tdpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id is ndpc', () => {
      TestCasesForContestType.ndpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id contains past', () => {
      TestCasesForContestType.past.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id is practice2 (ACL practice)', () => {
      TestCasesForContestType.aclPractice.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id contains joi', () => {
      TestCasesForContestType.joi.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id is tessoku-book', () => {
      TestCasesForContestType.tessokuBook.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id is math-and-algorithm', () => {
      TestCasesForContestType.mathAndAlgorithm.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id is fps-24', () => {
      TestCasesForContestType.fps24.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
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

    describe('when contest_id means abc-like', () => {
      TestCasesForContestType.abcLike.forEach(({ name, value }) => {
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

    describe('when contest_id contains awc', () => {
      TestCasesForContestType.awc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id matches contests held by university students', () => {
      TestCasesForContestType.universities.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means AtCoder others', () => {
      TestCasesForContestType.atCoderOthers.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means AtCoder World Tour Finals (official onsite finals)', () => {
      TestCasesForContestType.atCoderMainOfficialOnsite.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });
  });

  describe('AOJ', () => {
    describe('when contest_id means AOJ courses', () => {
      TestCasesForContestType.aojCourses.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means AOJ PCK (prelim and final)', () => {
      TestCasesForContestType.aojPck.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means AOJ JAG', () => {
      TestCasesForContestType.aojJag.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means AOJ ICPC (prelim and regional)', () => {
      TestCasesForContestType.aojIcpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });

    describe('when contest_id means AOJ University (RUPC, HUPC, UAPC)', () => {
      TestCasesForContestType.aojUniversity.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
        });
      });
    });
  });
});
