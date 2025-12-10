import type { TaskResult, TaskResults } from '$lib/types/task';

// Default task result with minimal initialization.
// Most fields are empty strings as they're not relevant for these tests.
// The updated_at field is set to Unix epoch as we only care about task_table_index
// and task_id for header name testing.

/**
 * Default initial values for a TaskResult object.
 *
 * This constant provides empty or falsy default values for all properties
 * of a TaskResult. It's marked as readonly to prevent modifications.
 * The `updated_at` date is set to Unix epoch (January 1, 1970) as a
 * clearly identifiable default timestamp.
 *
 * @type {Readonly<TaskResult>} An immutable default TaskResult object
 */
const defaultTaskResult: Readonly<TaskResult> = {
  is_ac: false,
  user_id: '',
  status_name: '',
  status_id: '',
  submission_status_image_path: '',
  submission_status_label_name: '',
  contest_id: '',
  task_table_index: '',
  task_id: '',
  title: '',
  grade: '',
  updated_at: new Date(0), // Use the Unix epoch as the default value.
};

/** Represents a fully accepted submission status */
const AC = 'ac';
/** Represents a submission that was accepted with reference to the editorial */
const AC_WITH_EDITORIAL = 'ac_with_editorial';
/** Represents a challenge is underway */
const TRYING = 'wa';
/** Represents an unchallenged */
const PENDING = 'ns';

/**
 * Creates a new TaskResult using defaultTaskResult as a base, overriding the taskId and taskTableIndex.
 * @param contestId - The ID of the contest (e.g., 'abc212')
 * @param taskId - The ID of the task (e.g., 'abc212_a')
 * @param taskTableIndex - The index of the task in the table (e.g., 'A', 'B', 'Ex')
 * @param statusName - submission status of the task (e.g., 'ac', 'ac_with_editorial', 'wa', 'ns)
 * @returns A new TaskResult object with the specified taskId and taskTableIndex
 */
function createTaskResultWithTaskTableIndex(
  contestId: string,
  taskId: string,
  taskTableIndex: string,
  statusName: string,
): TaskResult {
  return {
    ...defaultTaskResult,
    contest_id: contestId,
    task_id: taskId,
    task_table_index: taskTableIndex,
    status_name: statusName,
    is_ac: statusName === AC || statusName === AC_WITH_EDITORIAL,
  };
}

// Define a structure for contest tasks
/**
 * Creates task results for a given contest based on provided task configurations.
 *
 * @param contestId - The unique identifier of the contest
 * @param taskConfigs - Array of task configurations with task table indices and status names
 * @param taskConfigs.taskTableIndex - The table index identifier for the task
 * @param taskConfigs.statusName - The status name to assign to the task
 * @returns An array of task results created from the given configurations
 */
const createContestTasks = (
  contestId: string,
  taskConfigs: Array<{ taskId?: string; taskTableIndex: string; statusName: string }>,
) => {
  return taskConfigs.map((config) => {
    const taskId = config.taskId || `${contestId}_${config.taskTableIndex.toLowerCase()}`;

    return createTaskResultWithTaskTableIndex(
      contestId,
      taskId,
      config.taskTableIndex,
      config.statusName,
    );
  });
};

// ABC126 - ABC211: 6 tasks (A, B, C, D, E, F)
// Mix of different submission statuses to test various filtering and display scenarios.
const [abc126_a, abc126_b, abc126_e, abc126_f] = createContestTasks('abc126', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'E', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'F', statusName: TRYING },
]);
const [abc150_d, abc150_e, abc150_f] = createContestTasks('abc150', [
  { taskTableIndex: 'D', statusName: AC },
  { taskTableIndex: 'E', statusName: TRYING },
  { taskTableIndex: 'F', statusName: PENDING },
]);
const [abc211_a, abc211_c, abc211_f] = createContestTasks('abc211', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'F', statusName: PENDING },
]);

// ABC212 - ABC232: 8 tasks (A, B, C, D, E, F, G and H)
// Mix of different submission statuses to test various filtering and display scenarios.
const [abc212_a, abc212_b, abc212_f, abc212_g, abc212_h] = createContestTasks('abc212', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'F', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'G', statusName: TRYING },
  { taskTableIndex: 'H', statusName: PENDING },
]);
const [abc213_h] = createContestTasks('abc213', [{ taskTableIndex: 'H', statusName: PENDING }]);
const [abc232_h] = createContestTasks('abc232', [{ taskTableIndex: 'H', statusName: TRYING }]);

