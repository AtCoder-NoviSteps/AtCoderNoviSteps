import { createTestCase } from '../../common/test_helpers';
import { ContestType } from '$lib/types/contest';

export type TestCaseForContestType = {
  contestId: string;
  expected: ContestType;
};

const createTestCaseForContestType = createTestCase<TestCaseForContestType>;

export const abs = [
  createTestCaseForContestType('ABS')({
    contestId: 'abs',
    expected: ContestType.ABS,
  }),
];

const abcContestIds = [
  'abc001',
  'abc002',
  'abc099',
  'abc100',
  'abc101',
  'abc200',
  'abc201',
  'abc365',
  'abc999',
];

export const abc = abcContestIds.map((contestId) =>
  createTestCaseForContestType(contestId.toUpperCase())({
    contestId,
    expected: ContestType.ABC,
  }),
);

export const apg4b = [
  createTestCaseForContestType('APG4b')({
    contestId: 'APG4b',
    expected: ContestType.APG4B,
  }),
];

export const typical90 = [
  createTestCaseForContestType('Typical90')({
    contestId: 'typical90',
    expected: ContestType.TYPICAL90,
  }),
];

export const edpc = [
  createTestCaseForContestType('EDPC')({
    contestId: 'dp',
    expected: ContestType.EDPC,
  }),
];

export const tdpc = [
  createTestCaseForContestType('TDPC')({
    contestId: 'tdpc',
    expected: ContestType.TDPC,
  }),
];

const pastContestData = [
  { name: 'PAST 1st', contestId: 'past201912-open' },
  { name: 'PAST 2nd', contestId: 'past202004-open' },
  { name: 'PAST 3rd', contestId: 'past202005-open' },
  { name: 'PAST 13th', contestId: 'past202212-open' },
  { name: 'PAST 14th', contestId: 'past202303-open' },
  { name: 'PAST 15th', contestId: 'past15-open' },
  { name: 'PAST 16th', contestId: 'past16-open' },
  { name: 'PAST 17th', contestId: 'past17-open' },
];

export const past = pastContestData.map(({ name, contestId }) =>
  createTestCaseForContestType(name)({
    contestId: contestId,
    expected: ContestType.PAST,
  }),
);

export const aclPractice = [
  createTestCaseForContestType('ACL Practice')({
    contestId: 'practice2',
    expected: ContestType.ACL_PRACTICE,
  }),
];

const joiContestData = [
  // Historical JOI Qualifiers (2006-2007)
  { name: 'JOI 2006 qual', contestId: 'joi2006yo' },
  { name: 'JOI 2007 qual', contestId: 'joi2007yo' },
  { name: 'JOI 2018 qual', contestId: 'joi2018yo' },
  { name: 'JOI 2019 qual', contestId: 'joi2019yo' },
  // Recent JOI Qualifiers (2024-)
  { name: 'JOI 2024 qual 1A', contestId: 'joi2024yo1a' },
  { name: 'JOI 2024 qual 1B', contestId: 'joi2024yo1b' },
  { name: 'JOI 2024 qual 1C', contestId: 'joi2024yo1c' },
  { name: 'JOI 2025 qual 1A', contestId: 'joi2025yo1a' },
  { name: 'JOI 2025 qual 1B', contestId: 'joi2025yo1b' },
  { name: 'JOI 2025 qual 1C', contestId: 'joi2025yo1c' },
  { name: 'JOI 2020 qual 2', contestId: 'joi2020yo2' },
  { name: 'JOI 2023 qual 2', contestId: 'joi2023yo2' },
  { name: 'JOI 2024 qual 2', contestId: 'joi2024yo2' },
  //JOI Finals (2006-)
  { name: 'JOI 2006 final', contestId: 'joi2006ho' },
  { name: 'JOI 2007 final', contestId: 'joi2007ho' },
  { name: 'JOI 2019 final', contestId: 'joi2019ho' },
  { name: 'JOI 2020 final', contestId: 'joi2020ho' },
  { name: 'JOI 2022 final', contestId: 'joi2022ho' },
  { name: 'JOI 2023 final', contestId: 'joi2023ho' },
  { name: 'JOI 2024 final', contestId: 'joi2024ho' },
  // JOI Spring Camp (2007-)
  { name: 'JOI 2007 Spring', contestId: 'joisc2007' },
  { name: 'JOI 2008 Spring', contestId: 'joisc2008' },
  { name: 'JOI 2020 Spring', contestId: 'joisc2020' },
  { name: 'JOI 2022 Spring', contestId: 'joisc2022' },
  { name: 'JOI 2023 Spring', contestId: 'joisp2023' },
  { name: 'JOI 2024 Spring', contestId: 'joisp2024' },
  // JOI Open Contests (2022-)
  { name: 'JOI Open 2022', contestId: 'joiopen2022' },
  { name: 'JOI Open 2023', contestId: 'joiopen2023' },
  { name: 'JOI Open 2024', contestId: 'joiopen2024' },
  // JOIG Contests (2021-)
  { name: 'JOIG 2021 open', contestId: 'joig2021-open' },
  { name: 'JOIG 2022 open', contestId: 'joig2022-open' },
  { name: 'JOIG 2023 open', contestId: 'joig2023-open' },
  { name: 'JOIG 2024 open', contestId: 'joig2024-open' },
  // JOIG Spring Camp (2022-)
  // Note: Contest ID pattern changed from joisc to joisp starting from 2023
  { name: 'JOIG 2022 Spring', contestId: 'joigsc2022' },
  { name: 'JOIG 2023 Spring', contestId: 'joigsp2023' },
  { name: 'JOIG 2024 Spring', contestId: 'joigsp2024' },
];

