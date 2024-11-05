// Import original enum as type.
import type { TaskGrade as TaskGradeOrigin } from '@prisma/client';

export interface Task {
  contest_id: string;
  task_table_index: string;
  task_id: string;
  title: string;
  grade: string;
}

export type Tasks = Task[];

export interface TaskForImport {
  id: string;
  contest_id: string;
  problem_index: string;
  task_id: string;
  title: string;
}

export type TasksForImport = TaskForImport[];

// See:
// https://github.com/prisma/prisma/issues/12504#issuecomment-1147356141
// Guarantee that the implementation corresponds to the original type.
//
// 11Q(最も簡単)〜6D(最難関)。
// 注: 基準は非公開。
export const TaskGrade: { [key in TaskGradeOrigin]: key } = {
  PENDING: 'PENDING', // 未確定
  Q11: 'Q11', // 11Qのように表記したいが、数字を最初の文字として利用できないため
  Q10: 'Q10',
  Q9: 'Q9',
  Q8: 'Q8',
  Q7: 'Q7',
  Q6: 'Q6',
  Q5: 'Q5',
  Q4: 'Q4',
  Q3: 'Q3',
  Q2: 'Q2',
  Q1: 'Q1',
  D1: 'D1',
  D2: 'D2',
  D3: 'D3',
  D4: 'D4',
  D5: 'D5',
  D6: 'D6',
} as const;

export function getTaskGrade(taskGrade: string): TaskGradeOrigin | undefined {
  return TaskGrade[taskGrade as TaskGradeOrigin];
}

// Re-exporting the original type with the original name.
export type TaskGrade = TaskGradeOrigin;

export type TaskGrades = TaskGrade[];

export const taskGradeValues = Object.values(TaskGrade);

export interface TaskResult extends Task {
  user_id: string;
  status_name: string;
  status_id: string;
  submission_status_image_path: string;
  submission_status_label_name: string;
  is_ac: boolean;
  updated_at: Date;
}

export type TaskResults = TaskResult[];
