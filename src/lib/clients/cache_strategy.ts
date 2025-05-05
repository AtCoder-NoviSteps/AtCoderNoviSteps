import { Cache } from '$lib/clients/cache';

import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

/**
 * A strategy for caching contest and task data.
 * Separates the caching logic from the data fetching concerns.
 */
export class ContestTaskCache {
  /**
   * Constructs a cache strategy with the specified contest and task caches.
   * @param contestCache - Cache for storing contest import data
   * @param taskCache - Cache for storing task import data
   */
  constructor(
    private readonly contestCache: Cache<ContestsForImport>,
    private readonly taskCache: Cache<TasksForImport>,
  ) {}

  /**
   * Retrieves data from cache if available, otherwise fetches it using the provided function.
   *
   * @template T - The type of data being cached and returned
   * @param {string} key - The unique identifier for the cached data
   * @param {() => Promise<T>} fetchFunction - Function that returns a Promise resolving to data of type T
   * @param {Cache<T>} cache - Cache object with get and set methods for type T
   * @returns {Promise<T>} - The cached data or newly fetched data
   *
   * @example
   * const result = await cacheInstance.getCachedOrFetch(
   *   'contests-123',
   *   () => api.fetchContests(),
   *   contestCache
   * );
   */
  async getCachedOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    cache: Cache<T>,
  ): Promise<T> {
    const cachedData = cache.get(key);

    if (cachedData) {
      console.log(`Using cached data for ${key}`);
      return cachedData;
    }

    console.log(`Cache miss for ${key}, fetching...`);

    try {
      const contestTasks = await fetchFunction();
      cache.set(key, contestTasks);

      return contestTasks;
    } catch (error) {
      console.error(`Failed to fetch contests and/or tasks for ${key}:`, error);
      return [] as unknown as T;
    }
  }

  /**
   * Gets contests from cache or fetches them.
   */
  async getCachedOrFetchContests(
    key: string,
    fetchFunction: () => Promise<ContestsForImport>,
  ): Promise<ContestsForImport> {
    return this.getCachedOrFetch(key, fetchFunction, this.contestCache);
  }

  /**
   * Gets tasks from cache or fetches them.
   */
  async getCachedOrFetchTasks(
    key: string,
    fetchFunction: () => Promise<TasksForImport>,
  ): Promise<TasksForImport> {
    return this.getCachedOrFetch(key, fetchFunction, this.taskCache);
  }
}