export const joi = joiContestData.map(({ name, contestId }) =>
  createTestCaseForContestType(name)({
    contestId: contestId,
    expected: ContestType.JOI,
  }),
);

export const tessokuBook = [
  createTestCaseForContestType('Tessoku Book')({
    contestId: 'tessoku-book',
    expected: ContestType.TESSOKU_BOOK,
  }),
];

export const mathAndAlgorithm = [
  createTestCaseForContestType('Math and Algorithm')({
    contestId: 'math-and-algorithm',
    expected: ContestType.MATH_AND_ALGORITHM,
  }),
];

const arcContestIds = [
  'arc001',
  'arc002',
  'arc057',
  'arc058',
  'arc099',
  'arc100',
  'arc101',
  'arc103',
  'arc104',
  'arc105',
  'arc182',
  'arc183',
];

export const arc = arcContestIds.map((contestId) =>
  createTestCaseForContestType(contestId.toUpperCase())({
    contestId,
    expected: ContestType.ARC,
  }),
);

const agcContestIds = ['agc001', 'agc002', 'agc009', 'agc010', 'agc011', 'agc066', 'agc067'];

export const agc = agcContestIds.map((contestId) =>
  createTestCaseForContestType(contestId.toUpperCase())({
    contestId,
    expected: ContestType.AGC,
  }),
);

export const abcLike = [
  createTestCaseForContestType('Panasonic 2020')({
    contestId: 'panasonic2020',
    expected: ContestType.ABC_LIKE,
  }),
];

export const arcLike = [
  createTestCaseForContestType('Tenka1 2018')({
    contestId: 'tenka1-2018',
    expected: ContestType.ARC_LIKE,
  }),
  createTestCaseForContestType('DWACON 5TH PRELIMS')({
    contestId: 'dwacon5th-prelims',
    expected: ContestType.ARC_LIKE,
  }),
  createTestCaseForContestType('DWACON 6TH PRELIMS')({
    contestId: 'dwacon6th-prelims',
    expected: ContestType.ARC_LIKE,
  }),
  createTestCaseForContestType('KEYENCE2019')({
    contestId: 'keyence2019',
    expected: ContestType.ARC_LIKE,
  }),
  createTestCaseForContestType('KEYENCE2020')({
    contestId: 'keyence2020',
    expected: ContestType.ARC_LIKE,
  }),
  createTestCaseForContestType('KEYENCE2021')({
    contestId: 'keyence2021',
    expected: ContestType.ARC_LIKE,
  }),
  createTestCaseForContestType('JSC2019 QUAL')({
    contestId: 'jsc2019-qual',
    expected: ContestType.ARC_LIKE,
  }),
];

