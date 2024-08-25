import type {
  WorkBookTaskBase,
  WorkBookTasksBase,
  WorkBookTaskCreate,
  WorkBookTasksCreate,
  WorkBookTaskEdit,
  WorkBookTasksEdit,
} from '$lib/types/workbook';
import type { Task } from '$lib/types/task';

export const PENDING = -1;

// Note: 初期値として、便宜的に割り当てている。随時、変更可能。
export const NO_COMMENT = '';

export function addTaskToWorkBook(
  selectedTask: Task,
  workBookTasks: WorkBookTasksBase,
  workBookTasksForTable: WorkBookTasksCreate | WorkBookTasksEdit,
  newWorkBookTaskIndex: number,
) {
  // データベース用
  const updatedWorkBookTasks = updateWorkBookTasks(
    workBookTasks,
    newWorkBookTaskIndex,
    selectedTask,
  );

  // アプリの表示用
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
    priority: PENDING, // 1に近いほど優先度が高い
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
  // HACK: オーバーロードを定義しているにもかかわらず戻り値の型がWorkBookTasksBaseになってしまうため、やむを得ずキャスト
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

// 関数のオーバーロードを定義
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
  // 範囲外のインデックスを指定された場合の仕様
  // 負の値: 先頭に追加
  // 元の配列よりも大きな値: 末尾に追加
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
