import { createTestCase, zip } from '../../common/test_helpers';

export type TestCaseForContestNameAndTaskIndex = {
  contestId: string;
  taskTableIndex: string;
  expected: string;
};

const createTestCaseForContestNameAndTaskIndex = createTestCase<TestCaseForContestNameAndTaskIndex>;

const generateAbcTestCases = (
  contestIds: string[],
  taskIndices: string[],
): { name: string; value: TestCaseForContestNameAndTaskIndex }[] => {
  return zip(contestIds, taskIndices).map(([contestId, taskIndex]) => {
    const testCase = createTestCaseForContestNameAndTaskIndex(`ABC${contestId}, task ${taskIndex}`)(
      {
        contestId: `abc${contestId}`,
        taskTableIndex: taskIndex,
        expected: `ABC${contestId} - ${taskIndex}`,
      },
    );

    return testCase;
  });
};

export const abc = generateAbcTestCases(
  ['001', '001', '001', '001', '002', '099', '100', '101', '200', '201', '365', '999'],
  ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A'],
);

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

const generateArcTestCases = (
  contestIds: string[],
  taskIndices: string[],
): { name: string; value: TestCaseForContestNameAndTaskIndex }[] => {
  return zip(contestIds, taskIndices).map(([contestId, taskIndex]) => {
    const testCase = createTestCaseForContestNameAndTaskIndex(`ARC${contestId}, task ${taskIndex}`)(
      {
        contestId: `arc${contestId}`,
        taskTableIndex: taskIndex,
        expected: `ARC${contestId} - ${taskIndex}`,
      },
    );

    return testCase;
  });
};

export const arc = generateArcTestCases(
  ['001', '002', '057', '058', '099', '100', '101', '103', '104', '105', '182', '183'],
  ['A', 'B', 'C', 'D', 'E', 'F', 'C', 'D', 'A', 'B', 'C', 'D'],
);

const generateAgcTestCases = (
  contestIds: string[],
  taskIndices: string[],
): { name: string; value: TestCaseForContestNameAndTaskIndex }[] => {
  return zip(contestIds, taskIndices).map(([contestId, taskIndex]) => {
    const testCase = createTestCaseForContestNameAndTaskIndex(`AGC${contestId}, task ${taskIndex}`)(
      {
        contestId: `agc${contestId}`,
        taskTableIndex: taskIndex,
        expected: `AGC${contestId} - ${taskIndex}`,
      },
    );

    return testCase;
  });
};

export const agc = generateAgcTestCases(
  ['001', '002', '009', '010', '011', '066', '067'],
  ['A', 'B', 'C', 'D', 'E', 'F', 'E'],
);

/**
 * Test cases for AOJ Courses
 * - ITP1: Introduction to Programming I
 * - ALDS1: Algorithms and Data Structures I
 * - ITP2: Introduction to Programming II
 * - DPL: Discrete Optimization Problems
 */
const AOJ_COURSES_TEST_DATA = {
  ITP1: {
    contestId: 'ITP1',
    tasks: ['1_A', '1_B', '1_D', '2_A', '2_D', '9_A', '9_D', '10_A', '10_D', '11_A', '11_D'],
  },
  ALDS1: {
    contestId: 'ALDS1',
    tasks: ['1_A', '1_B', '1_D', '15_A', '15_B'],
  },
  ITP2: {
    contestId: 'ITP2',
    tasks: ['1_A', '1_D', '11_A', '11_D'],
  },
  DPL: {
    contestId: 'DPL',
    tasks: ['1_A', '1_I', '5_A', '5_L'],
  },
};

const generateAojCoursesTestCases = (
  contestIds: string[],
  taskIndices: string[],
): { name: string; value: TestCaseForContestNameAndTaskIndex }[] => {
  return zip(contestIds, taskIndices).map(([contestId, taskIndex]) => {
    const testCase = createTestCaseForContestNameAndTaskIndex(
      `AOJ Courses, ${contestId} ${taskIndex}`,
    )({
      contestId: `${contestId}`,
      taskTableIndex: `${contestId}_${taskIndex}`,
      expected: `AOJ Courses - ${contestId}_${taskIndex}`,
    });

    return testCase;
  });
};

export const aojCourses = Object.entries(AOJ_COURSES_TEST_DATA).flatMap(([contestId, tasks]) =>
  generateAojCoursesTestCases(Array(tasks.tasks.length).fill(contestId), tasks.tasks),
);

/**
 * Test cases for AOJ PCK (パソコン甲子園) contests
 * Includes both preliminary (予選) and final (本選) rounds
 * Format: {round}{year} - {problemId}
 */
const AOJ_PCK_TEST_DATA = {
  Prelim2023: {
    contestId: 'Prelim2023',
    tasks: ['4012', '4013', '4022'],
  },
  Prelim2022: {
    contestId: 'Prelim2022',
    tasks: ['0479', '0489'],
  },
  Prelim2005: {
    contestId: 'Prelim2005',
    tasks: ['0073', '0092'],
  },
  Prelim2004: {
    contestId: 'Prelim2004',
    tasks: ['0027', '0043'],
  },
  Final2023: {
    contestId: 'Final2023',
    tasks: ['4023', '4035'],
  },
  Final2022: {
    contestId: 'Final2022',
    tasks: ['4000', '4011'],
  },
  Final2004: {
    contestId: 'Final2004',
    tasks: ['0044', '0097'],
  },
  Final2003: {
    contestId: 'Final2003',
    tasks: ['0000', '0098'],
  },
};

type PckRound = 'Prelim' | 'Final';
type PckYear = '2003' | '2004' | '2005' | '2022' | '2023';
type PckContestId = `${PckRound}${PckYear}`;
type PckContestIds = PckContestId[];

const generateAojPckTestCases = (
  contestIds: PckContestIds,
  taskIndices: string[],
): { name: string; value: TestCaseForContestNameAndTaskIndex }[] => {
  return zip(contestIds, taskIndices).map(([contestId, taskIndex]) => {
    const testCase = createTestCaseForContestNameAndTaskIndex(
      `AOJ, PCK${contestId} - ${taskIndex}`,
    )({
      contestId: `PCK${contestId}`,
      taskTableIndex: taskIndex,
      expected: `AOJ - パソコン甲子園${contestId.replace('Prelim', '予選').replace('Final', '本選')} - ${taskIndex}`,
    });

    return testCase;
  });
};

export const aojPck = Object.entries(AOJ_PCK_TEST_DATA).flatMap(([contestId, tasks]) =>
  generateAojPckTestCases(Array(tasks.tasks.length).fill(contestId), tasks.tasks),
);
