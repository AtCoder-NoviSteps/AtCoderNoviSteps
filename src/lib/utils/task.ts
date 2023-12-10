import { TaskGrade } from '$lib/types/task';

// https://tailwindcss.com/docs/customizing-colors
// https://tailwindcss.com/docs/content-configuration#dynamic-class-names
export const getTaskGradeColor = (grade: string) => {
  let color = 'bg-blue-300';

  switch (grade) {
    case TaskGrade.Q11:
      color = 'bg-atcoder-gray';
      break;
  }

  return color;
};
