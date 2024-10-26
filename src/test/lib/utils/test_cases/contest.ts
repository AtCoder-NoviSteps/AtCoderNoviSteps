import { createTestCase } from '../../common/test_helpers';
import { ContestType } from '$lib/types/contest';

export type TestCaseForContestType = {
  contestId: string;
  expected: ContestType;
};

export type TestCaseForContestNameLabel = {
  contestId: string;
  expected: string;
};

export type TestCaseForContestNameAndTaskIndex = {
  contestId: string;
  taskTableIndex: string;
  expected: string;
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

// Contest Name Labels
const createTestCaseForContestNameLabel = createTestCase<TestCaseForContestNameLabel>;

export const testCasesForAbcContestNameLabel = [
  createTestCaseForContestNameLabel('ABC001')({
    contestId: 'abc001',
    expected: 'ABC001',
  }),
  createTestCaseForContestNameLabel('ABC002')({
    contestId: 'abc002',
    expected: 'ABC002',
  }),
  createTestCaseForContestNameLabel('ABC099')({
    contestId: 'abc099',
    expected: 'ABC099',
  }),
  createTestCaseForContestNameLabel('ABC100')({
    contestId: 'abc100',
    expected: 'ABC100',
  }),
  createTestCaseForContestNameLabel('ABC101')({
    contestId: 'abc101',
    expected: 'ABC101',
  }),
  createTestCaseForContestNameLabel('ABC200')({
    contestId: 'abc200',
    expected: 'ABC200',
  }),
  createTestCaseForContestNameLabel('ABC201')({
    contestId: 'abc201',
    expected: 'ABC201',
  }),
  createTestCaseForContestNameLabel('ABC365')({
    contestId: 'abc365',
    expected: 'ABC365',
  }),
  createTestCaseForContestNameLabel('ABC999')({
    contestId: 'abc999',
    expected: 'ABC999',
  }),
];

export const testCasesForApg4bContestNameLabel = [
  createTestCaseForContestNameLabel('APG4b')({
    contestId: 'APG4b',
    expected: 'APG4b',
  }),
  createTestCaseForContestNameLabel('APG4b Python')({
    contestId: 'APG4bPython',
    expected: 'APG4bPython',
  }),
];

// Note: Not yet implemented, because notational distortion needs to be corrected for each contest.
export const testCasesForPastContestNameLabel = [
  createTestCaseForContestNameLabel('PAST 17th')({
    contestId: 'past17-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('PAST 16th')({
    contestId: 'past16-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('PAST 15th')({
    contestId: 'past15-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('PAST 14th')({
    contestId: 'past202303-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('PAST 13rd')({
    contestId: 'past202212-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('PAST 3rd')({
    contestId: 'past202005-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('PAST 2nd')({
    contestId: 'past202004-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('PAST 1st')({
    contestId: 'past201912-open',
    expected: '',
  }),
];

// Note: Not yet implemented, because notational distortion needs to be corrected for each contest.
export const testCasesForJoiContestNameLabel = [
  createTestCaseForContestNameLabel('JOIG 2024 open')({
    contestId: 'joig2024-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOIG 2023 open')({
    contestId: 'joig2023-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOIG 2022 open')({
    contestId: 'joig2022-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOIG 2021 open')({
    contestId: 'joig2021-open',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOI 2024 qual 1A')({
    contestId: 'joi2024yo1a',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOI 2024 qual 1B')({
    contestId: 'joi2024yo1b',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOI 2024 qual 1C')({
    contestId: 'joi2024yo1c',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOI 2023 qual 1A')({
    contestId: 'joi2023yo1a',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOI 2023 qual 1B')({
    contestId: 'joi2023yo1b',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOI 2023 qual 1C')({
    contestId: 'joi2023yo1c',
    expected: '',
  }),
  createTestCaseForContestNameLabel('JOI 2018 qual')({
    contestId: 'joi2018yo',
    expected: '',
  }),
];

export const testCasesForArcContestNameLabel = [
  createTestCaseForContestNameLabel('ARC001')({
    contestId: 'arc001',
    expected: 'ARC001',
  }),
  createTestCaseForContestNameLabel('ARC002')({
    contestId: 'arc002',
    expected: 'ARC002',
  }),
  createTestCaseForContestNameLabel('ARC057')({
    contestId: 'arc057',
    expected: 'ARC057',
  }),
  createTestCaseForContestNameLabel('ARC058')({
    contestId: 'arc058',
    expected: 'ARC058',
  }),
  createTestCaseForContestNameLabel('ARC099')({
    contestId: 'arc099',
    expected: 'ARC099',
  }),
  createTestCaseForContestNameLabel('ARC100')({
    contestId: 'arc100',
    expected: 'ARC100',
  }),
  createTestCaseForContestNameLabel('ARC101')({
    contestId: 'arc101',
    expected: 'ARC101',
  }),
  createTestCaseForContestNameLabel('ARC103')({
    contestId: 'arc103',
    expected: 'ARC103',
  }),
  createTestCaseForContestNameLabel('ARC104')({
    contestId: 'arc104',
    expected: 'ARC104',
  }),
  createTestCaseForContestNameLabel('ARC105')({
    contestId: 'arc105',
    expected: 'ARC105',
  }),
  createTestCaseForContestNameLabel('ARC182')({
    contestId: 'arc182',
    expected: 'ARC182',
  }),
  createTestCaseForContestNameLabel('ARC183')({
    contestId: 'arc183',
    expected: 'ARC183',
  }),
];

export const testCasesForAgcContestNameLabel = [
  createTestCaseForContestNameLabel('AGC001')({
    contestId: 'agc001',
    expected: 'AGC001',
  }),
  createTestCaseForContestNameLabel('AGC002')({
    contestId: 'agc002',
    expected: 'AGC002',
  }),
  createTestCaseForContestNameLabel('AGC009')({
    contestId: 'agc009',
    expected: 'AGC009',
  }),
  createTestCaseForContestNameLabel('AGC010')({
    contestId: 'agc010',
    expected: 'AGC010',
  }),
  createTestCaseForContestNameLabel('AGC011')({
    contestId: 'agc011',
    expected: 'AGC011',
  }),
  createTestCaseForContestNameLabel('AGC066')({
    contestId: 'agc066',
    expected: 'AGC066',
  }),
  createTestCaseForContestNameLabel('AGC067')({
    contestId: 'agc067',
    expected: 'AGC067',
  }),
];

export const testCasesForOthersContestLabel = [
  createTestCaseForContestNameLabel('Chokudai SpeedRun 001')({
    contestId: 'chokudai_S001',
    expected: 'Chokudai SpeedRun 001',
  }),
  createTestCaseForContestNameLabel('Chokudai SpeedRun 002')({
    contestId: 'chokudai_S002',
    expected: 'Chokudai SpeedRun 002',
  }),
];

// Contest name and task index
const createTestCaseForContestNameAndTaskIndex = createTestCase<TestCaseForContestNameAndTaskIndex>;

export const testCasesForAbcContestNameAndTaskIndex = [
  createTestCaseForContestNameAndTaskIndex('ABC001, task A')({
    contestId: 'abc001',
    taskTableIndex: 'A',
    expected: 'ABC001 - A',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC001, task B')({
    contestId: 'abc001',
    taskTableIndex: 'B',
    expected: 'ABC001 - B',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC001, task C')({
    contestId: 'abc001',
    taskTableIndex: 'C',
    expected: 'ABC001 - C',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC001, task D')({
    contestId: 'abc001',
    taskTableIndex: 'D',
    expected: 'ABC001 - D',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC002, task A')({
    contestId: 'abc002',
    taskTableIndex: 'A',
    expected: 'ABC002 - A',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC099, task B')({
    contestId: 'abc099',
    taskTableIndex: 'B',
    expected: 'ABC099 - B',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC100, task C')({
    contestId: 'abc100',
    taskTableIndex: 'C',
    expected: 'ABC100 - C',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC101, task D')({
    contestId: 'abc101',
    taskTableIndex: 'D',
    expected: 'ABC101 - D',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC200, task E')({
    contestId: 'abc200',
    taskTableIndex: 'E',
    expected: 'ABC200 - E',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC201, task F')({
    contestId: 'abc201',
    taskTableIndex: 'F',
    expected: 'ABC201 - F',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC365, task G')({
    contestId: 'abc365',
    taskTableIndex: 'G',
    expected: 'ABC365 - G',
  }),
  createTestCaseForContestNameAndTaskIndex('ABC999, task A')({
    contestId: 'abc999',
    taskTableIndex: 'A',
    expected: 'ABC999 - A',
  }),
];

// export const testCasesForContestNameAndTaskIndex = [

//   createTestCaseForContestNameAndTaskIndex('')({
//   }),
// ]