// ABC001 - ABC019: 4 tasks (A, B, C, D) with numeric suffix format
const [abc001_1, abc001_2, abc001_3, abc001_4] = createContestTasks('abc001', [
  { taskId: 'abc001_1', taskTableIndex: 'A', statusName: AC },
  { taskId: 'abc001_2', taskTableIndex: 'B', statusName: AC },
  { taskId: 'abc001_3', taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskId: 'abc001_4', taskTableIndex: 'D', statusName: TRYING },
]);
const [abc019_1, abc019_2, abc019_3, abc019_4] = createContestTasks('abc019', [
  { taskId: 'abc019_1', taskTableIndex: 'A', statusName: AC },
  { taskId: 'abc019_2', taskTableIndex: 'B', statusName: AC },
  { taskId: 'abc019_3', taskTableIndex: 'C', statusName: PENDING },
  { taskId: 'abc019_4', taskTableIndex: 'D', statusName: PENDING },
]);

// ABC020 - ABC041: 4 tasks (A, B, C, D) with alphabet suffix format
const [abc020_a, abc020_b, abc020_c, abc020_d] = createContestTasks('abc020', [
  { taskId: 'abc020_a', taskTableIndex: 'A', statusName: AC },
  { taskId: 'abc020_b', taskTableIndex: 'B', statusName: AC },
  { taskId: 'abc020_c', taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskId: 'abc020_d', taskTableIndex: 'D', statusName: TRYING },
]);
const [abc041_a, abc041_b, abc041_c, abc041_d] = createContestTasks('abc041', [
  { taskId: 'abc041_a', taskTableIndex: 'A', statusName: AC },
  { taskId: 'abc041_b', taskTableIndex: 'B', statusName: AC },
  { taskId: 'abc041_c', taskTableIndex: 'C', statusName: PENDING },
  { taskId: 'abc041_d', taskTableIndex: 'D', statusName: PENDING },
]);

// ARC001 - ARC034: 4 tasks (A, B, C, D) with numeric suffix format
const [arc001_1, arc001_2, arc001_3, arc001_4] = createContestTasks('arc001', [
  { taskId: 'arc001_1', taskTableIndex: 'A', statusName: AC },
  { taskId: 'arc001_2', taskTableIndex: 'B', statusName: AC },
  { taskId: 'arc001_3', taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskId: 'arc001_4', taskTableIndex: 'D', statusName: TRYING },
]);
const [arc034_1, arc034_2, arc034_3, arc034_4] = createContestTasks('arc034', [
  { taskId: 'arc034_1', taskTableIndex: 'A', statusName: AC },
  { taskId: 'arc034_2', taskTableIndex: 'B', statusName: AC },
  { taskId: 'arc034_3', taskTableIndex: 'C', statusName: PENDING },
  { taskId: 'arc034_4', taskTableIndex: 'D', statusName: PENDING },
]);

// ARC035 - ARC057: 4 tasks (A, B, C, D) with alphabet suffix format
const [arc035_a, arc035_b, arc035_c, arc035_d] = createContestTasks('arc035', [
  { taskId: 'arc035_a', taskTableIndex: 'A', statusName: AC },
  { taskId: 'arc035_b', taskTableIndex: 'B', statusName: AC },
  { taskId: 'arc035_c', taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskId: 'arc035_d', taskTableIndex: 'D', statusName: TRYING },
]);
const [arc057_a, arc057_b, arc057_c, arc057_d] = createContestTasks('arc057', [
  { taskId: 'arc057_a', taskTableIndex: 'A', statusName: AC },
  { taskId: 'arc057_b', taskTableIndex: 'B', statusName: AC },
  { taskId: 'arc057_c', taskTableIndex: 'C', statusName: PENDING },
  { taskId: 'arc057_d', taskTableIndex: 'D', statusName: PENDING },
]);

