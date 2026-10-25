import { expect } from 'vitest';

import { ContestType } from '#lib/contests/types/contest.js';
import { runTests } from '../../../test/lib/common/test_helpers';
import * as TestCasesForContestType from '#lib/contests/fixtures/contest_type.js';
import { type TestCaseForContestType } from '#lib/contests/fixtures/contest_type.js';
import { classifyContest } from '#lib/contests/utils/classification.js';

describe('classify contest', () => {
  describe('AtCoder', () => {
    describe('when contest_id is abs', () => {
      TestCasesForContestType.abs.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains abc', () => {
      TestCasesForContestType.abc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id starts with APG4b', () => {
      TestCasesForContestType.apg4b.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is typical90', () => {
      TestCasesForContestType.typical90.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is dp (EDPC)', () => {
      TestCasesForContestType.edpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is tdpc', () => {
      TestCasesForContestType.tdpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is ndpc', () => {
      TestCasesForContestType.ndpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains past', () => {
      TestCasesForContestType.past.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is practice2 (ACL practice)', () => {
      TestCasesForContestType.aclPractice.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id contains joi', () => {
      TestCasesForContestType.joi.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is tessoku-book', () => {
      TestCasesForContestType.tessokuBook.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is math_and_algorithm', () => {
      TestCasesForContestType.mathAndAlgorithm.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is fps-24', () => {
      TestCasesForContestType.fps24.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is game-24', () => {
      TestCasesForContestType.game24.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is aalc001', () => {
      TestCasesForContestType.aalc001.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
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

    describe('when contest_id means abc-like', () => {
      TestCasesForContestType.abcLike.forEach(({ name, value }) => {
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

    describe('when contest_id contains awc', () => {
      TestCasesForContestType.awc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means a JAG contest held on AtCoder', () => {
      TestCasesForContestType.atCoderJag.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    // The same contests as AOJ JAGSpring2013 / 2014; importing them from AtCoder would duplicate the problems.
    describe('when contest_id is a JAG contest on AtCoder that AOJ already covers', () => {
      test.each(['JAG2013Spring', 'JAG2014Spring'])('returns null for %s', (contestId) => {
        expect(classifyContest(contestId)).toBeNull();
      });
    });

    // Matched exactly, so a new JAG contest on AtCoder must be listed explicitly.
    describe('when contest_id extends a listed JAG contest held on AtCoder', () => {
      test.each(['jag2018summer-day2-extra', 'jag2017summer-day1b'])(
        'returns null for %s',
        (contestId) => {
          expect(classifyContest(contestId)).toBeNull();
        },
      );
    });

    describe('when contest_id matches contests held by university students', () => {
      TestCasesForContestType.universities.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id mean AtCoder others', () => {
      TestCasesForContestType.atCoderOthers.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means AtCoder official onsite finals (e.g., World Tour Finals, CodeQUEEN)', () => {
      TestCasesForContestType.atCoderMainOfficialOnsite.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is awtf2025heuristic (Heuristic division, out of scope)', () => {
      test('returns null', () => {
        expect(classifyContest('awtf2025heuristic')).toBeNull();
      });
    });

    describe('when contest_id lacks the "-open" suffix seen in most seeded data', () => {
      test.each(['wtf19', 'wtf22-day1', 'awtf2024', 'awtf2025algo'])(
        'still classifies %s as ATCODER_MAIN_OFFICIAL_ONSITE',
        (contestId) => {
          expect(classifyContest(contestId)).toEqual(ContestType.ATCODER_MAIN_OFFICIAL_ONSITE);
        },
      );
    });
  });

  describe('AOJ', () => {
    describe('when contest_id mean AOJ courses', () => {
      TestCasesForContestType.aojCourses.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id mean AOJ PCK (prelim and final) ', () => {
      TestCasesForContestType.aojPck.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means AOJ JAG', () => {
      TestCasesForContestType.aojJag.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id is JAG-like but has no 4-digit year', () => {
      test.each(['JAGSummer-day2', 'JAGPrelim', 'JAGRegional'])(
        'returns null for %s',
        (contestId) => {
          expect(classifyContest(contestId)).toBeNull();
        },
      );
    });

    describe('when contest_id means AOJ ICPC (prelim and regional)', () => {
      TestCasesForContestType.aojIcpc.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });

    describe('when contest_id means AOJ University (RUPC, HUPC, UAPC)', () => {
      TestCasesForContestType.aojUniversity.forEach(({ name, value }) => {
        runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
          expect(classifyContest(contestId)).toEqual(expected);
        });
      });
    });
  });
});
