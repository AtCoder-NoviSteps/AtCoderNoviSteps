import { createTestCase } from '../../common/test_helpers';

export type TestCaseForTaskUrl = {
  contestId: string;
  taskId: string;
  expected: string;
};

const createTestCaseForTaskUrl = createTestCase<TestCaseForTaskUrl>;

export const atCoderTasks = [
  createTestCaseForTaskUrl('ABS, task A')({
    contestId: 'abs',
    taskId: 'practice_1',
    expected: 'https://atcoder.jp/contests/abs/tasks/practice_1',
  }),
  createTestCaseForTaskUrl('ABC365, task A')({
    contestId: 'abc365',
    taskId: 'abc365_a',
    expected: 'https://atcoder.jp/contests/abc365/tasks/abc365_a',
  }),
  createTestCaseForTaskUrl('ABC365, task B')({
    contestId: 'abc365',
    taskId: 'abc365_b',
    expected: 'https://atcoder.jp/contests/abc365/tasks/abc365_b',
  }),
  createTestCaseForTaskUrl('ABC365, task C')({
    contestId: 'abc365',
    taskId: 'abc365_c',
    expected: 'https://atcoder.jp/contests/abc365/tasks/abc365_c',
  }),
  createTestCaseForTaskUrl('ABC365, task D')({
    contestId: 'abc365',
    taskId: 'abc365_d',
    expected: 'https://atcoder.jp/contests/abc365/tasks/abc365_d',
  }),
  createTestCaseForTaskUrl('ABC365, task E')({
    contestId: 'abc365',
    taskId: 'abc365_e',
    expected: 'https://atcoder.jp/contests/abc365/tasks/abc365_e',
  }),
  createTestCaseForTaskUrl('ABC365, task F')({
    contestId: 'abc365',
    taskId: 'abc365_f',
    expected: 'https://atcoder.jp/contests/abc365/tasks/abc365_f',
  }),
  createTestCaseForTaskUrl('ABC365, task G')({
    contestId: 'abc365',
    taskId: 'abc365_g',
    expected: 'https://atcoder.jp/contests/abc365/tasks/abc365_g',
  }),
  createTestCaseForTaskUrl('APG4b, task A')({
    contestId: 'APG4b',
    taskId: 'APG4b_a',
    expected: 'https://atcoder.jp/contests/APG4b/tasks/APG4b_a',
  }),
  createTestCaseForTaskUrl('Typical90, task A')({
    contestId: 'typical90',
    taskId: 'typical90_a',
    expected: 'https://atcoder.jp/contests/typical90/tasks/typical90_a',
  }),
  createTestCaseForTaskUrl('EDPC, task A')({
    contestId: 'dp',
    taskId: 'dp_b',
    expected: 'https://atcoder.jp/contests/dp/tasks/dp_b',
  }),
  createTestCaseForTaskUrl('TDPC, task A')({
    contestId: 'tdpc',
    taskId: 'tdpc_contest',
    expected: 'https://atcoder.jp/contests/tdpc/tasks/tdpc_contest',
  }),
  createTestCaseForTaskUrl('PAST 16th, task A')({
    contestId: 'past16-open',
    taskId: 'past202309_a',
    expected: 'https://atcoder.jp/contests/past16-open/tasks/past202309_a',
  }),
  createTestCaseForTaskUrl('ACL, task A')({
    contestId: 'practice2',
    taskId: 'practice2_a',
    expected: 'https://atcoder.jp/contests/practice2/tasks/practice2_a',
  }),
  createTestCaseForTaskUrl('JOI 2023 qual 1C, task A')({
    contestId: 'joi2023yo1c',
    taskId: 'joi2023_yo1c_a',
    expected: 'https://atcoder.jp/contests/joi2023yo1c/tasks/joi2023_yo1c_a',
  }),
  createTestCaseForTaskUrl('Tessoku book, task A')({
    contestId: 'tessoku-book',
    taskId: 'tessoku_book_a',
    expected: 'https://atcoder.jp/contests/tessoku-book/tasks/tessoku_book_a',
  }),
  createTestCaseForTaskUrl('Math and algorithm, tasks A')({
    contestId: 'math-and-algorithm',
    taskId: 'math_and_algorithm_a',
    expected: 'https://atcoder.jp/contests/math-and-algorithm/tasks/math_and_algorithm_a',
  }),
];
