import { expect } from 'vitest';

import { AOJ_COURSES } from '$lib/contests/utils/prefixes';
import {
  getAojContestLabel,
  getAojUniversityContestLabel,
  PCK_TRANSLATIONS,
  JAG_TRANSLATIONS,
  ICPC_TRANSLATIONS,
} from '$lib/contests/utils/labels/aoj';

describe('get AOJ contest label', () => {
  describe('AOJ courses', () => {
    test.each([
      ['ITP1', '（プログラミング入門）'],
      ['ALDS1', '（アルゴリズムとデータ構造入門）'],
      ['NTL', '（整数論）'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getAojContestLabel(AOJ_COURSES, contestId)).toBe(expected);
    });
  });

  describe('PCK', () => {
    test.each([
      ['PCKPrelim2024', '（パソコン甲子園 予選 2024）'],
      ['PCKFinal2023', '（パソコン甲子園 本選 2023）'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getAojContestLabel(PCK_TRANSLATIONS, contestId)).toBe(expected);
    });
  });

  describe('ICPC', () => {
    test.each([
      ['ICPCPrelim2024', '（ICPC 国内予選 2024）'],
      ['ICPCRegional2023', '（ICPC アジア地区 2023）'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getAojContestLabel(ICPC_TRANSLATIONS, contestId)).toBe(expected);
    });
  });

  describe('JAG', () => {
    test.each([
      ['JAGPrelim2024', '（JAG 模擬国内 2024）'],
      ['JAGRegional2022', '（JAG 模擬地区 2022）'],
      ['JAGSummer2019-day2', '（JAG 夏合宿 2019 Day2）'],
      ['JAGWinter2020', '（JAG 冬合宿 2020）'],
      ['JAGSpring2018', '（JAG 春合宿 2018）'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getAojContestLabel(JAG_TRANSLATIONS, contestId)).toBe(expected);
    });
  });

  describe('when the contest_id contains no translatable token', () => {
    test('wraps the contest_id in parentheses unchanged', () => {
      expect(getAojContestLabel(PCK_TRANSLATIONS, 'unknown2024')).toBe('（unknown2024）');
    });
  });
});

describe('get AOJ university contest label', () => {
  describe('when the contest_id has a joint-contest venue', () => {
    test.each([
      ['AOJ-RUPC2018-in-ACPC2018-day1', '（RUPC 2018 in ACPC 2018 Day1）'],
      ['AOJ-HUPC2020-in-HUPC2020-day1', '（HUPC 2020 in HUPC 2020 Day1）'],
      ['AOJ-OUPC2012-in-RUPC2012-day2', '（OUPC 2012 in RUPC 2012 Day2）'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getAojUniversityContestLabel(contestId)).toBe(expected);
    });
  });

  describe('when the contest_id is UAPC', () => {
    // UAPC was renamed to ACPC, so the label uses the current name.
    test.each([
      ['AOJ-UAPC2003', '（ACPC 2003）'],
      ['AOJ-UAPC2012-day1', '（ACPC 2012 Day1）'],
      ['AOJ-UAPC2011-summer', '（ACPC 2011 Summer）'],
      ['AOJ-UAPC2019-in-RUPC2019-day2', '（ACPC 2019 in RUPC 2019 Day2）'],
    ])('converts %s to %s', (contestId, expected) => {
      expect(getAojUniversityContestLabel(contestId)).toBe(expected);
    });
  });
});
