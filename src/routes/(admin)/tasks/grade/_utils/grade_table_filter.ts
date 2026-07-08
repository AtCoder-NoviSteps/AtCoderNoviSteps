import type { TaskWithVoteInfo } from '$features/votes/services/vote_statistics';
import { TaskGrade } from '$lib/types/task';
import { filterTasksBySearch } from '$lib/utils/task_filter';

/**
 * Applies the grade-table search rule.
 *
 * - Empty query: returns an empty array (search-first UI).
 * - Non-empty query: returns every match without a result cap, so pagination
 *   can page through the full result set.
 */
export function filterGradeTableTasks(
  tasks: TaskWithVoteInfo[],
  query: string,
): TaskWithVoteInfo[] {
  if (query.trim() === '') {
    return [];
  }

  return filterTasksBySearch(tasks, query, Infinity);
}

/**
 * Counts tasks whose confirmed grade is still PENDING (not yet graded by an admin),
 * over the whole dataset — independent of the current search filter.
 */
export function countPendingTasks(tasks: TaskWithVoteInfo[]): number {
  return tasks.filter((task) => task.grade === TaskGrade.PENDING).length;
}