// ABC233 - ABC318: 8 tasks (A, B, C, D, E, F, G and Ex)
const [abc233_a, abc233_b, abc233_ex] = createContestTasks('abc233', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: TRYING },
  { taskTableIndex: 'Ex', statusName: PENDING },
]);
const [abc234_ex] = createContestTasks('abc234', [{ taskTableIndex: 'Ex', statusName: AC }]);
const [abc317_ex] = createContestTasks('abc317', [{ taskTableIndex: 'Ex', statusName: TRYING }]);
const [abc318_ex] = createContestTasks('abc318', [{ taskTableIndex: 'Ex', statusName: PENDING }]);

// ABC319 - : 7 tasks (A, B, C, D, E, F and G)
const [abc319_a, abc319_b, abc319_c, abc319_d, abc319_e, abc319_f, abc319_g] = createContestTasks(
  'abc319',
  [
    { taskTableIndex: 'A', statusName: AC },
    { taskTableIndex: 'B', statusName: AC },
    { taskTableIndex: 'C', statusName: AC },
    { taskTableIndex: 'D', statusName: AC },
    { taskTableIndex: 'E', statusName: AC_WITH_EDITORIAL },
    { taskTableIndex: 'F', statusName: TRYING },
    { taskTableIndex: 'G', statusName: PENDING },
  ],
);

// Typical 90 Problems: 6 tasks (001, 002, 003, 010, 089 and 090)
const [typical90_001, typical90_002, typical90_003, typical90_010, typical90_089, typical90_090] =
  createContestTasks('typical90', [
    { taskId: 'typical90_a', taskTableIndex: '001', statusName: AC },
    { taskId: 'typical90_b', taskTableIndex: '002', statusName: TRYING },
    { taskId: 'typical90_c', taskTableIndex: '003', statusName: PENDING },
    { taskId: 'typical90_j', taskTableIndex: '010', statusName: AC },
    { taskId: 'typical90_ck', taskTableIndex: '089', statusName: TRYING },
    { taskId: 'typical90_cl', taskTableIndex: '090', statusName: PENDING },
  ]);

/**
 * Creates an array of contest task results with sequential contest numbers.
 *
 * @param startContestNumber - The first contest number in the sequence
 * @param contestCount - The number of contests to generate
 * @param taskIndex - The task index (e.g., 'A', 'B', 'C') to use for all contests
 * @returns An array of task results with alternating statuses (AC, AC_WITH_EDITORIAL, TRYING, PENDING)
 * in a repeating pattern. Each task has the format `abc{contestNumber}_{taskIndex.toLowerCase()}`.
 *
 * @example
 * Creates 3 contest results starting from ABC123 with task index D
 * const contests = createContestsRange(123, 3, 'D');
 */
function createContestsRange(startContestNumber: number, contestCount: number, taskIndex: string) {
  return Array.from({ length: contestCount }, (_, i) => {
    const contestNumber = startContestNumber + i;
    const contestId = `abc${contestNumber}`;
    const taskId = `${contestId}_${taskIndex.toLowerCase()}`;
    // Alternating statuses for variety
    let statusName;

    if (i % 4 === 0) {
      statusName = AC;
    } else if (i % 4 === 1) {
      statusName = AC_WITH_EDITORIAL;
    } else if (i % 4 === 2) {
      statusName = TRYING;
    } else {
      statusName = PENDING;
    }

    return createTaskResultWithTaskTableIndex(contestId, taskId, 'G', statusName);
  });
}

const [
  abc376_g,
  abc377_g,
  abc378_g,
  abc379_g,
  abc380_g,
  abc381_g,
  abc382_g,
  abc383_g,
  abc384_g,
  abc385_g,
  abc386_g,
  abc387_g,
  abc388_g,
  abc389_g,
  abc390_g,
  abc391_g,
  abc392_g,
  abc393_g,
  abc394_g,
  abc395_g,
  abc396_g,
  abc397_g,
] = createContestsRange(376, 22, 'G');

