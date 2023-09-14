// TODO: Add Task and Tasks type

export type TaskResult = {
  contest_id: string;
  id: string;
  title: string;
  grade: string;
  user_id: string;
  submission_status: string;
};

export type TaskResults = TaskResult[];
