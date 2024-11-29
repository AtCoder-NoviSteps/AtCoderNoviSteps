import { createTestCase, zip } from '../../common/test_helpers';
import {
  getPastContestLabel,
  getJoiContestLabel,
  getAtCoderUniversityContestLabel,
  getAojContestLabel,
  PAST_TRANSLATIONS,
  AOJ_COURSES,
} from '$lib/utils/contest';

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
    const testCase = createTestCaseForContestNameAndTaskIndex(
      `ABC ${contestId}, task ${taskIndex}`,
    )({
      contestId: `abc${contestId}`,
      taskTableIndex: taskIndex,
      expected: `ABC ${contestId} - ${taskIndex}`,
    });

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

const generatePastTestCases = (
  contestIds: string[],
  taskIndices: string[],
): { name: string; value: TestCaseForContestNameAndTaskIndex }[] => {
  return zip(contestIds, taskIndices).map(([contestId, taskIndex]) => {
    const testCase = createTestCaseForContestNameAndTaskIndex(`PAST, ${contestId} ${taskIndex}`)({
      contestId: `${contestId}`,
      taskTableIndex: `${taskIndex}`,
      expected: `${getPastContestLabel(PAST_TRANSLATIONS, contestId)} - ${taskIndex}`,
    });

    return testCase;
  });
};

const PAST_TEST_DATA = {
  // 1st
  'past201912-open': {
    contestId: 'past201912-open',
    tasks: ['A', 'B', 'C', 'M', 'N', 'O'],
  },
  // 2nd
  'past202004-open': {
    contestId: 'past202004-open',
    tasks: ['A', 'B', 'C', 'M', 'N', 'O'],
  },
  // 3rd
  'past202005-open': {
    contestId: 'past202005-open',
    tasks: ['A', 'B', 'C', 'M', 'N', 'O'],
  },
  // 9th
  'past202112-open': {
    contestId: 'past202112-open',
    tasks: ['A', 'B', 'C', 'M', 'N', 'O'],
  },
  // 10th
  'past202203-open': {
    contestId: 'past202203-open',
    tasks: ['A', 'B', 'C', 'M', 'N', 'O'],
  },
  // 14th
  'past202303-open': {
    contestId: 'past202303-open',
    tasks: ['A', 'B', 'C', 'M', 'N', 'O'],
  },
  'past15-open': {
    contestId: 'past15-open',
    tasks: ['A', 'B', 'C', 'M', 'N', 'O'],
  },
  'past16-open': {
    contestId: 'past16-open',
    tasks: ['A', 'B', 'C', 'M', 'N', 'O'],
  },
  'past17-open': {
    contestId: 'past17-open',
    tasks: ['A', 'B', 'C', 'M', 'N', 'O'],
  },
};

export const past = Object.entries(PAST_TEST_DATA).flatMap(([contestId, tasks]) =>
  generatePastTestCases(Array(tasks.tasks.length).fill(contestId), tasks.tasks),
);

const generateJoiTestCases = (
  contestIds: string[],
  taskIndices: string[],
): { name: string; value: TestCaseForContestNameAndTaskIndex }[] => {
  return zip(contestIds, taskIndices).map(([contestId, taskIndex]) => {
    const testCase = createTestCaseForContestNameAndTaskIndex(`JOI, ${contestId} ${taskIndex}`)({
      contestId: `${contestId}`,
      taskTableIndex: `${taskIndex}`,
      expected: `${getJoiContestLabel(contestId)} - ${taskIndex}`,
    });

    return testCase;
  });
};

