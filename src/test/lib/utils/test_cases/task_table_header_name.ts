import type { TaskResult } from '$lib/types/task';

// For the default task result, the updated_at field is set to the Unix epoch.
// why: only use the parameter task_table_index
const defaultTaskResult: TaskResult = {
  is_ac: true,
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

function createTaskResultWithTaskTableIndex(taskId: string, taskTableIndex: string): TaskResult {
  return {
    ...defaultTaskResult,
    task_id: taskId,
    task_table_index: taskTableIndex,
  };
}

// ABC212 - ABC232: 8 tasks (A, B, C, D, E, F, G, H)
const abc212_a = createTaskResultWithTaskTableIndex('abc212', 'A');
const abc212_b = createTaskResultWithTaskTableIndex('abc212', 'B');
const abc212_f = createTaskResultWithTaskTableIndex('abc212', 'F');
const abc212_g = createTaskResultWithTaskTableIndex('abc212', 'G');
const abc212_h = createTaskResultWithTaskTableIndex('abc212', 'H');
const abc213_h = createTaskResultWithTaskTableIndex('abc213', 'H');
const abc232_h = createTaskResultWithTaskTableIndex('abc232', 'H');

// ABC233 - ABC318: 8 tasks (A, B, C, D, E, F, G, Ex)
const abc233_a = createTaskResultWithTaskTableIndex('abc233', 'A');
const abc233_b = createTaskResultWithTaskTableIndex('abc233', 'B');
const abc233_ex = createTaskResultWithTaskTableIndex('abc233', 'Ex');
const abc234_ex = createTaskResultWithTaskTableIndex('abc234', 'Ex');
const abc317_ex = createTaskResultWithTaskTableIndex('abc317', 'Ex');
const abc318_ex = createTaskResultWithTaskTableIndex('abc318', 'Ex');

// ABC319 - : 7 tasks (A, B, C, D, E, F, G)
const abc319_a = createTaskResultWithTaskTableIndex('abc319', 'A');
const abc319_b = createTaskResultWithTaskTableIndex('abc319', 'B');
const abc319_f = createTaskResultWithTaskTableIndex('abc319', 'F');
const abc319_g = createTaskResultWithTaskTableIndex('abc319', 'G');
const abc386_g = createTaskResultWithTaskTableIndex('abc386', 'G');

export const taskResultsForTaskTableHeaderName = {
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
  abc319_f,
  abc319_g,
  abc386_g,
};
