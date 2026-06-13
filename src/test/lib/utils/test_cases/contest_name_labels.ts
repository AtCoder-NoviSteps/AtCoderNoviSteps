import { createTestCase } from '../../common/test_helpers';

export type TestCaseForContestNameLabel = {
  contestId: string;
  expected: string;
};

const createTestCaseForContestNameLabel = createTestCase<TestCaseForContestNameLabel>;

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

export const ndpc = [
  createTestCaseForContestNameLabel('NDPC')({
    contestId: 'ndpc',
    expected: 'NDPC',
  }),
];

export const aclPractice = [
  createTestCaseForContestNameLabel('ACL Practice')({
    contestId: 'practice2',
    expected: 'ACL Practice',
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
  createTestCaseForContestNameLabel('AtCoder Typical Contest 001')({
    contestId: 'atc001',
    expected: 'ATC 001',
  }),
  createTestCaseForContestNameLabel('square869120Contest #3')({
    contestId: 's8pc-3',
    expected: 'square869120Contest #3',
  }),
  createTestCaseForContestNameLabel('square869120Contest #4')({
    contestId: 's8pc-4',
    expected: 'square869120Contest #4',
  }),
  createTestCaseForContestNameLabel('第2回 ドワンゴからの挑戦状 予選')({
    contestId: 'dwango2016-prelims',
    expected: '第2回 ドワンゴからの挑戦状 予選',
  }),
];

export const mathAndAlgorithm = [
  createTestCaseForContestNameLabel('Math and Algorithm')({
    contestId: 'math-and-algorithm',
    expected: 'アルゴリズムと数学',
  }),
];

export const awc = [
  createTestCaseForContestNameLabel('AWC 0001')({
    contestId: 'awc0001',
    expected: 'AWC 0001',
  }),
  createTestCaseForContestNameLabel('AWC 0002')({
    contestId: 'awc0002',
    expected: 'AWC 0002',
  }),
  createTestCaseForContestNameLabel('AWC 9999')({
    contestId: 'awc9999',
    expected: 'AWC 9999',
  }),
];

export const fps24 = [
  createTestCaseForContestNameLabel('FPS 24')({
    contestId: 'fps-24',
    expected: 'FPS 24 題',
  }),
];

export const aojJag = [
  createTestCaseForContestNameLabel('AOJ, JAG Summer 2024 day2')({
    contestId: 'JAGSummer2024-day2',
    expected: '（JAG 夏合宿 2024 Day2）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Winter 2009')({
    contestId: 'JAGWinter2009',
    expected: '（JAG 冬合宿 2009）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Spring 2012')({
    contestId: 'JAGSpring2012',
    expected: '（JAG 春合宿 2012）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Summer 2012 day3A')({
    contestId: 'JAGSummer2012-day3A',
    expected: '（JAG 夏合宿 2012 Day3A）',
  }),
];

export const aojIcpc = [
  createTestCaseForContestNameLabel('ICPC Prelim 2024')({
    contestId: 'ICPCPrelim2024',
    expected: '（ICPC 国内予選 2024）',
  }),
  createTestCaseForContestNameLabel('ICPC Regional 2024')({
    contestId: 'ICPCRegional2024',
    expected: '（ICPC 地区予選 2024）',
  }),
  createTestCaseForContestNameLabel('ICPC Prelim 2023')({
    contestId: 'ICPCPrelim2023',
    expected: '（ICPC 国内予選 2023）',
  }),
  createTestCaseForContestNameLabel('ICPC Regional 2023')({
    contestId: 'ICPCRegional2023',
    expected: '（ICPC 地区予選 2023）',
  }),
];

export const aojUniversity = [
  createTestCaseForContestNameLabel('AOJ, RUPC 2018 in ACPC 2018 Day1')({
    contestId: 'AOJ-RUPC2018-in-ACPC2018-day1',
    expected: '（RUPC 2018 in ACPC 2018 Day1）',
  }),
  createTestCaseForContestNameLabel('AOJ, HUPC 2020 in HUPC 2020 Day1')({
    contestId: 'AOJ-HUPC2020-in-HUPC2020-day1',
    expected: '（HUPC 2020 in HUPC 2020 Day1）',
  }),
  createTestCaseForContestNameLabel('AOJ, UAPC 2019 in RUPC 2019 Day2')({
    contestId: 'AOJ-UAPC2019-in-RUPC2019-day2',
    expected: '（ACPC 2019 in RUPC 2019 Day2）',
  }),
  createTestCaseForContestNameLabel('AOJ, UAPC 2003')({
    contestId: 'AOJ-UAPC2003',
    expected: '（ACPC 2003）',
  }),
  createTestCaseForContestNameLabel('AOJ, UAPC 2011 Summer')({
    contestId: 'AOJ-UAPC2011-summer',
    expected: '（ACPC 2011 Summer）',
  }),
  createTestCaseForContestNameLabel('AOJ, UAPC 2012 Day1')({
    contestId: 'AOJ-UAPC2012-day1',
    expected: '（ACPC 2012 Day1）',
  }),
  createTestCaseForContestNameLabel('AOJ, OUPC 2012 in RUPC 2012 Day2')({
    contestId: 'AOJ-OUPC2012-in-RUPC2012-day2',
    expected: '（OUPC 2012 in RUPC 2012 Day2）',
  }),
  createTestCaseForContestNameLabel('AOJ, RUPC 2018 in RUPC 2018 Day1')({
    contestId: 'AOJ-RUPC2018-in-RUPC2018-day1',
    expected: '（RUPC 2018 in RUPC 2018 Day1）',
  }),
  createTestCaseForContestNameLabel('AOJ, HUPC 2014 in RUPC 2014 Day3')({
    contestId: 'AOJ-HUPC2014-in-RUPC2014-day3',
    expected: '（HUPC 2014 in RUPC 2014 Day3）',
  }),
  createTestCaseForContestNameLabel('AOJ, UAPC 2015 in ACPC 2015 Day2')({
    contestId: 'AOJ-UAPC2015-in-ACPC2015-day2',
    expected: '（ACPC 2015 in ACPC 2015 Day2）',
  }),
];
