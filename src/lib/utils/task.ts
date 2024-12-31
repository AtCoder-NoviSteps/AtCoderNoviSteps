import type { UrlGenerator, UrlGenerators } from '$lib/types/url';
import { ContestType } from '$lib/types/contest';
import { type TaskResult, type TaskResults, TaskGrade, type TaskGrades } from '$lib/types/task';
import { type WorkBookTaskBase } from '$lib/types/workbook';
import { ATCODER_BASE_CONTEST_URL, AOJ_TASKS_URL } from '$lib/constants/urls';
import { getPrefixForAojCourses, getContestPriority } from '$lib/utils/contest';

// TODO: Codeforces、yukicoder、BOJなどに対応できるようにする
/**
 * Generates a URL for a task based on the contest ID and task ID.
 * Uses a chain of URL generators to handle different contest platforms.
 * @param contestId - The ID of the contest
 * @param taskId - The ID of the task
 * @returns The generated URL or empty string if no suitable generator is found
 */
export const getTaskUrl = (contestId: string, taskId: string): string => {
  const generators = urlGenerators.find((generator) => generator.canHandle(contestId));
  return generators?.generateUrl(contestId, taskId) ?? '';
};

// Default case
class AtCoderGenerator implements UrlGenerator {
  canHandle(contestId: string): boolean {
    return contestId !== '' && contestId !== null;
  }

  generateUrl(contestId: string, taskId: string): string {
    return `${ATCODER_BASE_CONTEST_URL}/${contestId}/tasks/${taskId}`;
  }
}

class AojGenerator implements UrlGenerator {
  canHandle(contestId: string): boolean {
    return (
      getPrefixForAojCourses().includes(contestId) ||
      contestId.startsWith('PCK') ||
      contestId.startsWith('JAG')
    );
  }

  // Note: contestId is not used because it is not included in the URL.
  generateUrl(_: string, taskId: string): string {
    return `${AOJ_TASKS_URL}/${taskId}`;
  }
}

// Note:
// Default generator last
const urlGenerators: UrlGenerators = [new AojGenerator(), new AtCoderGenerator()];

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

// See:
// https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/pages/TablePage/AtCoderRegularTable.tsx
export const getTaskTableHeaderName = (contestType: ContestType, taskResult: TaskResult) => {
  if (contestType === ContestType.ABC && taskResult.task_table_index === 'H') {
    return 'H/Ex';
  } else if (taskResult.task_table_index === 'Ex') {
    return 'H/Ex';
  }

  return taskResult.task_table_index;
};

// 問題一覧や問題集の詳細ページでは、AtCoder ProblemsのAPIから取得したタイトルからプレフィックス（A., B., ..., G. など）を非表示にする
// 理由: 問題を解くときに、プレフィックスからの先入観を受けないようにするため
// その他: プレフィックスは、同じテーブルの出典に記載する
export const removeTaskIndexFromTitle = (title: string, taskTableIndex: string = '') => {
  return title.replace(`${taskTableIndex}. `, '');
};

export const taskGradeOrderInfinity = 9999;

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
  [TaskGrade.PENDING, taskGradeOrderInfinity],
]);

export function getGradeOrder(grade: TaskGrade): number {
  const order = getTaskGradeOrder.get(grade);
  return order !== undefined ? order : taskGradeOrderInfinity;
}

// 問題数が最頻値となるグレードを取得。ただし、2つ以上ある場合は、最も低いグレードとする。
//
// 例:
//    ・9Q: 5問、8Q: 1問         => 9Q
//    ・9Q: 1問、8Q: 2問         => 8Q
//    ・8Q: 2問、7Q: 5問、6Q: 5問 => 7Q
export function calcGradeMode(taskGrades: TaskGrades): TaskGrade {
  if (taskGrades.length === 0) {
    return TaskGrade.PENDING;
  }

  // 各グレードの問題数をカウント
  const gradeFrequencies = new Map<TaskGrade, number>();

  taskGrades.forEach((grade: TaskGrade) => {
    if (grade === TaskGrade.PENDING) {
      return;
    }

    const count = gradeFrequencies.get(grade) ?? 0;
    gradeFrequencies.set(grade, count + 1);
  });

  if (gradeFrequencies.size === 0) {
    return TaskGrade.PENDING;
  }

  // 最頻値のグレードを取得
  // Note: Mapを直接ソートできないので、一旦Arrayに変換
  const gradeFrequencyArray = Array.from(gradeFrequencies.entries());

  gradeFrequencyArray.sort(([firstGrade, firstCount], [secondGrade, secondCount]) => {
    const firstGradeOrder = getGradeOrder(firstGrade);
    const secondGradeOrder = getGradeOrder(secondGrade);

    // 1. 問題数が多い順
    if (firstCount !== secondCount) {
      return secondCount - firstCount;
    }

    // 2. 同数の場合は、TaskGradeの換算値の昇順
    return firstGradeOrder - secondGradeOrder;
  });

  const gradeMode = gradeFrequencyArray[0][0];

  return gradeMode;
}

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
