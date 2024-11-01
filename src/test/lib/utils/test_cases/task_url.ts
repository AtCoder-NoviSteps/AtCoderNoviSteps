import { createTestCase } from '../../common/test_helpers';

import { ATCODER_BASE_CONTEST_URL, AOJ_TASKS_URL } from '$lib/constants/urls';

/**
 * Represents a test case for task URL generation.
 * @property {string} contestId - The identifier of the contest (e.g., 'abc365', 'ITP1').
 * @property {string} taskId - The identifier of the specific task within the contest.
 * @property {string} expected - The expected complete URL for the task.
 */
export type TestCaseForTaskUrl = {
  contestId: string;
  taskId: string;
  expected: string;
};

const createTestCaseForTaskUrl = createTestCase<TestCaseForTaskUrl>;

const abc365Tasks = [
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
];

const beginnersTasks = [
  createTestCaseForTaskUrl('ABS, task A')({
    contestId: 'abs',
    taskId: 'practice_1',
    expected: `${ATCODER_BASE_CONTEST_URL}/abs/tasks/practice_1`,
  }),
  createTestCaseForTaskUrl('APG4b, task A')({
    contestId: 'APG4b',
    taskId: 'APG4b_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/APG4b/tasks/APG4b_a`,
  }),
  createTestCaseForTaskUrl('JOI 2023 qual 1C, task A')({
    contestId: 'joi2023yo1c',
    taskId: 'joi2023_yo1c_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/joi2023yo1c/tasks/joi2023_yo1c_a`,
  }),
];

