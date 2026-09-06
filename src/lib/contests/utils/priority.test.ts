import { expect } from 'vitest';

import { ContestType } from '$lib/contests/types/contest';
import {
  getContestPriority,
  contestTypePriorities,
  UNCLASSIFIED_CONTEST_PRIORITY,
} from '$lib/contests/utils/priority';

/** One representative contest_id per category, listed from highest to lowest priority. */
const contestIdsInDisplayOrder = [
  'abs',
  'abc001',
  'arc001',
  'agc001',
  'abl',
  'acl1',
  'cf16-final',
  'awc0001',
  'utpc2023',
  'atc001',
  'ITP1',
  'PCKPrelim2024',
  'AOJ-UAPC2003',
];

describe('get contest priority', () => {
  describe('successful cases', () => {
    test('sorts contest_ids from every category into the intended display order', () => {
      const shuffled = contestIdsInDisplayOrder.toReversed();

      const sorted = shuffled.toSorted(
        (left, right) => getContestPriority(left) - getContestPriority(right),
      );

      expect(sorted).toEqual(contestIdsInDisplayOrder);
    });
  });

  describe('boundary and error cases', () => {
    describe('returns the fallback priority', () => {
      describe('when contest_id matches no known contest', () => {
        test.each(['unknown-contest-2099', 'not-a-contest'])('for %s', (contestId) => {
          expect(getContestPriority(contestId)).toBe(UNCLASSIFIED_CONTEST_PRIORITY);
        });
      });

      describe('when contest_id belongs to a division out of scope', () => {
        test('for awtf2025heuristic', () => {
          expect(getContestPriority('awtf2025heuristic')).toBe(UNCLASSIFIED_CONTEST_PRIORITY);
        });
      });

      describe('when contest_id nearly matches a known pattern', () => {
        test.each([
          ['JAGPrelim', 'a JAG contest without a 4-digit year'],
          ['abc12', 'an ABC contest with too few digits'],
          ['awc001', 'an AWC contest with too few digits'],
        ])('for %s (%s)', (contestId) => {
          expect(getContestPriority(contestId)).toBe(UNCLASSIFIED_CONTEST_PRIORITY);
        });
      });

      describe('when contest_id is empty', () => {
        test('for an empty string', () => {
          expect(getContestPriority('')).toBe(UNCLASSIFIED_CONTEST_PRIORITY);
        });
      });
    });
  });
});

describe('contest type priorities', () => {
  const priorityOf = (contestType: ContestType): number =>
    contestTypePriorities.get(contestType) as number;

  describe('registration', () => {
    test('assigns a priority to every contest type', () => {
      const missing = Object.values(ContestType).filter(
        (contestType) => !contestTypePriorities.has(contestType),
      );

      expect(missing).toEqual([]);
    });

    test('assigns a distinct priority to each contest type', () => {
      const priorities = [...contestTypePriorities.values()];

      expect(new Set(priorities).size).toBe(priorities.length);
    });

    test('ranks every contest type ahead of an unclassifiable contest', () => {
      expect(Math.max(...contestTypePriorities.values())).toBeLessThan(
        UNCLASSIFIED_CONTEST_PRIORITY,
      );
    });
  });

  describe('ordering across contest categories', () => {
    test('ranks educational contests above contests for genius', () => {
      expect(priorityOf(ContestType.ABS)).toBeLessThan(priorityOf(ContestType.ARC));
      expect(priorityOf(ContestType.ABC)).toBeLessThan(priorityOf(ContestType.ARC));
      expect(priorityOf(ContestType.ARC)).toBeLessThan(priorityOf(ContestType.AGC));
    });

    test('ranks each AtCoder contest above every AOJ contest', () => {
      const atCoderLowest = Math.max(
        priorityOf(ContestType.OTHERS),
        priorityOf(ContestType.UNIVERSITY),
      );
      const aojHighest = Math.min(
        priorityOf(ContestType.AOJ_COURSES),
        priorityOf(ContestType.AOJ_PCK),
        priorityOf(ContestType.AOJ_ICPC),
        priorityOf(ContestType.AOJ_JAG),
        priorityOf(ContestType.AOJ_UNIVERSITY),
      );

      expect(atCoderLowest).toBeLessThan(aojHighest);
    });

    test('ranks a contest variant directly below its base contest', () => {
      expect(priorityOf(ContestType.ABC_LIKE)).toBeGreaterThan(priorityOf(ContestType.ABC));
      expect(priorityOf(ContestType.ARC_LIKE)).toBeGreaterThan(priorityOf(ContestType.ARC));
      expect(priorityOf(ContestType.AGC_LIKE)).toBeGreaterThan(priorityOf(ContestType.AGC));
    });
  });
});
