import { expect } from 'vitest';

import {
  getPastContestId,
  getPastContestLabel,
  PAST_TRANSLATIONS,
} from '#lib/contests/utils/labels/past.js';

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

describe('getPastContestId', () => {
  test.each([
    [1, 'past201912-open'],
    [14, 'past202303-open'],
    [15, 'past15-open'],
    [24, 'past24-open'],
  ])('returns contest id for round %i as %s', (round, expected) => {
    expect(getPastContestId(round)).toBe(expected);
  });

  test('round-trips with getPastContestLabel for rounds 1 to 24', () => {
    for (let round = 1; round <= 24; round++) {
      expect(getPastContestLabel(PAST_TRANSLATIONS, getPastContestId(round))).toBe(
        `PAST 第 ${round} 回`,
      );
    }
  });
});