const JOI_TEST_DATA = {
  joi2006yo: {
    contestId: 'joi2006yo',
    tasks: ['A', 'B', 'C', 'D', 'E'],
  },
  joi2007yo: {
    contestId: 'joi2007yo',
    tasks: ['A', 'B', 'E', 'F'],
  },
  joi2018yo: {
    contestId: 'joi2018yo',
    tasks: ['A', 'B', 'F'],
  },
  joi2024yo1c: {
    contestId: 'joi2024yo1c',
    tasks: ['A', 'B', 'C', 'D'],
  },
  joi2025yo1a: {
    contestId: 'joi2025yo1a',
    tasks: ['A', 'B', 'D'],
  },
  joi2025yo1b: {
    contestId: 'joi2025yo1b',
    tasks: ['A', 'B', 'D'],
  },
  joi2023yo2: {
    contestId: 'joi2023yo2',
    tasks: ['A', 'B', 'C', 'D', 'E'],
  },
  joi2024yo2: {
    contestId: 'joi2024yo2',
    tasks: ['A', 'B', 'E'],
  },
  joi2006ho: {
    contestId: 'joi2006ho',
    tasks: ['A', 'B', 'C', 'D', 'E'],
  },
  joi2007ho: {
    contestId: 'joi2007ho',
    tasks: ['A', 'B', 'E'],
  },
  joi2023ho: {
    contestId: 'joi2023ho',
    tasks: ['A', 'B', 'E'],
  },
  joi2024ho: {
    contestId: 'joi2024ho',
    tasks: ['A', 'B', 'E'],
  },
  joisc2007: {
    contestId: 'joisc2007',
    tasks: ['anagra', 'buildi', 'salt', 'score'],
  },
  joisc2008: {
    contestId: 'joisc2008',
    tasks: ['belt', 'typhoon'],
  },
  joisc2022: {
    contestId: 'joisc2022',
    tasks: ['A', 'B', 'K', 'L'],
  },
  joisp2023: {
    contestId: 'joisp2023',
    tasks: ['A', 'B', 'K', 'L'],
  },
  joisp2024: {
    contestId: 'joisp2024',
    tasks: ['A', 'B', 'K', 'L'],
  },
  joiopen2024: {
    contestId: 'joiopen2024',
    tasks: ['A', 'B', 'C'],
  },
  'joig2021-open': {
    contestId: 'joig2021-open',
    tasks: ['A', 'B', 'C', 'D', 'E', 'F'],
  },
  'joig2022-open': {
    contestId: 'joig2022-open',
    tasks: ['A', 'B', 'F'],
  },
  'joig2023-open': {
    contestId: 'joig2023-open',
    tasks: ['A', 'B', 'F'],
  },
  // Note: Contest ID pattern changed from joisc to joisp starting from 2023
  joigsc2022: {
    contestId: 'joigsc2022',
    tasks: ['A', 'B', 'H'],
  },
  joigsp2023: {
    contestId: 'joigsp2023',
    tasks: ['A', 'B', 'H'],
  },
  joigsp2024: {
    contestId: 'joigsp2024',
    tasks: ['A', 'B', 'H'],
  },
};

export const joi = Object.entries(JOI_TEST_DATA).flatMap(([contestId, tasks]) =>
  generateJoiTestCases(Array(tasks.tasks.length).fill(contestId), tasks.tasks),
);

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
    const testCase = createTestCaseForContestNameAndTaskIndex(
      `ARC ${contestId}, task ${taskIndex}`,
    )({
      contestId: `arc${contestId}`,
      taskTableIndex: taskIndex,
      expected: `ARC ${contestId} - ${taskIndex}`,
    });

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
    const testCase = createTestCaseForContestNameAndTaskIndex(
      `AGC ${contestId}, task ${taskIndex}`,
    )({
      contestId: `agc${contestId}`,
      taskTableIndex: taskIndex,
      expected: `AGC ${contestId} - ${taskIndex}`,
    });

    return testCase;
  });
};

// HACK: Currently limited to UTPC contests as a pilot implementation.
// TODO: Extend support for other university contests (e.g., ICPC regional contests)
// after validating the current implementation.
/**
 * Represents the test data for a university contest.
 *
 * @interface UniversityContestTestData
 * @property {string} contestId - The unique identifier for the contest.
 * @property {string[]} tasks - An array of task identifiers associated with the contest.
 */
interface UniversityContestTestData {
  contestId: string;
  tasks: string[];
}

/**
 * Represents a collection of university contest test data.
 * Each key is a string representing the contest name or identifier,
 * and the value is an object containing the test data for that specific contest.
 */
interface UniversityContestsTestData {
  [key: string]: UniversityContestTestData;
}

// Note:
// UTPC contests on AtCoder: 2011-2014 and 2020-2023 (not held during 2015-2019)
// TTPC contests on AtCoder: 2015, 2019, 2022-
// TUPC contests on AtCoder: 2022-
//
// See:
// https://kenkoooo.com/atcoder/resources/contests.json
type UtpcTaskPatterns = {
  '2011-2014': string[];
  '2020': string[];
  '2021': string[];
  '2022': string[];
  '2023': string[];
};

