import { Cache } from '$lib/clients/cache';

import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

export class ContestTaskCache {
  constructor(
    private readonly contestCache: Cache<ContestsForImport>,
    private readonly taskCache: Cache<TasksForImport>,
  ) {}

  async getCachedOrFetchContests(
    key: string,
    fetchFunction: () => Promise<ContestsForImport>,
  ): Promise<ContestsForImport> {
    return this.contestCache.getOrFetch(key, fetchFunction);
  }

  async getCachedOrFetchTasks(
    key: string,
    fetchFunction: () => Promise<TasksForImport>,
  ): Promise<TasksForImport> {
    return this.taskCache.getOrFetch(key, fetchFunction);
  }
}
