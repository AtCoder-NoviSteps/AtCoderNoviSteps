import { createTestCase } from '../../common/test_helpers';

export type TestCaseForContestNameAndTaskIndex = {
  contestId: string;
  taskTableIndex: string;
  expected: string;
};

const createTestCaseForContestNameAndTaskIndex = createTestCase<TestCaseForContestNameAndTaskIndex>;

export const abc = [
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

export const apg4b = [
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

export const typical90 = [
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

export const tessokuBook = [
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

export const mathAndAlgorithm = [
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

export const arc = [
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

export const agc = [
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

export const aojCourses = [
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 1_A')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_1_A',
    expected: 'AOJ Courses - ITP1_1_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 1_B')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_1_B',
    expected: 'AOJ Courses - ITP1_1_B',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 1_D')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_1_D',
    expected: 'AOJ Courses - ITP1_1_D',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 2_A')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_2_A',
    expected: 'AOJ Courses - ITP1_2_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 2_D')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_2_D',
    expected: 'AOJ Courses - ITP1_2_D',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 9_A')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_9_A',
    expected: 'AOJ Courses - ITP1_9_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 9_D')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_9_D',
    expected: 'AOJ Courses - ITP1_9_D',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 10_A')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_10_A',
    expected: 'AOJ Courses - ITP1_10_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 10_D')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_10_D',
    expected: 'AOJ Courses - ITP1_10_D',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 11_A')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_11_A',
    expected: 'AOJ Courses - ITP1_11_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP1 11_D')({
    contestId: 'ITP1',
    taskTableIndex: 'ITP1_11_D',
    expected: 'AOJ Courses - ITP1_11_D',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ALDS1 1_A')({
    contestId: 'ALDS1',
    taskTableIndex: 'ALDS1_1_A',
    expected: 'AOJ Courses - ALDS1_1_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ALDS1 1_B')({
    contestId: 'ALDS1',
    taskTableIndex: 'ALDS1_1_B',
    expected: 'AOJ Courses - ALDS1_1_B',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ALDS1 1_D')({
    contestId: 'ALDS1',
    taskTableIndex: 'ALDS1_1_D',
    expected: 'AOJ Courses - ALDS1_1_D',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ALDS1 15_A')({
    contestId: 'ALDS1',
    taskTableIndex: 'ALDS1_15_A',
    expected: 'AOJ Courses - ALDS1_15_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ALDS1 15_D')({
    contestId: 'ALDS1',
    taskTableIndex: 'ALDS1_15_D',
    expected: 'AOJ Courses - ALDS1_15_D',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP2 1_A')({
    contestId: 'ITP2',
    taskTableIndex: 'ITP2_1_A',
    expected: 'AOJ Courses - ITP2_1_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP2 1_D')({
    contestId: 'ITP2',
    taskTableIndex: 'ITP2_1_D',
    expected: 'AOJ Courses - ITP2_1_D',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP2 11_A')({
    contestId: 'ITP2',
    taskTableIndex: 'ITP2_11_A',
    expected: 'AOJ Courses - ITP2_11_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, ITP2 11_D')({
    contestId: 'ITP2',
    taskTableIndex: 'ITP2_11_D',
    expected: 'AOJ Courses - ITP2_11_D',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, DPL 1_A')({
    contestId: 'DPL',
    taskTableIndex: 'DPL_1_A',
    expected: 'AOJ Courses - DPL_1_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, DPL 1_I')({
    contestId: 'DPL',
    taskTableIndex: 'DPL_1_I',
    expected: 'AOJ Courses - DPL_1_I',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, DPL 5_A')({
    contestId: 'DPL',
    taskTableIndex: 'DPL_5_A',
    expected: 'AOJ Courses - DPL_5_A',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ Courses, DPL 5_L')({
    contestId: 'DPL',
    taskTableIndex: 'DPL_5_L',
    expected: 'AOJ Courses - DPL_5_L',
  }),
];

export const aojPck = [
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Prelim 2023 - 4012')({
    contestId: 'PCKPrelim2023',
    taskTableIndex: '4012',
    expected: 'AOJ - パソコン甲子園予選2023 - 4012',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Prelim 2023 - 4013')({
    contestId: 'PCKPrelim2023',
    taskTableIndex: '4013',
    expected: 'AOJ - パソコン甲子園予選2023 - 4013',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Prelim 2023 - 4022')({
    contestId: 'PCKPrelim2023',
    taskTableIndex: '4022',
    expected: 'AOJ - パソコン甲子園予選2023 - 4022',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Prelim 2022 - 0479')({
    contestId: 'PCKPrelim2022',
    taskTableIndex: '0479',
    expected: 'AOJ - パソコン甲子園予選2022 - 0479',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Prelim 2022 - 0489')({
    contestId: 'PCKPrelim2022',
    taskTableIndex: '0489',
    expected: 'AOJ - パソコン甲子園予選2022 - 0489',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Prelim 2005 - 0073')({
    contestId: 'PCKPrelim2005',
    taskTableIndex: '0073',
    expected: 'AOJ - パソコン甲子園予選2005 - 0073',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Prelim 2005 - 0092')({
    contestId: 'PCKPrelim2005',
    taskTableIndex: '0092',
    expected: 'AOJ - パソコン甲子園予選2005 - 0092',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Prelim 2004 - 0027')({
    contestId: 'PCKPrelim2004',
    taskTableIndex: '0027',
    expected: 'AOJ - パソコン甲子園予選2004 - 0027',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Prelim 2004 - 0043')({
    contestId: 'PCKPrelim2004',
    taskTableIndex: '0043',
    expected: 'AOJ - パソコン甲子園予選2004 - 0043',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Final 2023 - 4023')({
    contestId: 'PCKFinal2023',
    taskTableIndex: '4023',
    expected: 'AOJ - パソコン甲子園本選2023 - 4023',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Final 2023 - 4035')({
    contestId: 'PCKFinal2023',
    taskTableIndex: '4035',
    expected: 'AOJ - パソコン甲子園本選2023 - 4035',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Final 2022 - 4000')({
    contestId: 'PCKFinal2022',
    taskTableIndex: '4000',
    expected: 'AOJ - パソコン甲子園本選2022 - 4000',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Final 2022 - 4011')({
    contestId: 'PCKFinal2022',
    taskTableIndex: '4011',
    expected: 'AOJ - パソコン甲子園本選2022 - 4011',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Final 2004 - 0044')({
    contestId: 'PCKFinal2004',
    taskTableIndex: '0044',
    expected: 'AOJ - パソコン甲子園本選2004 - 0044',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Final 2004 - 0097')({
    contestId: 'PCKFinal2004',
    taskTableIndex: '0097',
    expected: 'AOJ - パソコン甲子園本選2004 - 0097',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Final 2003 - 0000')({
    contestId: 'PCKFinal2003',
    taskTableIndex: '0000',
    expected: 'AOJ - パソコン甲子園本選2003 - 0000',
  }),
  createTestCaseForContestNameAndTaskIndex('AOJ, PCK Final 2003 - 0098')({
    contestId: 'PCKFinal2003',
    taskTableIndex: '0098',
    expected: 'AOJ - パソコン甲子園本選2003 - 0098',
  }),
];
