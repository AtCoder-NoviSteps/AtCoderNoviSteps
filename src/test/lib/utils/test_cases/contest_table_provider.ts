import type { TaskResult, TaskResults } from '$lib/types/task';

// Default task result with minimal initialization.
// Most fields are empty strings as they're not relevant for these tests.
// The updated_at field is set to Unix epoch as we only care about task_table_index
// and task_id for header name testing.

/**
 * Default task result object used as a template for test data.
 * Most fields are initialized as empty strings as they're not relevant for these tests.
 * @type {TaskResult}
 */
const defaultTaskResult: TaskResult = {
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
  taskConfigs: Array<{ taskTableIndex: string; statusName: string }>,
) => {
  return taskConfigs.map((config) => {
    const taskId = `${contestId}_${config.taskTableIndex.toLowerCase()}`;

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
] = Array.from({ length: 22 }, (_, i) => {
  const contestNum = 376 + i;
  const contestId = `abc${contestNum}`;
  const taskId = `${contestId}_g`;
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
];
