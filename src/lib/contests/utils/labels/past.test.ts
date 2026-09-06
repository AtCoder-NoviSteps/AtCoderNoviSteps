import { expect } from 'vitest';

import { getPastContestLabel, PAST_TRANSLATIONS } from '$lib/contests/utils/labels/past';

describe('get PAST contest label', () => {
  describe('contests identified by year and month (1st to 14th)', () => {
    test.each([
      ['past201912-open', 'PAST 第 1 回'],
      ['past202004-open', 'PAST 第 2 回'],
      ['past202303-open', 'PAST 第 14 回'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getPastContestLabel(PAST_TRANSLATIONS, contestId)).toBe(expected);
    });
  });

  describe('contests identified by round number (15th onwards)', () => {
    test.each([
      ['past15-open', 'PAST 第 15 回'],
      ['past16-open', 'PAST 第 16 回'],
      ['past99-open', 'PAST 第 99 回'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getPastContestLabel(PAST_TRANSLATIONS, contestId)).toBe(expected);
    });
  });
});
