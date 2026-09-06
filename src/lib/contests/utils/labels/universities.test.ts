import { expect } from 'vitest';

import { getAtCoderUniversityContestLabel } from '$lib/contests/utils/labels/universities';

describe('get AtCoder university contest label', () => {
  describe('expected to return correct label for valid format', () => {
    test.each([
      ['utpc2019', 'UTPC 2019'],
      ['ttpc2022', 'TTPC 2022'],
    ])('when %s is given', (input, expected) => {
      expect(getAtCoderUniversityContestLabel(input)).toBe(expected);
    });
  });

  describe('expected to return null if an invalid format is given', () => {
    test.each(['utpc24', 'ttpc', 'tupc'])('when %s is given', (input) => {
      expect(getAtCoderUniversityContestLabel(input)).toBeNull();
    });
  });
});
