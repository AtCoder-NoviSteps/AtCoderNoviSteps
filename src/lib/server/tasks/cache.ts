import type { Task } from '$lib/types/task';
import type { TaskMapByContestTaskPair } from '$lib/types/contest_task_pair';

import { Cache, DEFAULT_CACHE_TTL } from '$lib/clients/cache';

const TASK_MAP_KEY = 'tasks_by_task_id';
const MERGED_KEY = 'merged_tasks_map';

const tasksCache = new Cache<Map<string, Task>>(DEFAULT_CACHE_TTL);
const mergedTasksCache = new Cache<TaskMapByContestTaskPair>(DEFAULT_CACHE_TTL);

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
