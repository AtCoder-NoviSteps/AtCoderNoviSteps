import { ContestType } from '$lib/types/contest';

import { ABSProvider } from './abs_provider';
import {
  ABC319OnwardsProvider,
  ABC212ToABC318Provider,
  ABC126ToABC211Provider,
  ABC042ToABC125Provider,
  ABC001ToABC041Provider,
} from './abc_providers';
import {
  ARC104OnwardsProvider,
  ARC058ToARC103Provider,
  ARC001ToARC057Provider,
} from './arc_providers';
import { AGC001OnwardsProvider } from './agc_provider';
import { ABCLikeProvider } from './axc_like_provider';
import { AWC0001OnwardsProvider } from './awc_provider';
import { Typical90Provider } from './typical90_provider';
import {
  TessokuBookForExamplesProvider,
  TessokuBookForPracticalsProvider,
  TessokuBookForChallengesProvider,
} from './tessoku_book_providers';
import { MathAndAlgorithmProvider } from './math_and_algorithm_provider';
import { EDPCProvider, TDPCProvider } from './dp_providers';
import { FPS24Provider } from './fps24_provider';
import { ACLPracticeProvider, ACLBeginnerProvider, ACLProvider } from './acl_providers';
import {
  JOIFirstQualRoundProvider,
  JOISecondQualRound2020OnwardsProvider,
  JOIQualRoundFrom2006To2019Provider,
  JOISemiFinalRoundProvider,
} from './joi_providers';
import { ContestTableProviderGroup } from './contest_table_provider_group';

/**
 * Prepare predefined provider groups
 * Easily create groups with commonly used combinations
 */
export const prepareContestProviderPresets = () => {
  return {
    /**
     * Single group for AtCoder Beginners Selection
     */
    ABS: () =>
      new ContestTableProviderGroup(`AtCoder Beginners Selection`, {
        buttonLabel: 'ABS',
        ariaLabel: 'Filter AtCoder Beginners Selection',
      }).addProvider(new ABSProvider(ContestType.ABS)),

    /**
     * Single group for ABC 319 onwards
     */
    ABC319Onwards: () =>
      new ContestTableProviderGroup(`ABC 319 Onwards`, {
        buttonLabel: 'ABC 319 〜 ',
        ariaLabel: 'Filter contests from ABC 319 onwards',
      }).addProvider(new ABC319OnwardsProvider(ContestType.ABC)),

    /**
     * Single group for ABC 212-318
     */
    ABC212ToABC318: () =>
      new ContestTableProviderGroup(`From ABC 212 to ABC 318`, {
        buttonLabel: 'ABC 212 〜 318',
        ariaLabel: 'Filter contests from ABC 212 to ABC 318',
      }).addProvider(new ABC212ToABC318Provider(ContestType.ABC)),

    /**
     * Single group for ABC 126-211
     */
    ABC126ToABC211: () =>
      new ContestTableProviderGroup(`From ABC 126 to ABC 211`, {
        buttonLabel: 'ABC 126 〜 211',
        ariaLabel: 'Filter contests from ABC 126 to ABC 211',
      }).addProvider(new ABC126ToABC211Provider(ContestType.ABC)),

    /**
     * Single group for ABC 042-125
     */
    ABC042ToABC125: () =>
      new ContestTableProviderGroup(`From ABC 042 to ABC 125`, {
        buttonLabel: 'ABC 042 〜 125',
        ariaLabel: 'Filter contests from ABC 042 to ABC 125',
      }).addProvider(new ABC042ToABC125Provider(ContestType.ABC)),

    /**
     * Single group for ABC 001-041
     */
    ABC001ToABC041: () =>
      new ContestTableProviderGroup(`From ABC 001 to ABC 041`, {
        buttonLabel: '旧 ABC',
        ariaLabel: 'Filter contests from ABC 001 to ABC 041',
      }).addProvider(new ABC001ToABC041Provider(ContestType.ABC)),

    /**
     * Single group for ARC 104 onwards
     */
    ARC104Onwards: () =>
      new ContestTableProviderGroup(`ARC 104 Onwards`, {
        buttonLabel: 'ARC 104 〜 ',
        ariaLabel: 'Filter contests from ARC 104 onwards',
      }).addProvider(new ARC104OnwardsProvider(ContestType.ARC)),

    /**
     * Single group for ARC 058-103
     */
    ARC058ToARC103: () =>
      new ContestTableProviderGroup(`ARC 058 To ARC 103`, {
        buttonLabel: 'ARC 058 〜 103',
        ariaLabel: 'Filter contests from ARC 058 to ARC 103',
      }).addProvider(new ARC058ToARC103Provider(ContestType.ARC)),

    /**
     * Single group for ARC 001-057
     */
    ARC001ToARC057: () =>
      new ContestTableProviderGroup(`ARC 001 To ARC 057`, {
        buttonLabel: '旧 ARC',
        ariaLabel: 'Filter contests from ARC 001 to ARC 057',
      }).addProvider(new ARC001ToARC057Provider(ContestType.ARC)),

    /**
     * Single group for AGC 001 onwards
     */
    AGC001Onwards: () =>
      new ContestTableProviderGroup(`AGC 001 Onwards`, {
        buttonLabel: 'AGC 001 〜 ',
        ariaLabel: 'Filter contests from AGC 001 onwards',
      }).addProvider(new AGC001OnwardsProvider(ContestType.AGC)),

    /**
     * Single group for ABC-Like Contests
     */
    ABCLike: () =>
      new ContestTableProviderGroup('ABC-Like', {
        buttonLabel: 'ABC-Like',
        ariaLabel: 'Filter contests from ABC-Like',
      }).addProvider(new ABCLikeProvider(ContestType.ABC_LIKE)),

    /**
     * Single group for AWC 0001 onwards
     */
    AWC0001Onwards: () =>
      new ContestTableProviderGroup(`AWC 0001 Onwards`, {
        buttonLabel: 'AWC 0001 〜 ',
        ariaLabel: 'Filter contests from AWC 0001 onwards',
      }).addProvider(new AWC0001OnwardsProvider(ContestType.AWC)),

    /**
     * Single group for Typical 90 Problems
     */
    Typical90: () =>
      new ContestTableProviderGroup(`競プロ典型 90 問`, {
        buttonLabel: '競プロ典型 90 問',
        ariaLabel: 'Filter Typical 90 Problems',
      }).addProvider(new Typical90Provider(ContestType.TYPICAL90)),

    /**
     * Groups for Tessoku Book
     * Note: Only sectioned providers are registered (examples, practicals, challenges).
     * The base TessokuBookProvider is not registered as it's meant to be subclassed only.
     */
    TessokuBook: () =>
      new ContestTableProviderGroup(`競技プログラミングの鉄則`, {
        buttonLabel: '競技プログラミングの鉄則',
        ariaLabel: 'Filter Tessoku Book',
      }).addProviders(
        new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK),
        new TessokuBookForPracticalsProvider(ContestType.TESSOKU_BOOK),
        new TessokuBookForChallengesProvider(ContestType.TESSOKU_BOOK),
      ),

    /**
     * Single group for Math and Algorithm Book
     */
    MathAndAlgorithm: () =>
      new ContestTableProviderGroup(`アルゴリズムと数学`, {
        buttonLabel: 'アルゴリズムと数学',
        ariaLabel: 'Filter Math and Algorithm',
      }).addProvider(new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM)),

    /**
     * DP group (EDPC and TDPC)
     */
    dps: () =>
      new ContestTableProviderGroup(`EDPC・TDPC・FPS 24`, {
        buttonLabel: 'EDPC・TDPC・FPS 24',
        ariaLabel: 'EDPC and TDPC and FPS 24 contests',
      }).addProviders(
        new EDPCProvider(ContestType.EDPC),
        new TDPCProvider(ContestType.TDPC),
        new FPS24Provider(ContestType.FPS_24),
      ),

    /**
     * Group for AtCoder Library Contests (ACL)
     * Includes ACL Practice, ACL Beginner, and ACL Contest 1
     */
    Acl: () =>
      new ContestTableProviderGroup(`AtCoder Library Contests`, {
        buttonLabel: 'AtCoder Library (ACL)',
        ariaLabel: 'Filter ACL Contests',
      }).addProviders(
        new ACLPracticeProvider(ContestType.ACL_PRACTICE),
        new ACLBeginnerProvider(ContestType.ABC_LIKE),
        new ACLProvider(ContestType.ARC_LIKE),
      ),

    JOIFirstQualRound: () =>
      new ContestTableProviderGroup(`JOI 一次予選`, {
        buttonLabel: 'JOI 一次予選',
        ariaLabel: 'Filter JOI First Qualifying Round',
      }).addProvider(new JOIFirstQualRoundProvider(ContestType.JOI)),

    JOISecondQualAndSemiFinalRound: () =>
      new ContestTableProviderGroup(`JOI 二次予選・本選`, {
        buttonLabel: 'JOI 二次予選・本選',
        ariaLabel: 'Filter JOI Second Qual and Semi-Final Round',
      }).addProviders(
        new JOISecondQualRound2020OnwardsProvider(ContestType.JOI),
        new JOIQualRoundFrom2006To2019Provider(ContestType.JOI),
        new JOISemiFinalRoundProvider(ContestType.JOI),
      ),
  };
};

