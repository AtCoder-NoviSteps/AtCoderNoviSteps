import { createTestCase } from '../../common/test_helpers';

export type TestCaseForContestNameLabel = {
  contestId: string;
  expected: string;
};

const createTestCaseForContestNameLabel = createTestCase<TestCaseForContestNameLabel>;

const generateAbcTestCases = (
  contestIds: string[],
): { name: string; value: TestCaseForContestNameLabel }[] => {
  return contestIds.map((contestId) => {
    const testCase = createTestCaseForContestNameLabel(`ABC ${contestId}`)({
      contestId: `abc${contestId}`,
      expected: `ABC ${contestId}`,
    });

    return testCase;
  });
};

export const abc = generateAbcTestCases([
  '001',
  '002',
  '099',
  '100',
  '101',
  '200',
  '201',
  '380',
  '999',
]);

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
  createTestCaseForContestNameLabel('ARC 001')({
    contestId: 'arc001',
    expected: 'ARC 001',
  }),
  createTestCaseForContestNameLabel('ARC 002')({
    contestId: 'arc002',
    expected: 'ARC 002',
  }),
  createTestCaseForContestNameLabel('ARC 057')({
    contestId: 'arc057',
    expected: 'ARC 057',
  }),
  createTestCaseForContestNameLabel('ARC 058')({
    contestId: 'arc058',
    expected: 'ARC 058',
  }),
  createTestCaseForContestNameLabel('ARC 099')({
    contestId: 'arc099',
    expected: 'ARC 099',
  }),
  createTestCaseForContestNameLabel('ARC 100')({
    contestId: 'arc100',
    expected: 'ARC 100',
  }),
  createTestCaseForContestNameLabel('ARC 101')({
    contestId: 'arc101',
    expected: 'ARC 101',
  }),
  createTestCaseForContestNameLabel('ARC 103')({
    contestId: 'arc103',
    expected: 'ARC 103',
  }),
  createTestCaseForContestNameLabel('ARC 104')({
    contestId: 'arc104',
    expected: 'ARC 104',
  }),
  createTestCaseForContestNameLabel('ARC 105')({
    contestId: 'arc105',
    expected: 'ARC 105',
  }),
  createTestCaseForContestNameLabel('ARC 187')({
    contestId: 'arc187',
    expected: 'ARC 187',
  }),
  createTestCaseForContestNameLabel('ARC 188')({
    contestId: 'arc188',
    expected: 'ARC 188',
  }),
];

export const agc = [
  createTestCaseForContestNameLabel('AGC 001')({
    contestId: 'agc001',
    expected: 'AGC 001',
  }),
  createTestCaseForContestNameLabel('AGC 002')({
    contestId: 'agc002',
    expected: 'AGC 002',
  }),
  createTestCaseForContestNameLabel('AGC 009')({
    contestId: 'agc009',
    expected: 'AGC 009',
  }),
  createTestCaseForContestNameLabel('AGC 010')({
    contestId: 'agc010',
    expected: 'AGC 010',
  }),
  createTestCaseForContestNameLabel('AGC 011')({
    contestId: 'agc011',
    expected: 'AGC 011',
  }),
  createTestCaseForContestNameLabel('AGC 066')({
    contestId: 'agc066',
    expected: 'AGC 066',
  }),
  createTestCaseForContestNameLabel('AGC 067')({
    contestId: 'agc067',
    expected: 'AGC 067',
  }),
];

const generateUtpcTestCases = (
  years: number[],
): { name: string; value: TestCaseForContestNameLabel }[] => {
  return years.map((year) => {
    const testCase = createTestCaseForContestNameLabel(`UTPC ${year}`)({
      contestId: `utpc${year}`,
      expected: `UTPC ${year}`,
    });

    return testCase;
  });
};
const generateTtpcTestCases = (
  years: number[],
): { name: string; value: TestCaseForContestNameLabel }[] => {
  return years.map((year) => {
    const testCase = createTestCaseForContestNameLabel(`TTPC ${year}`)({
      contestId: `ttpc${year}`,
      expected: `TTPC ${year}`,
    });

    return testCase;
  });
};
const generateTupcTestCases = (
  years: number[],
): { name: string; value: TestCaseForContestNameLabel }[] => {
  return years.map((year) => {
    const testCase = createTestCaseForContestNameLabel(`TUPC ${year}`)({
      contestId: `tupc${year}`,
      expected: `TUPC ${year}`,
    });

    return testCase;
  });
};

