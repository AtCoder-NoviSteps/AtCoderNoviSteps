import { createTestCase } from '../../common/test_helpers';

import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';

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
    expected: `${ATCODER_BASE_CONTEST_URL}/abs/tasks/practice_1`,
  }),
  createTestCaseForTaskUrl('ABC365, task A')({
    contestId: 'abc365',
    taskId: 'abc365_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/abc365/tasks/abc365_a`,
  }),
  createTestCaseForTaskUrl('ABC365, task B')({
    contestId: 'abc365',
    taskId: 'abc365_b',
    expected: `${ATCODER_BASE_CONTEST_URL}/abc365/tasks/abc365_b`,
  }),
  createTestCaseForTaskUrl('ABC365, task C')({
    contestId: 'abc365',
    taskId: 'abc365_c',
    expected: `${ATCODER_BASE_CONTEST_URL}/abc365/tasks/abc365_c`,
  }),
  createTestCaseForTaskUrl('ABC365, task D')({
    contestId: 'abc365',
    taskId: 'abc365_d',
    expected: `${ATCODER_BASE_CONTEST_URL}/abc365/tasks/abc365_d`,
  }),
  createTestCaseForTaskUrl('ABC365, task E')({
    contestId: 'abc365',
    taskId: 'abc365_e',
    expected: `${ATCODER_BASE_CONTEST_URL}/abc365/tasks/abc365_e`,
  }),
  createTestCaseForTaskUrl('ABC365, task F')({
    contestId: 'abc365',
    taskId: 'abc365_f',
    expected: `${ATCODER_BASE_CONTEST_URL}/abc365/tasks/abc365_f`,
  }),
  createTestCaseForTaskUrl('ABC365, task G')({
    contestId: 'abc365',
    taskId: 'abc365_g',
    expected: `${ATCODER_BASE_CONTEST_URL}/abc365/tasks/abc365_g`,
  }),
  createTestCaseForTaskUrl('APG4b, task A')({
    contestId: 'APG4b',
    taskId: 'APG4b_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/APG4b/tasks/APG4b_a`,
  }),
  createTestCaseForTaskUrl('Typical90, task A')({
    contestId: 'typical90',
    taskId: 'typical90_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/typical90/tasks/typical90_a`,
  }),
  createTestCaseForTaskUrl('EDPC, task A')({
    contestId: 'dp',
    taskId: 'dp_b',
    expected: `${ATCODER_BASE_CONTEST_URL}/dp/tasks/dp_b`,
  }),
  createTestCaseForTaskUrl('TDPC, task A')({
    contestId: 'tdpc',
    taskId: 'tdpc_contest',
    expected: `${ATCODER_BASE_CONTEST_URL}/tdpc/tasks/tdpc_contest`,
  }),
  createTestCaseForTaskUrl('PAST 16th, task A')({
    contestId: 'past16-open',
    taskId: 'past202309_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/past16-open/tasks/past202309_a`,
  }),
  createTestCaseForTaskUrl('ACL, task A')({
    contestId: 'practice2',
    taskId: 'practice2_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/practice2/tasks/practice2_a`,
  }),
  createTestCaseForTaskUrl('JOI 2023 qual 1C, task A')({
    contestId: 'joi2023yo1c',
    taskId: 'joi2023_yo1c_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/joi2023yo1c/tasks/joi2023_yo1c_a`,
  }),
  createTestCaseForTaskUrl('Tessoku book, task A')({
    contestId: 'tessoku-book',
    taskId: 'tessoku_book_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/tessoku-book/tasks/tessoku_book_a`,
  }),
  createTestCaseForTaskUrl('Math and algorithm, tasks A')({
    contestId: 'math-and-algorithm',
    taskId: 'math_and_algorithm_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/math-and-algorithm/tasks/math_and_algorithm_a`,
  }),
];
