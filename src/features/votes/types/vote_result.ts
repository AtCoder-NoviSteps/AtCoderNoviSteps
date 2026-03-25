import type { TaskGrade } from '$lib/types/task';

/** Result of fetching a single user's vote for a task. */
export type VoteGradeResult = {
  voted: boolean;
  grade: TaskGrade | null;
};

/** A single entry in the vote statistics map, keyed by taskId. */
export type VoteStatisticsEntry = { grade: string };

/** Map from taskId to its vote statistics entry. */
export type VoteStatisticsMap = Map<string, VoteStatisticsEntry>;
