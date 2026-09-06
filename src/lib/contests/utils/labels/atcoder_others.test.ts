import { expect } from 'vitest';

import { generateOthersLabel } from '$lib/contests/utils/labels/atcoder_others';

describe('generate AtCoder others label', () => {
  describe('when the contest_id matches the AxC pattern', () => {
    // The regex is checked before the dictionary, so atc001 keeps its numeric form
    // instead of the ATCODER_OTHERS entry 'AtCoder Typical Contest 001'.
    test('converts atc001 to ATC 001', () => {
      expect(generateOthersLabel('atc001')).toBe('ATC 001');
    });
  });

  describe('when the contest_id is in the fixed-label dictionary', () => {
    test.each([
      ['s8pc-3', 'square869120Contest #3'],
      ['donuts', 'Donutsプロコンチャレンジ'],
      ['xmascon19', 'Xmas Contest 2019'],
      ['DEGwer2023', 'DEGwer さんの D 論応援コンテスト'],
      ['code-festival-2014-final', 'Code Festival 2014 決勝'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(generateOthersLabel(contestId)).toBe(expected);
    });
  });

  describe('when the contest_id starts with chokudai_S', () => {
    test.each([
      ['chokudai_S001', 'Chokudai SpeedRun 001'],
      ['chokudai_S002', 'Chokudai SpeedRun 002'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(generateOthersLabel(contestId)).toBe(expected);
    });
  });

  describe('when the contest_id matches nothing', () => {
    test.each(['unknown-xyz', 'some-contest-2099'])(
      'falls back to the uppercased %s',
      (contestId) => {
        expect(generateOthersLabel(contestId)).toBe(contestId.toUpperCase());
      },
    );
  });
});