const UTPC_TASK_PATTERNS: UtpcTaskPatterns = {
  '2011-2014': ['A', 'B', 'C', 'J', 'K', 'L'],
  '2020': ['A', 'B', 'C', 'K', 'L', 'M'],
  '2021': ['A', 'B', 'C', 'L', 'M', 'N'],
  '2022': ['A', 'B', 'C', 'M', 'N', 'O'],
  '2023': ['A', 'B', 'C', 'O', 'P', 'Q'],
};

const UTPC_TEST_DATA: UniversityContestsTestData = Object.fromEntries(
  Array.from({ length: 13 }, (_, i) => 2011 + i)
    .filter((year) => year <= 2014 || year >= 2020)
    .map((year) => [
      `utpc${year}`,
      {
        contestId: `utpc${year}`,
        tasks:
          UTPC_TASK_PATTERNS[
            year >= 2020 ? (year.toString() as keyof UtpcTaskPatterns) : '2011-2014'
          ],
      },
    ]),
) as UniversityContestsTestData;

type TtpcYear = '2015' | '2019' | '2022' | '2023';
type TtpcTaskPatterns = {
  [K in TtpcYear]: string[];
};

const TTPC_TASK_PATTERNS: TtpcTaskPatterns = {
  '2015': ['A', 'B', 'C', 'N', 'O', 'P'],
  '2019': ['A', 'B', 'C', 'M', 'N', 'O'],
  '2022': ['A', 'B', 'C', 'M', 'N', 'O'],
  '2023': ['A', 'B', 'C', 'N', 'O', 'P'],
};

const TTPC_YEARS = [2015, 2019, 2022, 2023];
const TTPC_TEST_DATA: UniversityContestsTestData = Object.fromEntries(
  TTPC_YEARS.map((year) => [
    `ttpc${year}`,
    {
      contestId: `ttpc${year}`,
      tasks: TTPC_TASK_PATTERNS[year.toString() as keyof TtpcTaskPatterns],
    },
  ]),
) as UniversityContestsTestData;

type TupcYear = '2022' | '2023';
type TupcTaskPatterns = {
  [K in TupcYear]: string[];
};

const TUPC_TASK_PATTERNS: TupcTaskPatterns = {
  '2022': ['A', 'B', 'C', 'M', 'N', 'O'],
  '2023': ['A', 'B', 'C', 'N', 'O', 'P'],
};

const TUPC_TEST_DATA: UniversityContestsTestData = Object.fromEntries(
  Array.from({ length: 2 }, (_, i) => 2022 + i).map((year) => [
    `tupc${year}`,
    {
      contestId: `tupc${year}`,
      tasks: TUPC_TASK_PATTERNS[year.toString() as keyof TupcTaskPatterns],
    },
  ]),
) as UniversityContestsTestData;

const generateUniversityTestCases = (
  contestIds: string[],
  taskIndices: string[],
): { name: string; value: TestCaseForContestNameAndTaskIndex }[] => {
  return zip(contestIds, taskIndices).map(([contestId, taskIndex]) => {
    const testCase = createTestCaseForContestNameAndTaskIndex(
      `${getAtCoderUniversityContestLabel(contestId)} ${taskIndex}`,
    )({
      contestId: `${contestId}`,
      taskTableIndex: taskIndex,
      expected: `${getAtCoderUniversityContestLabel(contestId)} - ${taskIndex}`,
    });

    return testCase;
  });
};

const ALL_UNIVERSITY_TEST_DATA: UniversityContestsTestData = {
  ...UTPC_TEST_DATA,
  ...TTPC_TEST_DATA,
  ...TUPC_TEST_DATA,
};

export const universities = Object.entries(ALL_UNIVERSITY_TEST_DATA).flatMap(([contestId, tasks]) =>
  generateUniversityTestCases(
    tasks.tasks.map(() => contestId),
    tasks.tasks,
  ),
);

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
      expected: `AOJ ${contestId}_${taskIndex}${getAojContestLabel(AOJ_COURSES, contestId)}`,
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
  Prelim2004: {
    contestId: 'Prelim2004',
    tasks: ['0027', '0043'],
  },
  Prelim2005: {
    contestId: 'Prelim2005',
    tasks: ['0073', '0092'],
  },
  Prelim2022: {
    contestId: 'Prelim2022',
    tasks: ['0479', '0489'],
  },
  Prelim2023: {
    contestId: 'Prelim2023',
    tasks: ['4012', '4013', '4022'],
  },
  Final2003: {
    contestId: 'Final2003',
    tasks: ['0000', '0098'],
  },
  Final2004: {
    contestId: 'Final2004',
    tasks: ['0044', '0097'],
  },
  Final2022: {
    contestId: 'Final2022',
    tasks: ['4000', '4011'],
  },
  Final2023: {
    contestId: 'Final2023',
    tasks: ['4023', '4035'],
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
      expected: `AOJ ${taskIndex}（パソコン甲子園${contestId.replace('Prelim', ' 予選 ').replace('Final', ' 本選 ')}）`,
    });

    return testCase;
  });
};

