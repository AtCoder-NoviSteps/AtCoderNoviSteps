import type { Task } from '$lib/types/task';
import type {
  WorkBookTaskBase,
  WorkBookTasksBase,
  WorkBookTaskCreate,
  WorkBookTasksCreate,
  WorkBookTaskEdit,
  WorkBookTasksEdit,
} from '$features/workbooks/types/workbook';

// Note: 0-indexed for both display and internal use
export function generateWorkBookTaskOrders(workBookTaskCount: number) {
  return Array.from({ length: workBookTaskCount + 1 }, (_, index) => ({
    name: index,
    value: index,
  }));
}

export const PENDING = -1;

// Note: Convenience default value; can be changed at any time.
export const NO_COMMENT = '';

export function addTaskToWorkBook(
  selectedTask: Task,
  workBookTasks: WorkBookTasksBase,
  workBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit,
  newWorkBookTaskIndex: number,
) {
  // For database
  const updatedWorkBookTasks = updateWorkBookTasks(
    workBookTasks,
    newWorkBookTaskIndex,
    selectedTask,
  );

  // For display
  const updatedWorkBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit =
    updateWorkBookTaskForTable(workBookTasksForTable, newWorkBookTaskIndex, selectedTask);

  return { updatedWorkBookTasks, updatedWorkBookTasksForTable };
}

export function updateWorkBookTasks(
  workBookTasks: WorkBookTasksBase,
  selectedIndex: number,
  selectedTask: Task,
): WorkBookTasksBase {
  const newWorkBookTask: WorkBookTaskBase = {
    taskId: selectedTask.task_id,
    priority: PENDING, // Lower value = higher priority
    comment: NO_COMMENT,
  };
  let updatedWorkBookTasks: WorkBookTasksBase = insertTaskToWorkBook(
    workBookTasks,
    selectedIndex,
    newWorkBookTask,
  );
  updatedWorkBookTasks = reCalcTaskPriority(updatedWorkBookTasks);

  return updatedWorkBookTasks;
}

export function updateWorkBookTaskForTable(
  workBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit,
  selectedIndex: number,
  selectedTask: Task,
): WorkBookTasksCreate | WorkBookTasksEdit {
  const newWorkBookTaskForTable: WorkBookTaskCreate | WorkBookTaskEdit = {
    contestId: selectedTask.contest_id,
    taskId: selectedTask.task_id,
    title: selectedTask.title,
    priority: PENDING,
    comment: NO_COMMENT,
  };
  // HACK: Cast required despite overloads - TypeScript infers WorkBookTasksBase as the return type
  let updatedWorkBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit = insertTaskToWorkBook(
    workBookTasksForTable,
    selectedIndex,
    newWorkBookTaskForTable,
  ) as WorkBookTasksCreate | WorkBookTasksEdit;
  updatedWorkBookTasksForTable = reCalcTaskPriority(updatedWorkBookTasksForTable) as
    | WorkBookTasksCreate
    | WorkBookTasksEdit;

  return updatedWorkBookTasksForTable;
}

// Function overloads
function insertTaskToWorkBook(
  workBookTasks: WorkBookTasksBase,
  selectedIndex: number,
  newWorkBookTask: WorkBookTaskBase,
): WorkBookTasksBase;
function insertTaskToWorkBook(
  workBookTasks: WorkBookTasksCreate,
  selectedIndex: number,
  newWorkBookTask: WorkBookTaskCreate,
): WorkBookTasksCreate;
function insertTaskToWorkBook(
  workBookTasks: WorkBookTasksEdit,
  selectedIndex: number,
  newWorkBookTask: WorkBookTaskEdit,
): WorkBookTasksEdit;
function insertTaskToWorkBook(
  workBookTasks: WorkBookTasksBase | WorkBookTasksCreate | WorkBookTasksEdit,
  selectedIndex: number,
  newWorkBookTask: WorkBookTaskBase | WorkBookTaskCreate | WorkBookTaskEdit,
): WorkBookTasksBase | WorkBookTasksCreate | WorkBookTasksEdit {
  // Out-of-bounds behavior: negative index → prepend; index > length → append
  if (selectedIndex < 0) {
    selectedIndex = 0;
  } else if (selectedIndex > workBookTasks.length) {
    selectedIndex = workBookTasks.length;
  }

  const newWorkBookTasks = [
    ...workBookTasks.slice(0, selectedIndex),
    newWorkBookTask,
    ...workBookTasks.slice(selectedIndex),
  ];

  return newWorkBookTasks;
}

function reCalcTaskPriority(workBookTasks: WorkBookTasksBase): WorkBookTasksBase;
function reCalcTaskPriority(workBookTasks: WorkBookTasksCreate): WorkBookTasksCreate;
function reCalcTaskPriority(workBookTasks: WorkBookTasksEdit): WorkBookTasksEdit;
function reCalcTaskPriority(
  workBookTasks: WorkBookTasksBase | WorkBookTasksCreate | WorkBookTasksEdit,
): WorkBookTasksBase | WorkBookTasksCreate | WorkBookTasksEdit {
  const newWorkBookTasks = workBookTasks.map((task, index) => ({
    ...task,
    priority: index + 1,
  }));

  return newWorkBookTasks;
}
