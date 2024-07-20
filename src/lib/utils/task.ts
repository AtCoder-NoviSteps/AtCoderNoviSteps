import { type TaskResult, type TaskResults, TaskGrade } from '$lib/types/task';
import { type WorkBookTaskBase } from '$lib/types/workbook';
import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
import { getContestPriority } from '$lib/utils/contest';

// TODO: 複数のコンテストサイトに対応できるようにする
export const taskUrl = (contestId: string, taskId: string) => {
  return `${ATCODER_BASE_CONTEST_URL}/${contestId}/tasks/${taskId}`;
};

export const countAcceptedTasks = (taskResults: TaskResults) => {
  const acceptedResults = taskResults.filter((taskResult: TaskResult) => taskResult.is_ac);

  return acceptedResults.length;
};

export const countAllTasks = (tasks: TaskResults | WorkBookTaskBase[]) => {
  return tasks.length;
};

export const areAllTasksAccepted = (
  acceptedTasks: TaskResults,
  allTasks: TaskResults | WorkBookTaskBase[],
) => {
  const allTaskCount = countAllTasks(allTasks);
  const acceptedTaskCount = countAcceptedTasks(acceptedTasks);

  return allTaskCount > 0 && acceptedTaskCount === allTaskCount;
};

// See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
export function compareByContestIdAndTaskId(first: TaskResult, second: TaskResult): number {
  const firstContestPriority = getContestPriority(first.contest_id);
  const secondContestPriority = getContestPriority(second.contest_id);

  // 1. コンテスト種類別の優先度(昇順)
  //
  // See:
  // contestTypePriorities in src/lib/utils/contest.ts
  if (firstContestPriority !== secondContestPriority) {
    return firstContestPriority - secondContestPriority;
  }

  // 2. コンテストID(降順)
  const sortByContestIdInDescendingOrder = second.contest_id.localeCompare(first.contest_id);

  if (sortByContestIdInDescendingOrder !== 0) {
    return sortByContestIdInDescendingOrder;
  }

  // 3. 問題ID(昇順)
  return first.task_table_index.localeCompare(second.task_table_index);
}

// order: 1 (first) - 17 (last)、9999: Infinity
export const getTaskGradeOrder: Map<TaskGrade, number> = new Map([
  [TaskGrade.Q11, 1],
  [TaskGrade.Q10, 2],
  [TaskGrade.Q9, 3],
  [TaskGrade.Q8, 4],
  [TaskGrade.Q7, 5],
  [TaskGrade.Q6, 6],
  [TaskGrade.Q5, 7],
  [TaskGrade.Q4, 8],
  [TaskGrade.Q3, 9],
  [TaskGrade.Q2, 10],
  [TaskGrade.Q1, 11],
  [TaskGrade.D1, 12],
  [TaskGrade.D2, 13],
  [TaskGrade.D3, 14],
  [TaskGrade.D4, 15],
  [TaskGrade.D5, 16],
  [TaskGrade.D6, 17],
  [TaskGrade.PENDING, 9999],
]);

// https://tailwindcss.com/docs/customizing-colors
// https://tailwindcss.com/docs/content-configuration#dynamic-class-names
export const getTaskGradeColor = (grade: string) => {
  let color = 'bg-gray-200';

  switch (grade) {
    case TaskGrade.Q11:
      color = 'bg-atcoder-Q11';
      break;
    case TaskGrade.Q10:
      color = 'bg-atcoder-Q10';
      break;
    case TaskGrade.Q9:
      color = 'bg-atcoder-Q9';
      break;
    case TaskGrade.Q8:
      color = 'bg-atcoder-Q8';
      break;
    case TaskGrade.Q7:
      color = 'bg-atcoder-Q7';
      break;
    case TaskGrade.Q6:
      color = 'bg-atcoder-Q6';
      break;
    case TaskGrade.Q5:
      color = 'bg-atcoder-Q5';
      break;
    case TaskGrade.Q4:
      color = 'bg-atcoder-Q4';
      break;
    case TaskGrade.Q3:
      color = 'bg-atcoder-Q3';
      break;
    case TaskGrade.Q2:
      color = 'bg-atcoder-Q2';
      break;
    case TaskGrade.Q1:
      color = 'bg-atcoder-Q1';
      break;
    case TaskGrade.D1:
      color = 'bg-atcoder-D1';
      break;
    case TaskGrade.D2:
      color = 'bg-atcoder-D2';
      break;
    case TaskGrade.D3:
      color = 'bg-atcoder-D3';
      break;
    case TaskGrade.D4:
      color = 'bg-atcoder-D4';
      break;
    case TaskGrade.D5:
      color = 'bg-atcoder-D5';
      break;
    case TaskGrade.D6:
      color = 'bg-atcoder-D6';
      break;
  }

  return color;
};

// Q11 → 11Q、D1 → 1D
export const getTaskGradeLabel = (taskGrade: TaskGrade | string) => {
  if (taskGrade === TaskGrade.PENDING) {
    return TaskGrade.PENDING;
  } else {
    return taskGrade.slice(1) + taskGrade.slice(0, 1);
  }
};

// See:
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
export const toWhiteTextIfNeeds = (grade: string) => {
  const gradeToWhiteText = [
    `${getTaskGradeLabel(TaskGrade.Q3)}`,
    `${getTaskGradeLabel(TaskGrade.Q2)}`,
    `${getTaskGradeLabel(TaskGrade.D1)}`,
    `${getTaskGradeLabel(TaskGrade.D2)}`,
    `${getTaskGradeLabel(TaskGrade.D4)}`,
    `${getTaskGradeLabel(TaskGrade.D5)}`,
    `${getTaskGradeLabel(TaskGrade.D6)}`,
  ];

  if (gradeToWhiteText.includes(grade)) {
    return 'text-white';
  } else {
    return 'text-black';
  }
};
