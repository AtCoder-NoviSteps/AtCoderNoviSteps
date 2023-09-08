export type Task = {
  contest_id: string;
  id: string;
  title: string;
  grade: string;
  user_id: string;
  submission_status: string;
};

export type Tasks = Task[];
