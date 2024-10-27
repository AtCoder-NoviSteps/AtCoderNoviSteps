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

export const testCasesForApg4bContestNameAndTaskIndex = [
  createTestCaseForContestNameAndTaskIndex('APG4b, task EX1')({
    contestId: 'APG4b',
    taskTableIndex: 'EX1',
    expected: 'APG4b - EX1',
  }),
  createTestCaseForContestNameAndTaskIndex('APG4b, task EX2')({
    contestId: 'APG4b',
    taskTableIndex: 'EX2',
    expected: 'APG4b - EX2',
  }),
  createTestCaseForContestNameAndTaskIndex('APG4b, task EX10')({
    contestId: 'APG4b',
    taskTableIndex: 'EX10',
    expected: 'APG4b - EX10',
  }),
  createTestCaseForContestNameAndTaskIndex('APG4bPython, EX1')({
    contestId: 'APG4bPython',
    taskTableIndex: 'EX1',
    expected: 'APG4bPython - EX1',
  }),
];

export const testCasesForTypical90ContestNameAndTaskIndex = [
  createTestCaseForContestNameAndTaskIndex('Typical90, task 001')({
    contestId: 'typical90',
    taskTableIndex: '001',
    expected: '競プロ典型 90 問 - 001',
  }),
  createTestCaseForContestNameAndTaskIndex('Typical90, task 002')({
    contestId: 'typical90',
    taskTableIndex: '002',
    expected: '競プロ典型 90 問 - 002',
  }),
  createTestCaseForContestNameAndTaskIndex('Typical90, task 010')({
    contestId: 'typical90',
    taskTableIndex: '010',
    expected: '競プロ典型 90 問 - 010',
  }),
  createTestCaseForContestNameAndTaskIndex('Typical90, task 090')({
    contestId: 'typical90',
    taskTableIndex: '090',
    expected: '競プロ典型 90 問 - 090',
  }),
];

export const testCasesForTessokuBookContestNameAndTaskIndex = [
  createTestCaseForContestNameAndTaskIndex('Tessoku Book, Task A01')({
    contestId: 'tessoku-book',
    taskTableIndex: 'A01',
    expected: '競技プログラミングの鉄則 - A01',
  }),
  createTestCaseForContestNameAndTaskIndex('Tessoku Book, Task A10')({
    contestId: 'tessoku-book',
    taskTableIndex: 'A10',
    expected: '競技プログラミングの鉄則 - A10',
  }),
  createTestCaseForContestNameAndTaskIndex('Tessoku Book, Task A77')({
    contestId: 'tessoku-book',
    taskTableIndex: 'A77',
    expected: '競技プログラミングの鉄則 - A77',
  }),
  createTestCaseForContestNameAndTaskIndex('Tessoku Book, Task B01')({
    contestId: 'tessoku-book',
    taskTableIndex: 'B01',
    expected: '競技プログラミングの鉄則 - B01',
  }),
  createTestCaseForContestNameAndTaskIndex('Tessoku Book, Task B10')({
    contestId: 'tessoku-book',
    taskTableIndex: 'B10',
    expected: '競技プログラミングの鉄則 - B10',
  }),
  createTestCaseForContestNameAndTaskIndex('Tessoku Book, Task B69')({
    contestId: 'tessoku-book',
    taskTableIndex: 'B69',
    expected: '競技プログラミングの鉄則 - B69',
  }),
  createTestCaseForContestNameAndTaskIndex('Tessoku Book, Task C01')({
    contestId: 'tessoku-book',
    taskTableIndex: 'C01',
    expected: '競技プログラミングの鉄則 - C01',
  }),
  createTestCaseForContestNameAndTaskIndex('Tessoku Book, Task C10')({
    contestId: 'tessoku-book',
    taskTableIndex: 'C10',
    expected: '競技プログラミングの鉄則 - C10',
  }),
  createTestCaseForContestNameAndTaskIndex('Tessoku Book, Task C20')({
    contestId: 'tessoku-book',
    taskTableIndex: 'C20',
    expected: '競技プログラミングの鉄則 - C20',
  }),
];

