import { expect } from 'vitest';

import { getAtCoderUniversityContestLabel } from '#lib/contests/utils/labels/universities.js';

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

  describe('expected to return the registered name for contests listed in ATCODER_UNIVERSITIES', () => {
    test.each([
      ['fuka5', 'ふか杯 5th Contest'],
      ['ttpc', 'TTPC'],
      ['tupc', 'TUPC'],
      ['bogosortcontest_div1', 'bogosort Programming Contest (Div. 1)'],
      ['bogosortcontest_div2', 'bogosort Programming Contest (Div. 2)'],
    ])('when %s is given', (input, expected) => {
      expect(getAtCoderUniversityContestLabel(input)).toBe(expected);
    });
  });

  describe('expected to return null if an invalid format is given', () => {
    test.each([
      'utpc24',
      'xxpc2024',
      'utpc20245',
      '2024utpc',
      'bogosortcontest_div3',
      'constructor',
      '',
    ])('when %s is given', (input) => {
      expect(getAtCoderUniversityContestLabel(input)).toBeNull();
    });
  });
});
