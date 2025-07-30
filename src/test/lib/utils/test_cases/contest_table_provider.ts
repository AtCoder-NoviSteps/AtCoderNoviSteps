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

export const taskResultsForContestTableProvider: TaskResults = [
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
