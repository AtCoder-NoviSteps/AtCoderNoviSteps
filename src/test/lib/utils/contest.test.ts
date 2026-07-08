import { expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
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
  getAtCoderUniversityContestLabel,
} from '$lib/utils/contest';

describe('Contest', () => {
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

      describe('when contest_id means AtCoder World Tour Finals (official onsite finals)', () => {
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

  describe('get AtCoder university contest label', () => {
    describe('expected to return correct label for valid format', () => {
      test.each([
        ['utpc2019', 'UTPC 2019'],
        ['ttpc2022', 'TTPC 2022'],
      ])('when %s is given', (input, expected) => {
        expect(getAtCoderUniversityContestLabel(input)).toBe(expected);
      });
    });

    describe('expected to be thrown an error if an invalid format is given', () => {
      test.each(['utpc24', 'ttpc', 'tupc'])('when %s is given', (input) => {
        expect(() => getAtCoderUniversityContestLabel(input)).toThrow(
          `Invalid university contest ID format: ${input}`,
        );
      });
    });
  });
});
