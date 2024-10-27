import { createTestCase } from '../../common/test_helpers';

export type TestCaseForContestNameAndTaskIndex = {
  contestId: string;
  taskTableIndex: string;
  expected: string;
};

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
