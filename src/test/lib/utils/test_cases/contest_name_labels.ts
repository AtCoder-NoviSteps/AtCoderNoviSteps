import { createTestCase } from '../../common/test_helpers';

export type TestCaseForContestNameLabel = {
  contestId: string;
  expected: string;
};

const createTestCaseForContestNameLabel = createTestCase<TestCaseForContestNameLabel>;

export const abc = [
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

export const apg4b = [
  createTestCaseForContestNameLabel('APG4b')({
    contestId: 'APG4b',
    expected: 'APG4b',
  }),
  createTestCaseForContestNameLabel('APG4b Python')({
    contestId: 'APG4bPython',
    expected: 'APG4bPython',
  }),
];

export const typical90 = [
  createTestCaseForContestNameLabel('Typical90')({
    contestId: 'typical90',
    expected: '競プロ典型 90 問',
  }),
];

export const edpc = [
  createTestCaseForContestNameLabel('DP')({
    contestId: 'dp',
    expected: 'EDPC',
  }),
];

export const tdpc = [
  createTestCaseForContestNameLabel('TDPC')({
    contestId: 'tdpc',
    expected: 'TDPC',
  }),
];

// Note: Not yet implemented, because notational distortion needs to be corrected for each contest.
export const past = [
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
  createTestCaseForContestNameLabel('PAST 13th')({
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

export const aclPractice = [
  createTestCaseForContestNameLabel('ACL Practice')({
    contestId: 'practice2',
    expected: 'ACL Practice',
  }),
];

// Note: Not yet implemented, because notational distortion needs to be corrected for each contest.
export const joi = [
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

export const tessokuBook = [
  createTestCaseForContestNameLabel('Tessoku Book')({
    contestId: 'tessoku-book',
    expected: '競技プログラミングの鉄則',
  }),
];

export const mathAndAlgorithm = [
  createTestCaseForContestNameLabel('Math and Algorithm')({
    contestId: 'math-and-algorithm',
    expected: 'アルゴリズムと数学',
  }),
];

export const arc = [
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

export const agc = [
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

export const atCoderOthers = [
  createTestCaseForContestNameLabel('Chokudai SpeedRun 001')({
    contestId: 'chokudai_S001',
    expected: 'Chokudai SpeedRun 001',
  }),
  createTestCaseForContestNameLabel('Chokudai SpeedRun 002')({
    contestId: 'chokudai_S002',
    expected: 'Chokudai SpeedRun 002',
  }),
];

export const aojCourses = [
  createTestCaseForContestNameLabel('AOJ Courses, ITP1')({
    contestId: 'ITP1',
    expected: 'AOJ Courses',
  }),
  createTestCaseForContestNameLabel('AOJ Courses, ALDS1')({
    contestId: 'ALDS1',
    expected: 'AOJ Courses',
  }),
  createTestCaseForContestNameLabel('AOJ Courses, ITP2')({
    contestId: 'ITP2',
    expected: 'AOJ Courses',
  }),
  createTestCaseForContestNameLabel('AOJ Courses, DPL')({
    contestId: 'DPL',
    expected: 'AOJ Courses',
  }),
];

export const aojPck = [
  createTestCaseForContestNameLabel('AOJ, PCK Prelim 2023')({
    contestId: 'PCKPrelim2023',
    expected: 'AOJ - パソコン甲子園予選2023',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Prelim 2022')({
    contestId: 'PCKPrelim2022',
    expected: 'AOJ - パソコン甲子園予選2022',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Prelim 2005')({
    contestId: 'PCKPrelim2005',
    expected: 'AOJ - パソコン甲子園予選2005',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Prelim 2004')({
    contestId: 'PCKPrelim2004',
    expected: 'AOJ - パソコン甲子園予選2004',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2023')({
    contestId: 'PCKFinal2023',
    expected: 'AOJ - パソコン甲子園本選2023',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2022')({
    contestId: 'PCKFinal2022',
    expected: 'AOJ - パソコン甲子園本選2022',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2021')({
    contestId: 'PCKFinal2021',
    expected: 'AOJ - パソコン甲子園本選2021',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2004')({
    contestId: 'PCKFinal2004',
    expected: 'AOJ - パソコン甲子園本選2004',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2003')({
    contestId: 'PCKFinal2003',
    expected: 'AOJ - パソコン甲子園本選2003',
  }),
];