export const testCasesForMathAndAlgorithmContestNameAndTaskIndex = [
  createTestCaseForContestNameAndTaskIndex('Math and algorithm, task 001')({
    contestId: 'math-and-algorithm',
    taskTableIndex: '001',
    expected: 'アルゴリズムと数学 - 001',
  }),
  createTestCaseForContestNameAndTaskIndex('Math and algorithm, task 002')({
    contestId: 'math-and-algorithm',
    taskTableIndex: '002',
    expected: 'アルゴリズムと数学 - 002',
  }),
  createTestCaseForContestNameAndTaskIndex('Math and algorithm, task 010')({
    contestId: 'math-and-algorithm',
    taskTableIndex: '010',
    expected: 'アルゴリズムと数学 - 010',
  }),
  createTestCaseForContestNameAndTaskIndex('Math and algorithm, task 099')({
    contestId: 'math-and-algorithm',
    taskTableIndex: '099',
    expected: 'アルゴリズムと数学 - 099',
  }),
  createTestCaseForContestNameAndTaskIndex('Math and algorithm, task 100')({
    contestId: 'math-and-algorithm',
    taskTableIndex: '100',
    expected: 'アルゴリズムと数学 - 100',
  }),
  createTestCaseForContestNameAndTaskIndex('Math and algorithm, task 104')({
    contestId: 'math-and-algorithm',
    taskTableIndex: '104',
    expected: 'アルゴリズムと数学 - 104',
  }),
];

export const testCasesForArcContestNameAndTaskIndex = [
  createTestCaseForContestNameAndTaskIndex('ARC001, task A')({
    contestId: 'arc001',
    taskTableIndex: 'A',
    expected: 'ARC001 - A',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC002, task B')({
    contestId: 'arc002',
    taskTableIndex: 'B',
    expected: 'ARC002 - B',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC057, task C')({
    contestId: 'arc057',
    taskTableIndex: 'C',
    expected: 'ARC057 - C',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC058, task D')({
    contestId: 'arc058',
    taskTableIndex: 'D',
    expected: 'ARC058 - D',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC099, task E')({
    contestId: 'arc099',
    taskTableIndex: 'E',
    expected: 'ARC099 - E',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC100, task F')({
    contestId: 'arc100',
    taskTableIndex: 'F',
    expected: 'ARC100 - F',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC101, task C')({
    contestId: 'arc101',
    taskTableIndex: 'C',
    expected: 'ARC101 - C',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC103, task D')({
    contestId: 'arc103',
    taskTableIndex: 'D',
    expected: 'ARC103 - D',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC104, task A')({
    contestId: 'arc104',
    taskTableIndex: 'A',
    expected: 'ARC104 - A',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC105, task B')({
    contestId: 'arc105',
    taskTableIndex: 'B',
    expected: 'ARC105 - B',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC182, task C')({
    contestId: 'arc182',
    taskTableIndex: 'C',
    expected: 'ARC182 - C',
  }),
  createTestCaseForContestNameAndTaskIndex('ARC183, task D')({
    contestId: 'arc183',
    taskTableIndex: 'D',
    expected: 'ARC183 - D',
  }),
];

export const testCasesForAgcContestNameAndTaskIndex = [
  createTestCaseForContestNameAndTaskIndex('AGC001, task A')({
    contestId: 'agc001',
    taskTableIndex: 'A',
    expected: 'AGC001 - A',
  }),
  createTestCaseForContestNameAndTaskIndex('AGC002, task B')({
    contestId: 'agc002',
    taskTableIndex: 'B',
    expected: 'AGC002 - B',
  }),
  createTestCaseForContestNameAndTaskIndex('AGC009, task C')({
    contestId: 'agc009',
    taskTableIndex: 'C',
    expected: 'AGC009 - C',
  }),
  createTestCaseForContestNameAndTaskIndex('AGC010, task D')({
    contestId: 'agc010',
    taskTableIndex: 'D',
    expected: 'AGC010 - D',
  }),
  createTestCaseForContestNameAndTaskIndex('AGC011, task E')({
    contestId: 'agc011',
    taskTableIndex: 'E',
    expected: 'AGC011 - E',
  }),
  createTestCaseForContestNameAndTaskIndex('AGC066, task F')({
    contestId: 'agc066',
    taskTableIndex: 'F',
    expected: 'AGC066 - F',
  }),
  createTestCaseForContestNameAndTaskIndex('AGC067, task E')({
    contestId: 'agc067',
    taskTableIndex: 'E',
    expected: 'AGC067 - E',
  }),
];
