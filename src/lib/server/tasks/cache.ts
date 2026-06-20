import { Cache } from '$lib/clients/cache';

import type { Task } from '$lib/types/task';
import type { TaskMapByContestTaskPair } from '$lib/types/contest_task_pair';

const HOUR_MS = 60 * 60 * 1000;
const TASK_MAP_KEY = 'tasks_by_task_id';
const MERGED_KEY = 'merged_tasks_map';

const tasksCache = new Cache<Map<string, Task>>(HOUR_MS);
const mergedTasksCache = new Cache<TaskMapByContestTaskPair>(HOUR_MS);

export function getCachedTasksMap(
  fetchFn: () => Promise<Map<string, Task>>,
): Promise<Map<string, Task>> {
  return tasksCache.getOrFetch(TASK_MAP_KEY, fetchFn);
}

export function getCachedMergedTasksMap(
  fetchFn: () => Promise<TaskMapByContestTaskPair>,
): Promise<TaskMapByContestTaskPair> {
  return mergedTasksCache.getOrFetch(MERGED_KEY, fetchFn);
}

export function invalidateTaskCaches(): void {
  tasksCache.delete(TASK_MAP_KEY);
  mergedTasksCache.delete(MERGED_KEY);
}

export function disposeTaskCaches(): void {
  tasksCache.dispose();
  mergedTasksCache.dispose();
}
