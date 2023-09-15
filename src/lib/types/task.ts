export interface Task {
  contest_id: string;
  task_id: string;
  title: string;
  grade: string;
}

export type Tasks = Task[];

export interface TaskResult extends Task {
  user_id: string;
  submission_status: string;
}

export type TaskResults = TaskResult[];
