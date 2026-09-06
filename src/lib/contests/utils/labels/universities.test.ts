import { expect } from 'vitest';

import { getAtCoderUniversityContestLabel } from '$lib/contests/utils/labels/universities';

describe('get AtCoder university contest label', () => {
  describe('expected to return correct label for valid format', () => {
    test.each([
      ['kupc2024', 'KUPC 2024'],
      ['qupc2018', 'QUPC 2018'],
      ['utpc2019', 'UTPC 2019'],
      ['ttpc2022', 'TTPC 2022'],
      ['tupc2023', 'TUPC 2023'],
      ['wupc2019', 'WUPC 2019'],
      ['UTPC2019', 'UTPC 2019'],
    ])('when %s is given', (input, expected) => {
      expect(getAtCoderUniversityContestLabel(input)).toBe(expected);
    });
  });

  describe('expected to return null if an invalid format is given', () => {
    test.each(['utpc24', 'ttpc', 'tupc', 'xxpc2024', 'utpc20245', '2024utpc', ''])(
      'when %s is given',
      (input) => {
        expect(getAtCoderUniversityContestLabel(input)).toBeNull();
      },
    );
  });
});
