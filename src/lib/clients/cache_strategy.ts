import { Cache } from '$lib/clients/cache';

/**
 * Utility class for managing cached data for contest tasks.
 * Provides a mechanism to either retrieve data from cache if available
 * or fetch it using the provided function.
 */
export class ContestTaskCache {
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

    try {
      const contestTasks = await fetchFunction();
      cache.set(key, contestTasks);

      return contestTasks;
    } catch (error) {
      console.error(`Failed to fetch contests and/or tasks for ${key}:`, error);
      return [] as unknown as T;
    }
  }
}