// Tessoku Book: Mixed problems from various contests
// Sources: math_and_algorithm_*, typical90_*, abc*_*
// Problem indices follow the format: A01-A77, B01-B69, C01-C20
const [
  tessoku_a01,
  tessoku_a06,
  tessoku_a27,
  tessoku_a29,
  tessoku_a39,
  tessoku_a63,
  tessoku_a62,
  tessoku_a77,
  tessoku_b07,
  tessoku_b16,
  tessoku_b28,
  tessoku_b63,
  tessoku_c09,
  tessoku_c18,
] = createContestTasks('tessoku-book', [
  { taskId: 'tessoku_book_a', taskTableIndex: 'A01', statusName: AC },
  { taskId: 'math_and_algorithm_ai', taskTableIndex: 'A06', statusName: AC },
  { taskId: 'math_and_algorithm_o', taskTableIndex: 'A27', statusName: AC },
  { taskId: 'math_and_algorithm_aq', taskTableIndex: 'A29', statusName: AC_WITH_EDITORIAL },
  { taskId: 'math_and_algorithm_bn', taskTableIndex: 'A39', statusName: AC },
  { taskId: 'math_and_algorithm_am', taskTableIndex: 'A62', statusName: TRYING },
  { taskId: 'math_and_algorithm_an', taskTableIndex: 'A63', statusName: TRYING },
  { taskId: 'typical90_a', taskTableIndex: 'A77', statusName: PENDING },
  { taskId: 'math_and_algorithm_al', taskTableIndex: 'B07', statusName: AC },
  { taskId: 'dp_a', taskTableIndex: 'B16', statusName: AC_WITH_EDITORIAL },
  { taskId: 'math_and_algorithm_ap', taskTableIndex: 'B28', statusName: TRYING },
  { taskId: 'abc007_3', taskTableIndex: 'B63', statusName: AC },
  { taskId: 'math_and_algorithm_ac', taskTableIndex: 'C09', statusName: AC },
  { taskId: 'typical90_s', taskTableIndex: 'C18', statusName: PENDING },
]);

export const taskResultsForContestTableProvider: TaskResults = [
  abc001_1,
  abc001_2,
  abc001_3,
  abc001_4,
  abc019_1,
  abc019_2,
  abc019_3,
  abc019_4,
  abc020_a,
  abc020_b,
  abc020_c,
  abc020_d,
  abc041_a,
  abc041_b,
  abc041_c,
  abc041_d,
  arc001_1,
  arc001_2,
  arc001_3,
  arc001_4,
  arc034_1,
  arc034_2,
  arc034_3,
  arc034_4,
  arc035_a,
  arc035_b,
  arc035_c,
  arc035_d,
  arc057_a,
  arc057_b,
  arc057_c,
  arc057_d,
  abc126_a,
  abc126_b,
  abc126_e,
  abc126_f,
  abc150_d,
  abc150_e,
  abc150_f,
  abc211_a,
  abc211_c,
  abc211_f,
  abc212_a,
  abc212_b,
  abc212_f,
  abc212_g,
  abc212_h,
  abc213_h,
  abc232_h,
  abc233_a,
  abc233_b,
  abc233_ex,
  abc234_ex,
  abc317_ex,
  abc318_ex,
  abc319_a,
  abc319_b,
  abc319_c,
  abc319_d,
  abc319_e,
  abc319_f,
  abc319_g,
  abc376_g,
  abc377_g,
  abc378_g,
  abc379_g,
  abc380_g,
  abc381_g,
  abc382_g,
  abc383_g,
  abc384_g,
  abc385_g,
  abc386_g,
  abc387_g,
  abc388_g,
  abc389_g,
  abc390_g,
  abc391_g,
  abc392_g,
  abc393_g,
  abc394_g,
  abc395_g,
  abc396_g,
  abc397_g,
  typical90_001,
  typical90_002,
  typical90_003,
  typical90_010,
  typical90_089,
  typical90_090,
];

export const taskResultsForTessokuBookProvider: TaskResults = [
  tessoku_a01,
  tessoku_a06,
  tessoku_a27,
  tessoku_a29,
  tessoku_a39,
  tessoku_a62,
  tessoku_a63,
  tessoku_a77,
  tessoku_b07,
  tessoku_b16,
  tessoku_b28,
  tessoku_b63,
  tessoku_c09,
  tessoku_c18,
];

