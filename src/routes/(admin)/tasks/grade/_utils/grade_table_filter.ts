import type { TaskWithVoteInfo } from '$features/votes/services/vote_statistics';
import { filterTasksBySearch } from '$lib/utils/task_filter';

/**
 * Applies the grade-table search rule.
 *
 * - Empty query: returns all tasks, or none when search is required (the
 *   non-pending table stays hidden until the admin searches).
 * - Non-empty query: returns every match without a result cap, so pagination
 *   can page through the full result set.
 */
export function filterGradeTableTasks(
  tasks: TaskWithVoteInfo[],
  query: string,
  requireSearch: boolean,
): TaskWithVoteInfo[] {
  if (query.trim() === '') {
    return requireSearch ? [] : tasks;
  }

  return filterTasksBySearch(tasks, query, Infinity);
}
