import { TaskGrade, type Task } from '$lib/types/task';
import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';

// TODO: 複数のコンテストサイトに対応できるようにする
export const taskUrl = (contestId: string, taskId: string) => {
  return `${ATCODER_BASE_CONTEST_URL}/${contestId}/tasks/${taskId}`;
};

export const getTask = (tasks: Map<string, Task>, taskId: string): Task | undefined => {
  return tasks.get(taskId);
};

export const getTaskName = (tasks: Map<string, Task>, taskId: string): string => {
  return getTask(tasks, taskId)?.title as string;
};

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