// ABS (AtCoder Beginners Selection): 11 problems from various contests
// Problem indices follow the format: A-K (alphabetical order)
// Sources: practice_1, abc086, abc081 (2), abc087, abc083, abc088, abc085 (2), arc065, arc089
const [abs_a, abs_b, abs_c, abs_d, abs_e, abs_f, abs_g, abs_h, abs_i, abs_j, abs_k] =
  createContestTasks('abs', [
    { taskId: 'practice_1', taskTableIndex: 'A', statusName: AC },
    { taskId: 'abc086_a', taskTableIndex: 'B', statusName: AC },
    { taskId: 'abc081_a', taskTableIndex: 'C', statusName: AC },
    { taskId: 'abc081_b', taskTableIndex: 'D', statusName: AC },
    { taskId: 'abc087_b', taskTableIndex: 'E', statusName: AC },
    { taskId: 'abc083_b', taskTableIndex: 'F', statusName: AC },
    { taskId: 'abc088_b', taskTableIndex: 'G', statusName: AC },
    { taskId: 'abc085_b', taskTableIndex: 'H', statusName: AC },
    { taskId: 'abc085_c', taskTableIndex: 'I', statusName: AC_WITH_EDITORIAL },
    { taskId: 'arc065_a', taskTableIndex: 'J', statusName: TRYING },
    { taskId: 'arc089_a', taskTableIndex: 'K', statusName: PENDING },
  ]);

export const taskResultsForABS: TaskResults = [
  abs_a,
  abs_b,
  abs_c,
  abs_d,
  abs_e,
  abs_f,
  abs_g,
  abs_h,
  abs_i,
  abs_j,
  abs_k,
];

// Math and Algorithm: 10 problems (028, 036, 042, 045, 046, 048, 052, 095, 101, 102)
// Sources: dp_*, abc*_*, typical90_*, arc*_*
// Problem indices follow the format: 3-digit numbers (001-104)
const [
  math_and_algorithm_028,
  math_and_algorithm_036,
  math_and_algorithm_042,
  math_and_algorithm_045,
  math_and_algorithm_046,
  math_and_algorithm_048,
  math_and_algorithm_052,
  math_and_algorithm_095,
  math_and_algorithm_101,
  math_and_algorithm_102,
] = createContestTasks('math-and-algorithm', [
  { taskId: 'dp_a', taskTableIndex: '028', statusName: AC },
  { taskId: 'abc168_c', taskTableIndex: '036', statusName: AC },
  { taskId: 'abc172_d', taskTableIndex: '042', statusName: AC_WITH_EDITORIAL },
  { taskId: 'typical90_bz', taskTableIndex: '045', statusName: AC },
  { taskId: 'abc007_3', taskTableIndex: '046', statusName: TRYING },
  { taskId: 'arc084_b', taskTableIndex: '048', statusName: AC },
  { taskId: 'abc145_d', taskTableIndex: '052', statusName: PENDING },
  { taskId: 'typical90_j', taskTableIndex: '095', statusName: AC },
  { taskId: 'typical90_o', taskTableIndex: '101', statusName: AC },
  { taskId: 'arc117_c', taskTableIndex: '102', statusName: AC },
]);

export const taskResultsForMathAndAlgorithmProvider: TaskResults = [
  math_and_algorithm_028,
  math_and_algorithm_036,
  math_and_algorithm_042,
  math_and_algorithm_045,
  math_and_algorithm_046,
  math_and_algorithm_048,
  math_and_algorithm_052,
  math_and_algorithm_095,
  math_and_algorithm_101,
  math_and_algorithm_102,
];

// FPS 24: 4 problems (A, B, M, X)
// Represents a smaller problem set with uppercase letter indices
const [fps24_a, fps24_b, fps24_m, fps24_x] = createContestTasks('fps-24', [
  { taskId: 'fps_24_a', taskTableIndex: 'A', statusName: AC },
  { taskId: 'fps_24_b', taskTableIndex: 'B', statusName: AC },
  { taskId: 'fps_24_m', taskTableIndex: 'M', statusName: AC_WITH_EDITORIAL },
  { taskId: 'fps_24_x', taskTableIndex: 'X', statusName: TRYING },
]);

export const taskResultsForFPS24Provider: TaskResults = [fps24_a, fps24_b, fps24_m, fps24_x];

// ARC 104 Onwards: Multiple problem patterns (4, 5, 6, 7 problems)
// ARC104 (6 problems: A, B, C, D, E, F)
const [arc104_a, arc104_b, arc104_c, arc104_d, arc104_e, arc104_f] = createContestTasks('arc104', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
  { taskTableIndex: 'F', statusName: PENDING },
]);

