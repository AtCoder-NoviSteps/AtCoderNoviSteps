import { getContestNameLabel } from '$lib/utils/contest';
import { getTaskUrl } from '$lib/utils/task';

type SearchableTask = {
  title: string;
  task_id: string;
  contest_id: string;
};

/**
 * Filters tasks by a search string against title, task_id, contest_id, and contest name label.
 * Sorting and order are the caller's responsibility.
 *
 * @param tasks - The task list to filter
 * @param search - Search string (case-insensitive). Returns empty array when empty.
 * @param limit - Maximum number of results to return
 *
 * @returns Filtered tasks, capped at limit
 */
export function filterTasksBySearch<T extends SearchableTask>(
  tasks: T[],
  search: string,
  limit: number,
): T[] {
  const trimmed = search.trim();

  if (trimmed === '') {
    return [];
  }

  const query = trimmed.toLowerCase();

  return tasks
    .filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.task_id.toLowerCase().includes(query) ||
        task.contest_id.toLowerCase().includes(query) ||
        getContestNameLabel(task.contest_id).toLowerCase().includes(query) ||
        getTaskUrl(task.contest_id, task.task_id).toLowerCase().includes(query),
    )
    .slice(0, limit);
}
