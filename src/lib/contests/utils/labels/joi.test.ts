import { expect } from 'vitest';

import { getJoiContestLabel } from '$lib/contests/utils/labels/joi';

describe('get JOI contest label', () => {
  describe('qualifying rounds', () => {
    test.each([
      ['joi2018yo', 'JOI 予選 2018'],
      ['joi2024yo1a', 'JOI 一次予選 2024 第 1 回'],
      ['joi2024yo2', 'JOI 二次予選 2024'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getJoiContestLabel(contestId)).toBe(expected);
    });
  });

  describe('final and later stages', () => {
    test.each([
      ['joi2023ho', 'JOI 本選 2023'],
      ['joi2026sf', 'JOI セミファイナルステージ 2026'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getJoiContestLabel(contestId)).toBe(expected);
    });
  });

  describe('spring camp', () => {
    test.each([
      ['joisc2022', 'JOI 春合宿 2022'],
      ['joisp2021', 'JOI 春合宿 2021'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getJoiContestLabel(contestId)).toBe(expected);
    });
  });

  describe('JOIG (for girls)', () => {
    test('converts joig2024-open to JOIG 2024, stripping the -open suffix', () => {
      expect(getJoiContestLabel('joig2024-open')).toBe('JOIG 2024');
    });
  });
});
