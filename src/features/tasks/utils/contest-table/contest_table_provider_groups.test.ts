import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';

import {
  ABSProvider,
  ABC319OnwardsProvider,
  ABC212ToABC318Provider,
  ABC126ToABC211Provider,
  ABC042ToABC125Provider,
  ABC001ToABC041Provider,
  ARC104OnwardsProvider,
  ARC058ToARC103Provider,
  ARC001ToARC057Provider,
  AGC001OnwardsProvider,
  ABCLikeProvider,
  AWC0001OnwardsProvider,
  ACLPracticeProvider,
  ACLBeginnerProvider,
  ACLProvider,
  EDPCProvider,
  TDPCProvider,
  FPS24Provider,
  JOIFirstQualRoundProvider,
  JOISecondQualRound2020OnwardsProvider,
  JOIQualRoundFrom2006To2019Provider,
  JOISemiFinalRoundProvider,
  Typical90Provider,
  TessokuBookForExamplesProvider,
  TessokuBookForPracticalsProvider,
  TessokuBookForChallengesProvider,
  MathAndAlgorithmProvider,
  prepareContestProviderPresets,
} from './contest_table_provider';
import { TESSOKU_SECTIONS } from '$features/tasks/types/contest-table/contest_table_provider';

describe('prepareContestProviderPresets', () => {
  test('expects to create ABS preset correctly', () => {
    const group = prepareContestProviderPresets().ABS();

    expect(group.getGroupName()).toBe('AtCoder Beginners Selection');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABS',
      ariaLabel: 'Filter AtCoder Beginners Selection',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABS)).toBeInstanceOf(ABSProvider);
  });

  test('expects to create ABC319Onwards preset correctly', () => {
    const group = prepareContestProviderPresets().ABC319Onwards();

    expect(group.getGroupName()).toBe('ABC 319 Onwards');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABC 319 〜 ',
      ariaLabel: 'Filter contests from ABC 319 onwards',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABC)).toBeInstanceOf(ABC319OnwardsProvider);
  });

  test('expects to create fromABC212ToABC318 preset correctly', () => {
    const group = prepareContestProviderPresets().ABC212ToABC318();

    expect(group.getGroupName()).toBe('From ABC 212 to ABC 318');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABC 212 〜 318',
      ariaLabel: 'Filter contests from ABC 212 to ABC 318',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABC)).toBeInstanceOf(ABC212ToABC318Provider);
  });

  test('expects to create Typical90 preset correctly', () => {
    const group = prepareContestProviderPresets().Typical90();

    expect(group.getGroupName()).toBe('競プロ典型 90 問');
    expect(group.getMetadata()).toEqual({
      buttonLabel: '競プロ典型 90 問',
      ariaLabel: 'Filter Typical 90 Problems',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.TYPICAL90)).toBeInstanceOf(Typical90Provider);
  });

  test('expects to create TessokuBook preset correctly with 3 providers', () => {
    const group = prepareContestProviderPresets().TessokuBook();

    expect(group.getGroupName()).toBe('競技プログラミングの鉄則');
    expect(group.getMetadata()).toEqual({
      buttonLabel: '競技プログラミングの鉄則',
      ariaLabel: 'Filter Tessoku Book',
    });
    expect(group.getSize()).toBe(3);
    expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.EXAMPLES)).toBeInstanceOf(
      TessokuBookForExamplesProvider,
    );
    expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.PRACTICALS)).toBeInstanceOf(
      TessokuBookForPracticalsProvider,
    );
    expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.CHALLENGES)).toBeInstanceOf(
      TessokuBookForChallengesProvider,
    );
  });

  test('expects to create DPs preset correctly', () => {
    const group = prepareContestProviderPresets().dps();

    expect(group.getGroupName()).toBe('EDPC・TDPC・FPS 24');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'EDPC・TDPC・FPS 24',
      ariaLabel: 'EDPC and TDPC and FPS 24 contests',
    });
    expect(group.getSize()).toBe(3);
    expect(group.getProvider(ContestType.EDPC)).toBeInstanceOf(EDPCProvider);
    expect(group.getProvider(ContestType.TDPC)).toBeInstanceOf(TDPCProvider);
    expect(group.getProvider(ContestType.FPS_24)).toBeInstanceOf(FPS24Provider);
  });

  test('expects to create ACL preset correctly with 3 providers', () => {
    const group = prepareContestProviderPresets().Acl();

    expect(group.getGroupName()).toBe('AtCoder Library Contests');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'AtCoder Library (ACL)',
      ariaLabel: 'Filter ACL Contests',
    });
    expect(group.getSize()).toBe(3);
    expect(group.getProvider(ContestType.ACL_PRACTICE)).toBeInstanceOf(ACLPracticeProvider);
    expect(group.getProvider(ContestType.ABC_LIKE)).toBeInstanceOf(ACLBeginnerProvider);
    expect(group.getProvider(ContestType.ARC_LIKE)).toBeInstanceOf(ACLProvider);
  });

  test('expects to create JOI First Qual Round preset correctly with 1 provider', () => {
    const group = prepareContestProviderPresets().JOIFirstQualRound();

    expect(group.getGroupName()).toBe('JOI 一次予選');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'JOI 一次予選',
      ariaLabel: 'Filter JOI First Qualifying Round',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.JOI)).toBeInstanceOf(JOIFirstQualRoundProvider);
  });

  test('expects to create JOI Second Qual and Semi-Final Round preset correctly with 3 providers', () => {
    const group = prepareContestProviderPresets().JOISecondQualAndSemiFinalRound();

    expect(group.getGroupName()).toBe('JOI 二次予選・本選');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'JOI 二次予選・本選',
      ariaLabel: 'Filter JOI Second Qual and Semi-Final Round',
    });
    expect(group.getSize()).toBe(3);
    expect(group.getProvider(ContestType.JOI, '2020Onwards')).toBeInstanceOf(
      JOISecondQualRound2020OnwardsProvider,
    );
    expect(group.getProvider(ContestType.JOI, 'from2006To2019')).toBeInstanceOf(
      JOIQualRoundFrom2006To2019Provider,
    );
    expect(group.getProvider(ContestType.JOI, 'semiFinal')).toBeInstanceOf(
      JOISemiFinalRoundProvider,
    );
  });

  test('expects to verify all presets are functions', () => {
    const presets = prepareContestProviderPresets();

    expect(typeof presets.ABS).toBe('function');
    expect(typeof presets.ABC319Onwards).toBe('function');
    expect(typeof presets.ABC212ToABC318).toBe('function');
    expect(typeof presets.ABC126ToABC211).toBe('function');
    expect(typeof presets.ABC042ToABC125).toBe('function');
    expect(typeof presets.ARC104Onwards).toBe('function');
    expect(typeof presets.ARC058ToARC103).toBe('function');
    expect(typeof presets.AGC001Onwards).toBe('function');
    expect(typeof presets.ABCLike).toBe('function');
    expect(typeof presets.AWC0001Onwards).toBe('function');
    expect(typeof presets.ABC001ToABC041).toBe('function');
    expect(typeof presets.ARC001ToARC057).toBe('function');
    expect(typeof presets.Typical90).toBe('function');
    expect(typeof presets.TessokuBook).toBe('function');
    expect(typeof presets.MathAndAlgorithm).toBe('function');
    expect(typeof presets.dps).toBe('function');
    expect(typeof presets.Acl).toBe('function');
    expect(typeof presets.JOIFirstQualRound).toBe('function');
    expect(typeof presets.JOISecondQualAndSemiFinalRound).toBe('function');
  });

  test('expects each preset to create independent instances', () => {
    const presets = prepareContestProviderPresets();
    const group1 = presets.ABS();
    const group2 = presets.ABS();

    expect(group1).not.toBe(group2);
    expect(group1.getGroupName()).toBe(group2.getGroupName());
    expect(group1.getProvider(ContestType.ABS)).not.toBe(group2.getProvider(ContestType.ABS));
  });
});
