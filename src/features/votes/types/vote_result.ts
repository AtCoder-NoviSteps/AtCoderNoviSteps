import type { TaskGrade } from '$lib/types/task';

/** Result of fetching a single user's vote for a task. */
export type VoteGradeResult = {
  voted: boolean;
  grade: TaskGrade | null;
};