// ARC120 (7 problems: A, B, C, D, E, F, F2 - exception case)
const [arc120_a, arc120_b, arc120_c, arc120_d, arc120_e, arc120_f, arc120_f2] = createContestTasks(
  'arc120',
  [
    { taskTableIndex: 'A', statusName: AC },
    { taskTableIndex: 'B', statusName: AC },
    { taskTableIndex: 'C', statusName: AC },
    { taskTableIndex: 'D', statusName: AC_WITH_EDITORIAL },
    { taskTableIndex: 'E', statusName: TRYING },
    { taskTableIndex: 'F', statusName: PENDING },
    { taskTableIndex: 'F2', statusName: PENDING },
  ],
);

// ARC204 (4 problems: A, B, C, D)
const [arc204_a, arc204_b, arc204_c, arc204_d] = createContestTasks('arc204', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'C', statusName: TRYING },
  { taskTableIndex: 'D', statusName: PENDING },
]);

// ARC208 (5 problems: A, B, C, D, E)
const [arc208_a, arc208_b, arc208_c, arc208_d, arc208_e] = createContestTasks('arc208', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
]);

export const taskResultsForARC104OnwardsProvider: TaskResults = [
  arc104_a,
  arc104_b,
  arc104_c,
  arc104_d,
  arc104_e,
  arc104_f,
  arc120_a,
  arc120_b,
  arc120_c,
  arc120_d,
  arc120_e,
  arc120_f,
  arc120_f2,
  arc204_a,
  arc204_b,
  arc204_c,
  arc204_d,
  arc208_a,
  arc208_b,
  arc208_c,
  arc208_d,
  arc208_e,
];

// AGC 001 Onwards: Multiple problem patterns (4, 5, 6, 7 problems)
// AGC001 (6 problems: A, B, C, D, E, F - standard pattern)
const [agc001_a, agc001_b, agc001_c, agc001_d, agc001_e, agc001_f] = createContestTasks('agc001', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
  { taskTableIndex: 'F', statusName: PENDING },
]);

// AGC002 (6 problems: A, B, C, D, E, F - standard pattern)
const [agc002_a, agc002_b, agc002_c, agc002_d, agc002_e, agc002_f] = createContestTasks('agc002', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC },
  { taskTableIndex: 'D', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'E', statusName: TRYING },
  { taskTableIndex: 'F', statusName: PENDING },
]);

// AGC009 (5 problems: A, B, C, D, E - historical exception)
const [agc009_a, agc009_b, agc009_c, agc009_d, agc009_e] = createContestTasks('agc009', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
]);

// AGC028 (7 problems: A, B, C, D, E, F, F2 - only 7-problem pattern in 2025)
const [agc028_a, agc028_b, agc028_c, agc028_d, agc028_e, agc028_f, agc028_f2] = createContestTasks(
  'agc028',
  [
    { taskTableIndex: 'A', statusName: AC },
    { taskTableIndex: 'B', statusName: AC },
    { taskTableIndex: 'C', statusName: AC },
    { taskTableIndex: 'D', statusName: AC_WITH_EDITORIAL },
    { taskTableIndex: 'E', statusName: TRYING },
    { taskTableIndex: 'F', statusName: PENDING },
    { taskTableIndex: 'F2', statusName: PENDING },
  ],
);

// AGC073 (4 problems: A, B, C, D - only 4-problem pattern in 2025)
const [agc073_a, agc073_b, agc073_c, agc073_d] = createContestTasks('agc073', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'C', statusName: TRYING },
  { taskTableIndex: 'D', statusName: PENDING },
]);

// AGC074 (5 problems: A, B, C, D, E - standard after AGC067)
const [agc074_a, agc074_b, agc074_c, agc074_d, agc074_e] = createContestTasks('agc074', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
]);

export const taskResultsForAGC001OnwardsProvider: TaskResults = [
  agc001_a,
  agc001_b,
  agc001_c,
  agc001_d,
  agc001_e,
  agc001_f,
  agc002_a,
  agc002_b,
  agc002_c,
  agc002_d,
  agc002_e,
  agc002_f,
  agc009_a,
  agc009_b,
  agc009_c,
  agc009_d,
  agc009_e,
  agc028_a,
  agc028_b,
  agc028_c,
  agc028_d,
  agc028_e,
  agc028_f,
  agc028_f2,
  agc073_a,
  agc073_b,
  agc073_c,
  agc073_d,
  agc074_a,
  agc074_b,
  agc074_c,
  agc074_d,
  agc074_e,
];