// Note:
// UTPC contests on AtCoder: 2011-2014 and 2020-2023 (not held during 2015-2019)
// TTPC contests on AtCoder: 2015, 2019, 2022-
// TUPC contests on AtCoder: 2022-
//
// See:
// https://kenkoooo.com/atcoder/resources/contests.json
export const universities = [
  ...generateUtpcTestCases([2011, 2012, 2013, 2014, 2020, 2021, 2022, 2023]),
  ...generateTtpcTestCases([2015, 2019, 2022, 2023]),
  ...generateTupcTestCases([2022, 2023]),
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
    expected: 'AOJ - （パソコン甲子園 予選 2023）',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Prelim 2022')({
    contestId: 'PCKPrelim2022',
    expected: 'AOJ - （パソコン甲子園 予選 2022）',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Prelim 2005')({
    contestId: 'PCKPrelim2005',
    expected: 'AOJ - （パソコン甲子園 予選 2005）',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Prelim 2004')({
    contestId: 'PCKPrelim2004',
    expected: 'AOJ - （パソコン甲子園 予選 2004）',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2023')({
    contestId: 'PCKFinal2023',
    expected: 'AOJ - （パソコン甲子園 本選 2023）',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2022')({
    contestId: 'PCKFinal2022',
    expected: 'AOJ - （パソコン甲子園 本選 2022）',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2021')({
    contestId: 'PCKFinal2021',
    expected: 'AOJ - （パソコン甲子園 本選 2021）',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2004')({
    contestId: 'PCKFinal2004',
    expected: 'AOJ - （パソコン甲子園 本選 2004）',
  }),
  createTestCaseForContestNameLabel('AOJ, PCK Final 2003')({
    contestId: 'PCKFinal2003',
    expected: 'AOJ - （パソコン甲子園 本選 2003）',
  }),
];

export const aojJag = [
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2005')({
    contestId: 'JAGPrelim2005',
    expected: 'AOJ - （JAG 模擬国内 2005）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2006')({
    contestId: 'JAGPrelim2006',
    expected: 'AOJ - （JAG 模擬国内 2006）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2009')({
    contestId: 'JAGPrelim2009',
    expected: 'AOJ - （JAG 模擬国内 2009）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2010')({
    contestId: 'JAGPrelim2010',
    expected: 'AOJ - （JAG 模擬国内 2010）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2011')({
    contestId: 'JAGPrelim2011',
    expected: 'AOJ - （JAG 模擬国内 2011）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2020')({
    contestId: 'JAGPrelim2020',
    expected: 'AOJ - （JAG 模擬国内 2020）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2021')({
    contestId: 'JAGPrelim2021',
    expected: 'AOJ - （JAG 模擬国内 2021）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2022')({
    contestId: 'JAGPrelim2022',
    expected: 'AOJ - （JAG 模擬国内 2022）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2023')({
    contestId: 'JAGPrelim2023',
    expected: 'AOJ - （JAG 模擬国内 2023）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Prelim 2024')({
    contestId: 'JAGPrelim2024',
    expected: 'AOJ - （JAG 模擬国内 2024）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2005')({
    contestId: 'JAGRegional2005',
    expected: 'AOJ - （JAG 模擬地区 2005）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2006')({
    contestId: 'JAGRegional2006',
    expected: 'AOJ - （JAG 模擬地区 2006）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2009')({
    contestId: 'JAGRegional2009',
    expected: 'AOJ - （JAG 模擬地区 2009）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2010')({
    contestId: 'JAGRegional2010',
    expected: 'AOJ - （JAG 模擬地区 2010）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2011')({
    contestId: 'JAGRegional2011',
    expected: 'AOJ - （JAG 模擬地区 2011）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2016')({
    contestId: 'JAGRegional2016',
    expected: 'AOJ - （JAG 模擬地区 2016）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2017')({
    contestId: 'JAGRegional2017',
    expected: 'AOJ - （JAG 模擬地区 2017）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2020')({
    contestId: 'JAGRegional2020',
    expected: 'AOJ - （JAG 模擬地区 2020）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2021')({
    contestId: 'JAGRegional2021',
    expected: 'AOJ - （JAG 模擬地区 2021）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Regional 2022')({
    contestId: 'JAGRegional2022',
    expected: 'AOJ - （JAG 模擬地区 2022）',
  }),
];
