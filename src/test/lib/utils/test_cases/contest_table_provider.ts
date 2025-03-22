import type { TaskResult, TaskResults } from '$lib/types/task';

// Default task result with minimal initialization.
// Most fields are empty strings as they're not relevant for these tests.
// The updated_at field is set to Unix epoch as we only care about task_table_index
// and task_id for header name testing.
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

const AC = 'ac';
const AC_WITH_EDITORIAL = 'ac_with_editorial';
const TRYING = 'wa';
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

// ABC212 - ABC232: 8 tasks (A, B, C, D, E, F, G and H)
// // Mix of different submission statuses to test various filtering and display scenarios.
const abc212_a = createTaskResultWithTaskTableIndex('abc212', 'abc212_a', 'A', AC);
const abc212_b = createTaskResultWithTaskTableIndex('abc212', 'abc212_b', 'B', AC);
const abc212_f = createTaskResultWithTaskTableIndex('abc212', 'abc212_f', 'F', AC_WITH_EDITORIAL);
const abc212_g = createTaskResultWithTaskTableIndex('abc212', 'abc212_g', 'G', TRYING);
const abc212_h = createTaskResultWithTaskTableIndex('abc212', 'abc212_h', 'H', PENDING);
const abc213_h = createTaskResultWithTaskTableIndex('abc213', 'abc213_h', 'H', PENDING);
const abc232_h = createTaskResultWithTaskTableIndex('abc232', 'abc232_h', 'H', TRYING);

// ABC233 - ABC318: 8 tasks (A, B, C, D, E, F, G and Ex)
const abc233_a = createTaskResultWithTaskTableIndex('abc233', 'abc233_a', 'A', AC);
const abc233_b = createTaskResultWithTaskTableIndex('abc233', 'abc233_b', 'B', TRYING);
const abc233_ex = createTaskResultWithTaskTableIndex('abc233', 'abc233_ex', 'Ex', PENDING);
const abc234_ex = createTaskResultWithTaskTableIndex('abc234', 'abc234_ex', 'Ex', AC);
const abc317_ex = createTaskResultWithTaskTableIndex('abc317', 'abc317_ex', 'Ex', TRYING);
const abc318_ex = createTaskResultWithTaskTableIndex('abc318', 'abc318_ex', 'Ex', PENDING);

// ABC319 - : 7 tasks (A, B, C, D, E, F and G)
const abc319_a = createTaskResultWithTaskTableIndex('abc319', 'abc319_a', 'A', AC);
const abc319_b = createTaskResultWithTaskTableIndex('abc319', 'abc319_b', 'B', AC);
const abc319_c = createTaskResultWithTaskTableIndex('abc319', 'abc319_c', 'C', AC);
const abc319_d = createTaskResultWithTaskTableIndex('abc319', 'abc319_d', 'D', AC);
const abc319_e = createTaskResultWithTaskTableIndex('abc319', 'abc319_e', 'E', AC_WITH_EDITORIAL);
const abc319_f = createTaskResultWithTaskTableIndex('abc319', 'abc319_f', 'F', TRYING);
const abc319_g = createTaskResultWithTaskTableIndex('abc319', 'abc319_g', 'G', PENDING);
const abc376_g = createTaskResultWithTaskTableIndex('abc376', 'abc376_g', 'G', AC);
const abc377_g = createTaskResultWithTaskTableIndex('abc377', 'abc377_g', 'G', AC);
const abc378_g = createTaskResultWithTaskTableIndex('abc378', 'abc378_g', 'G', TRYING);
const abc379_g = createTaskResultWithTaskTableIndex('abc379', 'abc379_g', 'G', PENDING);
const abc380_g = createTaskResultWithTaskTableIndex('abc380', 'abc380_g', 'G', AC);
const abc381_g = createTaskResultWithTaskTableIndex('abc381', 'abc381_g', 'G', AC_WITH_EDITORIAL);
const abc382_g = createTaskResultWithTaskTableIndex('abc382', 'abc382_g', 'G', TRYING);
const abc383_g = createTaskResultWithTaskTableIndex('abc383', 'abc383_g', 'G', AC);
const abc384_g = createTaskResultWithTaskTableIndex('abc384', 'abc384_g', 'G', AC);
const abc385_g = createTaskResultWithTaskTableIndex('abc385', 'abc385_g', 'G', AC);
const abc386_g = createTaskResultWithTaskTableIndex('abc386', 'abc386_g', 'G', AC_WITH_EDITORIAL);
const abc387_g = createTaskResultWithTaskTableIndex('abc387', 'abc387_g', 'G', TRYING);
const abc388_g = createTaskResultWithTaskTableIndex('abc388', 'abc388_g', 'G', TRYING);
const abc389_g = createTaskResultWithTaskTableIndex('abc389', 'abc389_g', 'G', TRYING);
const abc390_g = createTaskResultWithTaskTableIndex('abc390', 'abc390_g', 'G', TRYING);
const abc391_g = createTaskResultWithTaskTableIndex('abc391', 'abc391_g', 'G', TRYING);
const abc392_g = createTaskResultWithTaskTableIndex('abc392', 'abc392_g', 'G', TRYING);
const abc393_g = createTaskResultWithTaskTableIndex('abc393', 'abc393_g', 'G', TRYING);
const abc394_g = createTaskResultWithTaskTableIndex('abc394', 'abc394_g', 'G', TRYING);
const abc395_g = createTaskResultWithTaskTableIndex('abc395', 'abc395_g', 'G', TRYING);
const abc396_g = createTaskResultWithTaskTableIndex('abc396', 'abc396_g', 'G', TRYING);
const abc397_g = createTaskResultWithTaskTableIndex('abc397', 'abc397_g', 'G', TRYING);

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