const educationalTasks = [
  createTestCaseForTaskUrl('Typical90, task A')({
    contestId: 'typical90',
    taskId: 'typical90_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/typical90/tasks/typical90_a`,
  }),
  createTestCaseForTaskUrl('EDPC, task A')({
    contestId: 'dp',
    taskId: 'dp_a',
    expected: `${ATCODER_BASE_CONTEST_URL}/dp/tasks/dp_a`,
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

export const atCoderTasks = [...abc365Tasks, ...beginnersTasks, ...educationalTasks];

export const aojCourses = [
  createTestCaseForTaskUrl('AOJ Courses, ITP1 1_A')({
    contestId: 'ITP1',
    taskId: 'ITP1_1_A',
    expected: `${AOJ_TASKS_URL}/ITP1_1_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 1_B')({
    contestId: 'ITP1',
    taskId: 'ITP1_1_B',
    expected: `${AOJ_TASKS_URL}/ITP1_1_B`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 1_D')({
    contestId: 'ITP1',
    taskId: 'ITP1_1_D',
    expected: `${AOJ_TASKS_URL}/ITP1_1_D`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 2_A')({
    contestId: 'ITP1',
    taskId: 'ITP1_2_A',
    expected: `${AOJ_TASKS_URL}/ITP1_2_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 2_D')({
    contestId: 'ITP1',
    taskId: 'ITP1_2_D',
    expected: `${AOJ_TASKS_URL}/ITP1_2_D`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 9_A')({
    contestId: 'ITP1',
    taskId: 'ITP1_9_A',
    expected: `${AOJ_TASKS_URL}/ITP1_9_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 9_D')({
    contestId: 'ITP1',
    taskId: 'ITP1_9_D',
    expected: `${AOJ_TASKS_URL}/ITP1_9_D`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 10_A')({
    contestId: 'ITP1',
    taskId: 'ITP1_10_A',
    expected: `${AOJ_TASKS_URL}/ITP1_10_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 10_D')({
    contestId: 'ITP1',
    taskId: 'ITP1_10_D',
    expected: `${AOJ_TASKS_URL}/ITP1_10_D`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 11_A')({
    contestId: 'ITP1',
    taskId: 'ITP1_11_A',
    expected: `${AOJ_TASKS_URL}/ITP1_11_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP1 11_D')({
    contestId: 'ITP1',
    taskId: 'ITP1_11_D',
    expected: `${AOJ_TASKS_URL}/ITP1_11_D`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ALDS1 1_A')({
    contestId: 'ALDS1',
    taskId: 'ALDS1_1_A',
    expected: `${AOJ_TASKS_URL}/ALDS1_1_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ALDS1 1_B')({
    contestId: 'ALDS1',
    taskId: 'ALDS1_1_B',
    expected: `${AOJ_TASKS_URL}/ALDS1_1_B`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ALDS1 1_D')({
    contestId: 'ALDS1',
    taskId: 'ALDS1_1_D',
    expected: `${AOJ_TASKS_URL}/ALDS1_1_D`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ALDS1 15_A')({
    contestId: 'ALDS1',
    taskId: 'ALDS1_15_A',
    expected: `${AOJ_TASKS_URL}/ALDS1_15_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ALDS1 15_D')({
    contestId: 'ALDS1',
    taskId: 'ALDS1_15_D',
    expected: `${AOJ_TASKS_URL}/ALDS1_15_D`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP2 1_A')({
    contestId: 'ITP2',
    taskId: 'ITP2_1_A',
    expected: `${AOJ_TASKS_URL}/ITP2_1_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP2 1_D')({
    contestId: 'ITP2',
    taskId: 'ITP2_1_D',
    expected: `${AOJ_TASKS_URL}/ITP2_1_D`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP2 11_A')({
    contestId: 'ITP2',
    taskId: 'ITP2_11_A',
    expected: `${AOJ_TASKS_URL}/ITP2_11_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, ITP2 11_D')({
    contestId: 'ITP2',
    taskId: 'ITP2_11_D',
    expected: `${AOJ_TASKS_URL}/ITP2_11_D`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, DPL 1_A')({
    contestId: 'DPL',
    taskId: 'DPL_1_A',
    expected: `${AOJ_TASKS_URL}/DPL_1_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, DPL 1_I')({
    contestId: 'DPL',
    taskId: 'DPL_1_I',
    expected: `${AOJ_TASKS_URL}/DPL_1_I`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, DPL 5_A')({
    contestId: 'DPL',
    taskId: 'DPL_5_A',
    expected: `${AOJ_TASKS_URL}/DPL_5_A`,
  }),
  createTestCaseForTaskUrl('AOJ Courses, DPL 5_L')({
    contestId: 'DPL',
    taskId: 'DPL_5_L',
    expected: `${AOJ_TASKS_URL}/DPL_5_L`,
  }),
];

// PCK contests follow these patterns:
// - Contest ID format: PCK(Prelim|Final)<YEAR>
// - Task ID format:
//   - Recent contests (2023+): 4xxx
//   - Older contests: 0xxx
export const aojPck = [
  createTestCaseForTaskUrl('AOJ, PCK Prelim 2023 - 4012')({
    contestId: 'PCKPrelim2023',
    taskId: '4012',
    expected: `${AOJ_TASKS_URL}/4012`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Prelim 2023 - 4013')({
    contestId: 'PCKPrelim2023',
    taskId: '4013',
    expected: `${AOJ_TASKS_URL}/4013`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Prelim 2023 - 4022')({
    contestId: 'PCKPrelim2023',
    taskId: '4022',
    expected: `${AOJ_TASKS_URL}/4022`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Prelim 2022 - 0479')({
    contestId: 'PCKPrelim2022',
    taskId: '0479',
    expected: `${AOJ_TASKS_URL}/0479`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Prelim 2022 - 0489')({
    contestId: 'PCKPrelim2022',
    taskId: '0489',
    expected: `${AOJ_TASKS_URL}/0489`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Prelim 2005 - 0073')({
    contestId: 'PCKPrelim2005',
    taskId: '0073',
    expected: `${AOJ_TASKS_URL}/0073`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Prelim 2005 - 0092')({
    contestId: 'PCKPrelim2005',
    taskId: '0092',
    expected: `${AOJ_TASKS_URL}/0092`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Prelim 2004 - 0027')({
    contestId: 'PCKPrelim2004',
    taskId: '0027',
    expected: `${AOJ_TASKS_URL}/0027`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Prelim 2004 - 0043')({
    contestId: 'PCKPrelim2004',
    taskId: '0043',
    expected: `${AOJ_TASKS_URL}/0043`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Final 2023 - 4023')({
    contestId: 'PCKFinal2023',
    taskId: '4023',
    expected: `${AOJ_TASKS_URL}/4023`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Final 2023 - 4035')({
    contestId: 'PCKFinal2023',
    taskId: '4035',
    expected: `${AOJ_TASKS_URL}/4035`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Final 2022 - 4000')({
    contestId: 'PCKFinal2022',
    taskId: '4000',
    expected: `${AOJ_TASKS_URL}/4000`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Final 2022 - 4011')({
    contestId: 'PCKFinal2022',
    taskId: '4011',
    expected: `${AOJ_TASKS_URL}/4011`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Final 2004 - 0044')({
    contestId: 'PCKFinal2004',
    taskId: '0044',
    expected: `${AOJ_TASKS_URL}/0044`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Final 2004 - 0097')({
    contestId: 'PCKFinal2004',
    taskId: '0097',
    expected: `${AOJ_TASKS_URL}/0097`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Final 2003 - 0000')({
    contestId: 'PCKFinal2003',
    taskId: '0000',
    expected: `${AOJ_TASKS_URL}/0000`,
  }),
  createTestCaseForTaskUrl('AOJ, PCK Final 2003 - 0098')({
    contestId: 'PCKFinal2003',
    taskId: '0098',
    expected: `${AOJ_TASKS_URL}/0098`,
  }),
];
