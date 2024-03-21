// See:
// https://github.com/kenkoooo/AtCoderProblems/blob/master/doc/api.md
export type UserSubmissionsAPI = {
  id: string;
  epoch_second: number;
  problem_id: string;
  contest_id: string;
  user_id: string;
  language: string;
  point: number;
  length: number;
  result: string;
  execution_time: number;
};
