import { createTestCase } from '../../common/test_helpers';
import { ContestType } from '$lib/types/contest';

export type TestCaseForContestType = {
  contestId: string;
  expected: ContestType;
};

// Contest Types
const createTestCaseForContestType = createTestCase<TestCaseForContestType>;

export const testCasesForAbcContest = [
  createTestCaseForContestType('ABC001')({
    contestId: 'abc001',
    expected: ContestType.ABC,
  }),
  createTestCaseForContestType('ABC002')({
    contestId: 'abc002',
    expected: ContestType.ABC,
  }),
  createTestCaseForContestType('ABC099')({
    contestId: 'abc099',
    expected: ContestType.ABC,
  }),
  createTestCaseForContestType('ABC100')({
    contestId: 'abc100',
    expected: ContestType.ABC,
  }),
  createTestCaseForContestType('ABC101')({
    contestId: 'abc101',
    expected: ContestType.ABC,
  }),
  createTestCaseForContestType('ABC200')({
    contestId: 'abc200',
    expected: ContestType.ABC,
  }),
  createTestCaseForContestType('ABC201')({
    contestId: 'abc201',
    expected: ContestType.ABC,
  }),
  createTestCaseForContestType('ABC365')({
    contestId: 'abc365',
    expected: ContestType.ABC,
  }),
  createTestCaseForContestType('ABC999')({
    contestId: 'abc999',
    expected: ContestType.ABC,
  }),
];

export const testCasesForPastContest = [
  createTestCaseForContestType('PAST 17th')({
    contestId: 'past17-open',
    expected: ContestType.PAST,
  }),
  createTestCaseForContestType('PAST 16th')({
    contestId: 'past16-open',
    expected: ContestType.PAST,
  }),
  createTestCaseForContestType('PAST 15th')({
    contestId: 'past15-open',
    expected: ContestType.PAST,
  }),
  createTestCaseForContestType('PAST 14th')({
    contestId: 'past202303-open',
    expected: ContestType.PAST,
  }),
  createTestCaseForContestType('PAST 13rd')({
    contestId: 'past202212-open',
    expected: ContestType.PAST,
  }),
  createTestCaseForContestType('PAST 3rd')({
    contestId: 'past202005-open',
    expected: ContestType.PAST,
  }),
  createTestCaseForContestType('PAST 2nd')({
    contestId: 'past202004-open',
    expected: ContestType.PAST,
  }),
  createTestCaseForContestType('PAST 1st')({
    contestId: 'past201912-open',
    expected: ContestType.PAST,
  }),
];

export const testCasesForJoiContest = [
  createTestCaseForContestType('JOIG 2024 open')({
    contestId: 'joig2024-open',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOIG 2023 open')({
    contestId: 'joig2023-open',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOIG 2022 open')({
    contestId: 'joig2022-open',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOIG 2021 open')({
    contestId: 'joig2021-open',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOI 2024 qual 1A')({
    contestId: 'joi2024yo1a',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOI 2024 qual 1B')({
    contestId: 'joi2024yo1b',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOI 2024 qual 1C')({
    contestId: 'joi2024yo1c',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOI 2023 qual 1A')({
    contestId: 'joi2023yo1a',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOI 2023 qual 1B')({
    contestId: 'joi2023yo1b',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOI 2023 qual 1C')({
    contestId: 'joi2023yo1c',
    expected: ContestType.JOI,
  }),
  createTestCaseForContestType('JOI 2018 qual')({
    contestId: 'joi2018yo',
    expected: ContestType.JOI,
  }),
];

export const testCasesForArcContest = [
  createTestCaseForContestType('ARC001')({
    contestId: 'arc001',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC002')({
    contestId: 'arc002',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC057')({
    contestId: 'arc057',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC058')({
    contestId: 'arc058',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC099')({
    contestId: 'arc099',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC100')({
    contestId: 'arc100',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC101')({
    contestId: 'arc101',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC103')({
    contestId: 'arc103',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC104')({
    contestId: 'arc104',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC105')({
    contestId: 'arc105',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC182')({
    contestId: 'arc182',
    expected: ContestType.ARC,
  }),
  createTestCaseForContestType('ARC183')({
    contestId: 'arc183',
    expected: ContestType.ARC,
  }),
];

export const testCasesForAgcContest = [
  createTestCaseForContestType('AGC001')({
    contestId: 'agc001',
    expected: ContestType.AGC,
  }),
  createTestCaseForContestType('AGC002')({
    contestId: 'agc002',
    expected: ContestType.AGC,
  }),
  createTestCaseForContestType('AGC009')({
    contestId: 'agc009',
    expected: ContestType.AGC,
  }),
  createTestCaseForContestType('AGC010')({
    contestId: 'agc010',
    expected: ContestType.AGC,
  }),
  createTestCaseForContestType('AGC011')({
    contestId: 'agc011',
    expected: ContestType.AGC,
  }),
  createTestCaseForContestType('AGC066')({
    contestId: 'agc066',
    expected: ContestType.AGC,
  }),
  createTestCaseForContestType('AGC067')({
    contestId: 'agc067',
    expected: ContestType.AGC,
  }),
];

export const testCasesForArcLikeContest = [
  createTestCaseForContestType('Tenka1 2018')({
    contestId: 'tenka1-2018',
    expected: ContestType.ARC_LIKE,
  }),
];

export const testCasesForAgcLikeContest = [
  createTestCaseForContestType('CODE FESTIVAL 2017 qual A')({
    contestId: 'code-festival-2017-quala',
    expected: ContestType.AGC_LIKE,
  }),
  createTestCaseForContestType('CODE FESTIVAL 2017 qual B')({
    contestId: 'code-festival-2017-qualb',
    expected: ContestType.AGC_LIKE,
  }),
  createTestCaseForContestType('CODE FESTIVAL 2017 qual C')({
    contestId: 'code-festival-2017-qualc',
    expected: ContestType.AGC_LIKE,
  }),
  createTestCaseForContestType('CODE FESTIVAL 2017 final')({
    contestId: 'cf17-final',
    expected: ContestType.AGC_LIKE,
  }),
];

export const testCasesForOthersContest = [
  createTestCaseForContestType('Chokudai SpeedRun 001')({
    contestId: 'chokudai_S001',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType('Chokudai SpeedRun 002')({
    contestId: 'chokudai_S002',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType('CODE FESTIVAL 2014 final')({
    contestId: 'code-festival-2014-final',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType('Donuts Procon Challenge 2014')({
    contestId: 'donuts-live2014',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType('Donuts Procon Challenge 2015')({
    contestId: 'donuts-2015',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType('MUJIN Programming Challenge 2016')({
    contestId: 'mujin-pc-2016',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType('COLOCON 2018 qual')({
    contestId: 'colopl2018-qual',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType('COLOCON 2018 final')({
    contestId: 'colopl2018-final',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType('Gigacode 2019')({
    contestId: 'gigacode-2019',
    expected: ContestType.OTHERS,
  }),
];