export const contestTableProviderGroups = {
  abs: prepareContestProviderPresets().ABS(),
  abc319Onwards: prepareContestProviderPresets().ABC319Onwards(),
  fromAbc212ToAbc318: prepareContestProviderPresets().ABC212ToABC318(),
  fromAbc126ToAbc211: prepareContestProviderPresets().ABC126ToABC211(),
  fromAbc042ToAbc125: prepareContestProviderPresets().ABC042ToABC125(),
  arc104Onwards: prepareContestProviderPresets().ARC104Onwards(),
  fromArc058ToArc103: prepareContestProviderPresets().ARC058ToARC103(),
  agc001Onwards: prepareContestProviderPresets().AGC001Onwards(),
  abcLike: prepareContestProviderPresets().ABCLike(),
  awc0001Onwards: prepareContestProviderPresets().AWC0001Onwards(),
  fromAbc001ToAbc041: prepareContestProviderPresets().ABC001ToABC041(),
  fromArc001ToArc057: prepareContestProviderPresets().ARC001ToARC057(),
  typical90: prepareContestProviderPresets().Typical90(),
  tessokuBook: prepareContestProviderPresets().TessokuBook(),
  mathAndAlgorithm: prepareContestProviderPresets().MathAndAlgorithm(),
  dps: prepareContestProviderPresets().dps(), // Dynamic Programming (DP) Contests
  acl: prepareContestProviderPresets().Acl(),
  joiFirstQualRound: prepareContestProviderPresets().JOIFirstQualRound(),
  joiSecondQualAndSemiFinalRound: prepareContestProviderPresets().JOISecondQualAndSemiFinalRound(),
};

export type ContestTableProviderGroups = keyof typeof contestTableProviderGroups;
