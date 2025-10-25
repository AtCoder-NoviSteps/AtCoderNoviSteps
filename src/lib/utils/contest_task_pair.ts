import type { ContestTaskPairKey } from '$lib/types/contest_task_pair';

/**
 * Creates a unique key for a ContestTaskPair using contestId and taskId.
 * Throws an error if either argument is an empty string.
 *
 * @param contestId - The ID of the contest.
 * @param taskId - The ID of the task.
 *
 * @returns A string in the format "contestId:taskId".
 *
 * @throws Will throw an error if contestId or taskId is empty.
 */
export function createContestTaskPairKey(contestId: string, taskId: string): ContestTaskPairKey {
  if (!contestId || contestId.trim() === '') {
    throw new Error('contestId must be a non-empty string');
  }
  if (!taskId || taskId.trim() === '') {
    throw new Error('taskId must be a non-empty string');
  }

  return `${contestId}:${taskId}`;
}
