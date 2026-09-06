import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/contests/types/contest';

import { TESSOKU_SECTIONS } from '$features/tasks/types/contest-table/contest_table_provider';

import {
  ICPC_PRELIM_OLDEST_YEAR,
  ICPC_PRELIM_LATEST_YEAR,
  ICPC_REGIONAL_OLDEST_YEAR,
  ICPC_REGIONAL_LATEST_YEAR,
  JAG_PRELIM_OLDEST_YEAR,
  JAG_PRELIM_LATEST_YEAR,
  prepareContestProviderPresets,
} from './contest_table_provider_groups';

describe('prepareContestProviderPresets', () => {
  const presets = prepareContestProviderPresets();

  describe('single-provider presets', () => {
    test.each([
      {
        name: 'ABS',
        groupName: 'AtCoder Beginners Selection',
        buttonLabel: 'ABS',
        ariaLabel: 'Filter AtCoder Beginners Selection',
        contestType: ContestType.ABS,
      },
      {
        name: 'ABC319Onwards',
        groupName: 'ABC 319 Onwards',
        buttonLabel: 'ABC 319 〜 ',
        ariaLabel: 'Filter contests from ABC 319 onwards',
        contestType: ContestType.ABC,
      },
      {
        name: 'ABC212ToABC318',
        groupName: 'From ABC 212 to ABC 318',
        buttonLabel: 'ABC 212 〜 318',
        ariaLabel: 'Filter contests from ABC 212 to ABC 318',
        contestType: ContestType.ABC,
      },
      {
        name: 'ABC126ToABC211',
        groupName: 'From ABC 126 to ABC 211',
        buttonLabel: 'ABC 126 〜 211',
        ariaLabel: 'Filter contests from ABC 126 to ABC 211',
        contestType: ContestType.ABC,
      },
      {
        name: 'ABC042ToABC125',
        groupName: 'From ABC 042 to ABC 125',
        buttonLabel: 'ABC 042 〜 125',
        ariaLabel: 'Filter contests from ABC 042 to ABC 125',
        contestType: ContestType.ABC,
      },
      {
        name: 'ABC001ToABC041',
        groupName: 'From ABC 001 to ABC 041',
        buttonLabel: '旧 ABC',
        ariaLabel: 'Filter contests from ABC 001 to ABC 041',
        contestType: ContestType.ABC,
      },
      {
        name: 'ARC104Onwards',
        groupName: 'ARC 104 Onwards',
        buttonLabel: 'ARC 104 〜 ',
        ariaLabel: 'Filter contests from ARC 104 onwards',
        contestType: ContestType.ARC,
      },
      {
        name: 'ARC058ToARC103',
        groupName: 'ARC 058 To ARC 103',
        buttonLabel: 'ARC 058 〜 103',
        ariaLabel: 'Filter contests from ARC 058 to ARC 103',
        contestType: ContestType.ARC,
      },
      {
        name: 'ARC001ToARC057',
        groupName: 'ARC 001 To ARC 057',
        buttonLabel: '旧 ARC',
        ariaLabel: 'Filter contests from ARC 001 to ARC 057',
        contestType: ContestType.ARC,
      },
      {
        name: 'AGC001Onwards',
        groupName: 'AGC 001 Onwards',
        buttonLabel: 'AGC 001 〜 ',
        ariaLabel: 'Filter contests from AGC 001 onwards',
        contestType: ContestType.AGC,
      },
      {
        name: 'ABCLike',
        groupName: 'ABC-Like',
        buttonLabel: 'ABC-Like',
        ariaLabel: 'Filter contests from ABC-Like',
        contestType: ContestType.ABC_LIKE,
      },
      {
        name: 'Typical90',
        groupName: '競プロ典型 90 問',
        buttonLabel: '競プロ典型 90 問',
        ariaLabel: 'Filter Typical 90 Problems',
        contestType: ContestType.TYPICAL90,
      },
      {
        name: 'MathAndAlgorithm',
        groupName: 'アルゴリズムと数学',
        buttonLabel: 'アルゴリズムと数学',
        ariaLabel: 'Filter Math and Algorithm',
        contestType: ContestType.MATH_AND_ALGORITHM,
      },
      {
        name: 'JOIFirstQualRound',
        groupName: 'JOI 一次予選',
        buttonLabel: 'JOI 一次予選',
        ariaLabel: 'Filter JOI First Qualifying Round',
        contestType: ContestType.JOI,
      },
    ] as const)(
      '$name creates group with correct metadata and provider',
      ({ name, groupName, buttonLabel, ariaLabel, contestType }) => {
        const group = presets[name]();

        expect(group.getGroupName()).toBe(groupName);
        expect(group.getMetadata()).toEqual({ buttonLabel, ariaLabel });
        expect(group.getSize()).toBe(1);
        expect(group.getProvider(contestType)).toBeDefined();
      },
    );
  });

  describe('multi-provider presets', () => {
    test('AWC0001Onwards registers 5 providers with correct keys', () => {
      const group = presets.AWC0001Onwards();

      expect(group.getGroupName()).toBe('AWC 0001 Onwards');
      expect(group.getMetadata()).toEqual({
        buttonLabel: 'AWC 0001 〜 ',
        ariaLabel: 'Filter contests from AWC 0001 onwards',
      });
      expect(group.getSize()).toBe(5);

      const sections = ['0151Onwards', '0150', '0101To0149', '0100', '0001To0099'];

      for (const section of sections) {
        expect(group.getProvider(ContestType.AWC, section)).toBeDefined();
      }
    });

    test('TessokuBook registers 3 section providers', () => {
      const group = presets.TessokuBook();

      expect(group.getGroupName()).toBe('競技プログラミングの鉄則');
      expect(group.getMetadata()).toEqual({
        buttonLabel: '競技プログラミングの鉄則',
        ariaLabel: 'Filter Tessoku Book',
      });
      expect(group.getSize()).toBe(3);

      const sections = [
        TESSOKU_SECTIONS.EXAMPLES,
        TESSOKU_SECTIONS.PRACTICALS,
        TESSOKU_SECTIONS.CHALLENGES,
      ];
      for (const section of sections) {
        expect(group.getProvider(ContestType.TESSOKU_BOOK, section)).toBeDefined();
      }
    });

    test('dps registers EDPC, TDPC, NDPC, and FPS 24 providers', () => {
      const group = presets.dps();

      expect(group.getGroupName()).toBe('xDPC・FPS 24');
      expect(group.getMetadata()).toEqual({
        buttonLabel: 'xDPC・FPS 24',
        ariaLabel: 'xDPC and FPS 24 contests',
      });
      expect(group.getSize()).toBe(4);

      const contestTypes = [
        ContestType.EDPC,
        ContestType.TDPC,
        ContestType.NDPC,
        ContestType.FPS_24,
      ];

      for (const contestType of contestTypes) {
        expect(group.getProvider(contestType)).toBeDefined();
      }
    });

    test('Acl registers ACL Practice, ACL Beginner, and ACL Contest providers', () => {
      const group = presets.Acl();

      expect(group.getGroupName()).toBe('AtCoder Library Contests');
      expect(group.getMetadata()).toEqual({
        buttonLabel: 'AtCoder Library (ACL)',
        ariaLabel: 'Filter ACL Contests',
      });
      expect(group.getSize()).toBe(3);

      const contestTypes = [ContestType.ACL_PRACTICE, ContestType.ABC_LIKE, ContestType.ARC_LIKE];

      for (const contestType of contestTypes) {
        expect(group.getProvider(contestType)).toBeDefined();
      }
    });

    test('JOISecondQualAndSemiFinalRound registers 3 section providers', () => {
      const group = presets.JOISecondQualAndSemiFinalRound();

      expect(group.getGroupName()).toBe('JOI 二次予選・本選');
      expect(group.getMetadata()).toEqual({
        buttonLabel: 'JOI 二次予選・本選',
        ariaLabel: 'Filter JOI Second Qual and Semi-Final Round',
      });
      expect(group.getSize()).toBe(3);

      const sections = ['2020Onwards', 'from2006To2019', 'semiFinal'];

      for (const section of sections) {
        expect(group.getProvider(ContestType.JOI, section)).toBeDefined();
      }
    });
  });

  describe('year-range presets', () => {
    test('AojIcpcPrelim registers one provider per year', () => {
      const group = presets.AojIcpcPrelim();

      expect(group.getGroupName()).toBe('ICPC 国内予選');
      expect(group.getMetadata()).toEqual({
        buttonLabel: 'ICPC 国内予選',
        ariaLabel: 'Filter ICPC Domestic Preliminary',
      });
      expect(group.getSize()).toBe(ICPC_PRELIM_LATEST_YEAR - ICPC_PRELIM_OLDEST_YEAR + 1);
      expect(group.getProvider(ContestType.AOJ_ICPC, '2023')).toBeDefined();
    });

    test('AojIcpcRegional registers one provider per year', () => {
      const group = presets.AojIcpcRegional();

      expect(group.getGroupName()).toBe('ICPC アジア地区');
      expect(group.getMetadata()).toEqual({
        buttonLabel: 'ICPC アジア地区',
        ariaLabel: 'Filter ICPC Asia Regional',
      });
      expect(group.getSize()).toBe(ICPC_REGIONAL_LATEST_YEAR - ICPC_REGIONAL_OLDEST_YEAR + 1);
      expect(group.getProvider(ContestType.AOJ_ICPC, '2024')).toBeDefined();
    });

    test('AojJagPrelim registers providers including A/B split for 2016', () => {
      const group = presets.AojJagPrelim();

      expect(group.getGroupName()).toBe('JAG 模擬国内');
      expect(group.getMetadata()).toEqual({
        buttonLabel: 'JAG 模擬国内',
        ariaLabel: 'Filter JAG Domestic Preliminary',
      });
      // 2016 was held twice (A/B), adding one extra provider beyond the year span.
      expect(group.getSize()).toBe(JAG_PRELIM_LATEST_YEAR - JAG_PRELIM_OLDEST_YEAR + 1 + 1);
      expect(group.getProvider(ContestType.AOJ_JAG, '2023')).toBeDefined();
      expect(group.getProvider(ContestType.AOJ_JAG, '2016A')).toBeDefined();
      expect(group.getProvider(ContestType.AOJ_JAG, '2016B')).toBeDefined();
    });
  });
});
