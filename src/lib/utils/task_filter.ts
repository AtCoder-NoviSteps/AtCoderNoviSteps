import { getContestNameLabel } from '$lib/utils/contest';

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
  if (search === '') {
    return [];
  }

  const query = search.toLowerCase();

  return tasks
    .filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.task_id.toLowerCase().includes(query) ||
        task.contest_id.toLowerCase().includes(query) ||
        getContestNameLabel(task.contest_id).toLowerCase().includes(query),
    )
    .slice(0, limit);
}
