/**
 * A generic cache class that stores data with a timestamp and provides methods to set, get, and delete cache entries.
 * The cache automatically removes the oldest entry when the maximum cache size is reached.
 * Entries are also automatically invalidated and removed if they exceed a specified time-to-live (TTL).
 *
 * @template T - The type of data to be stored in the cache.
 */
export class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  /**
   * Constructs an instance of the class with the specified cache time-to-live (TTL) and maximum cache size.
   *
   * @param timeToLive - The time-to-live for the cache entries, in milliseconds. Defaults to `CACHE_TTL`.
   * @param maxSize - The maximum number of entries the cache can hold. Defaults to `MAX_CACHE_SIZE`.
   */
  constructor(
    private readonly timeToLive: number = DEFAULT_CACHE_TTL,
    private readonly maxSize: number = DEFAULT_MAX_CACHE_SIZE,
  ) {
    if (this.timeToLive <= 0) {
      throw new Error('TTL must be positive');
    }
    if (maxSize <= 0) {
      throw new Error('Max size must be positive');
    }

    this.cleanupInterval = setInterval(() => this.cleanup(), this.timeToLive);
  }

  /**
   * Gets the size of the cache.
   *
   * @returns {number} The number of items in the cache.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Retrieves the health status of the cache.
   *
   * @returns An object containing the size of the cache and the timestamp of the oldest entry.
   * @property {number} size - The number of entries in the cache.
   * @property {number} oldestEntry - The timestamp of the oldest entry in the cache.
   */
  get health(): { size: number; oldestEntry: number } {
    if (this.cache.size === 0) {
      return { size: 0, oldestEntry: 0 };
    }

    const oldestEntry = Math.min(
      ...Array.from(this.cache.values()).map((entry) => entry.timestamp),
    );
    return { size: this.cache.size, oldestEntry };
  }

  /**
   * Sets a new entry in the cache with the specified key and data.
   * If the cache size exceeds the maximum limit, the oldest entry is removed.
   *
   * @param key - The key associated with the data to be cached.
   * @param data - The data to be cached.
   *
   * @throws {Error} If the key is empty, not a string, or longer than 255 characters.
   */
  set(key: string, data: T): void {
    if (!key || typeof key !== 'string' || key.length > 255) {
      throw new Error('Invalid cache key');
    }

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldestEntry();

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Checks if a key exists in the cache without removing expired entries.
   *
   * @param key - The key to check.
   * @returns True if the key exists in the cache, false otherwise.
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Retrieves an entry from the cache.
   *
   * @param key - The key associated with the cache entry.
   * @returns The cached data if it exists and is not expired, otherwise `undefined`.
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > this.timeToLive) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Disposes of resources used by the cache instance.
   *
   * This method clears the interval used for cleanup and clears the cache.
   * It should be called when the cache instance is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Deletes an entry from the cache.
   *
   * @param key - The key of the entry to delete.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Removes expired entries from the cache.
   * This method is called periodically by the cleanup interval.
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.timeToLive) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Finds the key of the oldest entry in the cache based on timestamp.
   *
   * @returns The key of the oldest entry, or undefined if the cache is empty.
   */
  private findOldestEntry(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }
}

/**
 * Represents a cache entry with data and a timestamp.
 *
 * @template T - The type of the cached data.
 * @property {T} data - The cached data.
 * @property {number} timestamp - The timestamp when the data was cached.
 */
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

/**
 * The time-to-live (TTL) for the cache, specified in milliseconds.
 * This value represents 1 hour.
 */
const DEFAULT_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
/**
 * The default maximum number of entries the cache can hold.
 * This value represents 50 entries.
 */
const DEFAULT_MAX_CACHE_SIZE = 50;

/**
 * Configuration options for caching.
 *
 * @property {number} [timeToLive] - The duration (in milliseconds) for which a cache entry should remain valid.
 * @property {number} [maxSize] - The maximum number of entries that the cache can hold.
 */

export interface CacheConfig {
  timeToLive?: number;
  maxSize?: number;
}

/**
 * Configuration for the API client's caching behavior.
 *
 * @interface ApiClientConfig
 * @property {CacheConfig} contestCache - Configuration for contest-related data caching.
 * @property {CacheConfig} taskCache - Configuration for task-related data caching.
 */
export interface ApiClientConfig {
  contestCache: CacheConfig;
  taskCache: CacheConfig;
}
