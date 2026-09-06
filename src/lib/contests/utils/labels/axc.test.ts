import { expect } from 'vitest';

import { generateAxcLabel, generateAwcLabel } from '$lib/contests/utils/labels/axc';

describe('generate AxC label', () => {
  describe('when a three-digit contest_id is given', () => {
    test.each([
      ['abc001', 'ABC 001'],
      ['abc376', 'ABC 376'],
      ['arc128', 'ARC 128'],
      ['agc045', 'AGC 045'],
      ['atc001', 'ATC 001'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(generateAxcLabel(contestId)).toBe(expected);
    });
  });

  describe('when the contest_id is uppercase', () => {
    test('normalizes the contest type to uppercase', () => {
      expect(generateAxcLabel('ARC128')).toBe('ARC 128');
    });
  });

  describe('when the digit count does not match', () => {
    test.each(['abc12', 'abc1234', 'xyz123'])('returns %s unchanged', (contestId) => {
      expect(generateAxcLabel(contestId)).toBe(contestId);
    });
  });
});

describe('generate AWC label', () => {
  describe('when a four-digit contest_id is given', () => {
    test.each([
      ['awc0001', 'AWC 0001'],
      ['awc0123', 'AWC 0123'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(generateAwcLabel(contestId)).toBe(expected);
    });
  });

  describe('when the digit count does not match', () => {
    test.each(['awc001', 'awc12345'])('returns %s unchanged', (contestId) => {
      expect(generateAwcLabel(contestId)).toBe(contestId);
    });
  });
});
