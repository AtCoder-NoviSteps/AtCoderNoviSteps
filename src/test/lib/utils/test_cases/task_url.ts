import { createTestCase } from '../../common/test_helpers';

import { ATCODER_BASE_CONTEST_URL, AOJ_TASKS_URL } from '$lib/constants/urls';

/** Represents a test case for task URL generation.
 *
 * @typedef {Object} TestCaseForTaskUrl
 * @property {string} contestId - Identifier of the contest (e.g., 'abc365', 'ITP1').
 * @property {string} taskId - Identifier of the specific task within the contest.
 * @property {string} expected - Expected complete URL for the task.
 */
export type TestCaseForTaskUrl = {
  contestId: string;
  taskId: string;
  expected: string;
};

const createTestCaseForTaskUrl = createTestCase<TestCaseForTaskUrl>;

const abc365Tasks = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((suffixTaskId) => {
  return createTestCaseForTaskUrl(`ABC365, task ${suffixTaskId.toUpperCase()}`)({
    contestId: 'abc365',
    taskId: `abc365_${suffixTaskId}`,
    expected: `${ATCODER_BASE_CONTEST_URL}/abc365/tasks/abc365_${suffixTaskId}`,
  });
});

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

const courses = [
  {
    contestId: 'ITP1',
    tasks: ['1_A', '1_B', '1_D', '2_A', '2_D', '9_A', '9_D', '10_A', '10_D', '11_A', '11_D'],
  },
  {
    contestId: 'ALDS1',
    tasks: ['1_A', '1_B', '1_D', '15_A', '15_D'],
  },
  {
    contestId: 'ITP2',
    tasks: ['1_A', '1_D', '11_A', '11_D'],
  },
  {
    contestId: 'DPL',
    tasks: ['1_A', '1_I', '5_A', '5_L'],
  },
];

export const aojCourses = courses.flatMap((course) =>
  course.tasks.map((task) => {
    return createTestCaseForTaskUrl(`AOJ Courses, ${course.contestId} ${task}`)({
      contestId: course.contestId,
      taskId: `${course.contestId}_${task}`,
      expected: `${AOJ_TASKS_URL}/${course.contestId}_${task}`,
    });
  }),
);

// PCK contests follow these patterns:
// - Contest ID format: PCK(Prelim|Final)<YEAR>
// - Task ID format:
//   - Recent contests (2023+): 4xxx
//   - Older contests: 0xxx
const pckContests = [
  { contestId: 'PCKPrelim2023', tasks: ['4012', '4013', '4022'] },
  { contestId: 'PCKPrelim2022', tasks: ['0479', '0489'] },
  { contestId: 'PCKPrelim2005', tasks: ['0073', '0092'] },
  { contestId: 'PCKPrelim2004', tasks: ['0027', '0043'] },
  { contestId: 'PCKFinal2023', tasks: ['4023', '4035'] },
  { contestId: 'PCKFinal2022', tasks: ['4000', '4011'] },
  { contestId: 'PCKFinal2004', tasks: ['0044', '0097'] },
  { contestId: 'PCKFinal2003', tasks: ['0000', '0098'] },
];

export const aojPck = pckContests.flatMap((pck) =>
  pck.tasks.map((task) => {
    return createTestCaseForTaskUrl(`AOJ PCK, ${pck.contestId} ${task}`)({
      contestId: pck.contestId,
      taskId: task,
      expected: `${AOJ_TASKS_URL}/${task}`,
    });
  }),
);

// JAG contests follow these patterns:
// - Contest ID format: JAG(Prelim|Regional)<YEAR>
const jagContests = [
  { contestId: 'JAGPrelim2005', tasks: ['2006', '2007', '2011'] },
  { contestId: 'JAGPrelim2006', tasks: ['2000', '2001', '2005'] },
  { contestId: 'JAGPrelim2023', tasks: ['3358', '3359', '3365'] },
  { contestId: 'JAGPrelim2024', tasks: ['3386', '3387', '3394'] },
  { contestId: 'JAGRegional2005', tasks: ['2024', '2025', '2029'] },
  { contestId: 'JAGRegional2006', tasks: ['2030', '2031', '2038'] },
  { contestId: 'JAGRegional2021', tasks: ['3300', '3301', '3310'] },
  { contestId: 'JAGRegional2022', tasks: ['3346', '3347', '3357'] },
];

export const aojJag = jagContests.flatMap((jag) =>
  jag.tasks.map((task) => {
    return createTestCaseForTaskUrl(`AOJ JAG, ${jag.contestId} ${task}`)({
      contestId: jag.contestId,
      taskId: task,
      expected: `${AOJ_TASKS_URL}/${task}`,
    });
  }),
);
