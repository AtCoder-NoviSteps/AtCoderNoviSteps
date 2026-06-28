import type { TaskWithVoteInfo } from '$features/votes/services/vote_statistics';
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