export const agcLike = [
  createTestCaseForContestType('CODE FESTIVAL 2016 qual A')({
    contestId: 'code-festival-2016-quala',
    expected: ContestType.AGC_LIKE,
  }),
  createTestCaseForContestType('CODE FESTIVAL 2016 qual B')({
    contestId: 'code-festival-2016-qualb',
    expected: ContestType.AGC_LIKE,
  }),
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

// Note:
// UTPC contests on AtCoder: 2011-2014 and 2020-2023 (not held during 2015-2019)
// TTPC contests on AtCoder: 2015, 2019, 2022-
// TUPC contests on AtCoder: 2022-
//
// See:
// https://kenkoooo.com/atcoder/resources/contests.json
const universityContestIds = [
  'utpc2011',
  'utpc2012',
  'utpc2013',
  'utpc2014',
  'utpc2020',
  'utpc2021',
  'utpc2022',
  'utpc2023',
  'ttpc2015',
  'ttpc2019',
  'ttpc2022',
  'ttpc2023',
  'tupc2022',
  'tupc2023',
];

export const universities = universityContestIds.map((contestId) =>
  createTestCaseForContestType(contestId.toUpperCase())({
    contestId,
    expected: ContestType.UNIVERSITY,
  }),
);

export const atCoderOthers = [
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
  createTestCaseForContestType('MUJIN Programming Challenge 2018')({
    contestId: 'mujin-pc-2018',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType('天下一プログラマーコンテスト2016本戦')({
    contestId: 'tenka1-2016-final',
    expected: ContestType.OTHERS,
  }),
  createTestCaseForContestType(
    'DISCO presents ディスカバリーチャンネル プログラミングコンテスト2016',
  )({
    contestId: 'discovery2016',
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
  ...[1, 2, 3, 4].map((session) =>
    createTestCaseForContestType(`CPSCO2019 Session${session}`)({
      contestId: `cpsco2019-s${session}`,
      expected: ContestType.OTHERS,
    }),
  ),
  createTestCaseForContestType('DEGwer さんの D 論応援コンテスト')({
    contestId: 'DEGwer2023',
    expected: ContestType.OTHERS,
  }),
];

// See:
// getPrefixForAojCourses() in src/lib/utils/contest.ts
const aojCoursesData = [
  { name: 'AOJ Courses, ITP1', contestId: 'ITP1' },
  { name: 'AOJ Courses, ALDS1', contestId: 'ALDS1' },
  { name: 'AOJ Courses, ITP2', contestId: 'ITP2' },
  { name: 'AOJ Courses, DPL', contestId: 'DPL' },
];

export const aojCourses = aojCoursesData.map(({ name, contestId }) =>
  createTestCaseForContestType(name)({
    contestId: contestId,
    expected: ContestType.AOJ_COURSES,
  }),
);

const aojPckContestData = [
  { name: 'AOJ, PCK Prelim 2004', contestId: 'PCKPrelim2004' },
  { name: 'AOJ, PCK Prelim 2005', contestId: 'PCKPrelim2005' },
  { name: 'AOJ, PCK Prelim 2009', contestId: 'PCKPrelim2009' },
  { name: 'AOJ, PCK Prelim 2010', contestId: 'PCKPrelim2010' },
  { name: 'AOJ, PCK Prelim 2011', contestId: 'PCKPrelim2011' },
  { name: 'AOJ, PCK Prelim 2020', contestId: 'PCKPrelim2020' },
  { name: 'AOJ, PCK Prelim 2021', contestId: 'PCKPrelim2021' },
  { name: 'AOJ, PCK Prelim 2022', contestId: 'PCKPrelim2022' },
  { name: 'AOJ, PCK Prelim 2023', contestId: 'PCKPrelim2023' },
  { name: 'AOJ, PCK Final 2003', contestId: 'PCKFinal2003' },
  { name: 'AOJ, PCK Final 2004', contestId: 'PCKFinal2004' },
  { name: 'AOJ, PCK Final 2009', contestId: 'PCKFinal2009' },
  { name: 'AOJ, PCK Final 2010', contestId: 'PCKFinal2010' },
  { name: 'AOJ, PCK Final 2011', contestId: 'PCKFinal2011' },
  { name: 'AOJ, PCK Final 2020', contestId: 'PCKFinal2020' },
  { name: 'AOJ, PCK Final 2021', contestId: 'PCKFinal2021' },
  { name: 'AOJ, PCK Final 2022', contestId: 'PCKFinal2022' },
  { name: 'AOJ, PCK Final 2023', contestId: 'PCKFinal2023' },
];

export const aojPck = aojPckContestData.map(({ name, contestId }) =>
  createTestCaseForContestType(name)({
    contestId: contestId,
    expected: ContestType.AOJ_PCK,
  }),
);

const aojJagContestData = [
  { name: 'AOJ, JAG Prelim 2005', contestId: 'JAGPrelim2005' },
  { name: 'AOJ, JAG Prelim 2006', contestId: 'JAGPrelim2006' },
  { name: 'AOJ, JAG Prelim 2009', contestId: 'JAGPrelim2009' },
  { name: 'AOJ, JAG Prelim 2010', contestId: 'JAGPrelim2010' },
  { name: 'AOJ, JAG Prelim 2011', contestId: 'JAGPrelim2011' },
  { name: 'AOJ, JAG Prelim 2020', contestId: 'JAGPrelim2020' },
  { name: 'AOJ, JAG Prelim 2021', contestId: 'JAGPrelim2021' },
  { name: 'AOJ, JAG Prelim 2022', contestId: 'JAGPrelim2022' },
  { name: 'AOJ, JAG Prelim 2023', contestId: 'JAGPrelim2023' },
  { name: 'AOJ, JAG Prelim 2024', contestId: 'JAGPrelim2024' },
  { name: 'AOJ, JAG Regional 2005', contestId: 'JAGRegional2005' },
  { name: 'AOJ, JAG Regional 2006', contestId: 'JAGRegional2006' },
  { name: 'AOJ, JAG Regional 2009', contestId: 'JAGRegional2009' },
  { name: 'AOJ, JAG Regional 2010', contestId: 'JAGRegional2010' },
  { name: 'AOJ, JAG Regional 2011', contestId: 'JAGRegional2011' },
  { name: 'AOJ, JAG Regional 2016', contestId: 'JAGRegional2016' },
  { name: 'AOJ, JAG Regional 2017', contestId: 'JAGRegional2017' },
  { name: 'AOJ, JAG Regional 2020', contestId: 'JAGRegional2020' },
  { name: 'AOJ, JAG Regional 2021', contestId: 'JAGRegional2021' },
  { name: 'AOJ, JAG Regional 2022', contestId: 'JAGRegional2022' },
];

export const aojJag = aojJagContestData.map(({ name, contestId }) =>
  createTestCaseForContestType(name)({
    contestId: contestId,
    expected: ContestType.AOJ_JAG,
  }),
);
