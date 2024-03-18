import { TaskGrade, type TaskResult } from '$lib/types/task';
import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';

export const taskUrl = (taskResult: TaskResult) => {
  return `${ATCODER_BASE_CONTEST_URL}/${taskResult.contest_id}/tasks/${taskResult.task_id}`;
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