export const aojPck = Object.entries(AOJ_PCK_TEST_DATA).flatMap(([contestId, tasks]) =>
  generateAojPckTestCases(Array(tasks.tasks.length).fill(contestId), tasks.tasks),
);

/**
 * Test cases for AOJ JAG contests
 * Includes both preliminary (模擬国内予選) and regional (模擬アジア地区予選) rounds
 * Format: {round}{year} - {problemId}
 *  - Task ID format:
 *  - Recent contests (2021+): 33xx-33xx
 *  - Older contests (2005-2006): 20xx-20xx
 */
const AOJ_JAG_TEST_DATA = {
  Prelim2005: {
    contestId: 'Prelim2005',
    tasks: ['2006', '2007', '2011'],
  },
  Prelim2006: {
    contestId: 'Prelim2006',
    tasks: ['2000', '2001', '2005'],
  },
  Prelim2023: {
    contestId: 'Prelim2023',
    tasks: ['3358', '3359', '3365'],
  },
  Prelim2024: {
    contestId: 'Prelim2024',
    tasks: ['3386', '3387', '3394'],
  },
  Regional2005: {
    contestId: 'Regional2005',
    tasks: ['2024', '2025', '2029'],
  },
  Regional2006: {
    contestId: 'Regional2006',
    tasks: ['2030', '2031', '2038'],
  },
  Regional2017: {
    contestId: 'Regional2017',
    tasks: ['2856', '2857', '2866'],
  },
  Regional2020: {
    contestId: 'Regional2020',
    tasks: ['3218', '3219', '3228'],
  },
  Regional2021: {
    contestId: 'Regional2021',
    tasks: ['3300', '3301', '3310'],
  },
  Regional2022: {
    contestId: 'Regional2022',
    tasks: ['3346', '3347', '3357'],
  },
};

// Note: Test cases cover years when JAG contests were actually held
// Prelims: 2005-2006, 2009-2011, 2020-2024
// Regionals: 2005-2006, 2009-2011, 2016-2017, 2020-2022
type JagRound = 'Prelim' | 'Regional';
type JagYear =
  | '2005'
  | '2006'
  | '2009'
  | '2010'
  | '2011'
  | '2017'
  | '2020'
  | '2021'
  | '2022'
  | '2023'
  | '2024';
type JagContestId = `${JagRound}${JagYear}`;
type JagContestIds = JagContestId[];

const generateContestTestCases = <T extends string>(
  contestIds: T[],
  taskIndices: string[],
  formattedName: (contestId: T, taskIndex: string) => string,
  expectedFormat: (contestId: T, taskIndex: string) => string,
): { name: string; value: TestCaseForContestNameAndTaskIndex }[] => {
  return zip(contestIds, taskIndices).map(([contestId, taskIndex]) => {
    return createTestCaseForContestNameAndTaskIndex(formattedName(contestId, taskIndex))({
      contestId: `JAG${contestId}`,
      taskTableIndex: taskIndex,
      expected: expectedFormat(contestId, taskIndex),
    });
  });
};

const generateAojJagTestCases = (contestIds: JagContestIds, taskIndices: string[]) =>
  generateContestTestCases(
    contestIds,
    taskIndices,
    (contestId, taskIndex) => `AOJ, JAG${contestId} - ${taskIndex}`,
    (contestId, taskIndex) =>
      `AOJ ${taskIndex}（JAG${contestId.replace('Prelim', ' 模擬国内 ').replace('Regional', ' 模擬地区 ')}）`,
  );

export const aojJag = Object.entries(AOJ_JAG_TEST_DATA).flatMap(([contestId, tasks]) =>
  generateAojJagTestCases(Array(tasks.tasks.length).fill(contestId), tasks.tasks),
);
