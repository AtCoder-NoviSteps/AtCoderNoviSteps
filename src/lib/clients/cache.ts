export class Cache<T extends {}> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private inflight = new Map<string, Promise<T>>();
  private cleanupInterval: NodeJS.Timeout;

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

  get size(): number {
    return this.cache.size;
  }

  get health(): { size: number; oldestEntry: number } {
    if (this.cache.size === 0) {
      return { size: 0, oldestEntry: 0 };
    }

    const oldestEntry = Math.min(
      ...Array.from(this.cache.values()).map((entry) => entry.timestamp),
    );
    return { size: this.cache.size, oldestEntry };
  }

  /** @throws {Error} If the key is empty, not a string, or longer than 255 characters. */
  set(key: string, data: T): void {
    if (!key || typeof key !== 'string' || key.length > 255) {
      throw new Error('Invalid cache key');
    }

    // Remove existing entry first to avoid counting it twice.
    this.cache.delete(key);

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldestEntry();

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() - entry.timestamp > this.timeToLive) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

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

  async getOrFetch(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const pending = this.inflight.get(key);

    if (pending) {
      return pending;
    }

    const promise = fetchFn().then(
      (result) => {
        this.set(key, result);
        this.inflight.delete(key);
        return result;
      },
      (error) => {
        this.inflight.delete(key);
        throw error;
      },
    );

    this.inflight.set(key, promise);

    return promise;
  }

  /** Call when the cache instance is no longer needed to prevent timer leaks. */
  dispose(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
    this.inflight.clear();
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.timeToLive) {
        this.cache.delete(key);
      }
    }
  }

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

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export const DEFAULT_CACHE_TTL = 60 * 60 * 1000;
const DEFAULT_MAX_CACHE_SIZE = 50;

export interface CacheConfig {
  timeToLive?: number;
  maxSize?: number;
}

export interface ApiClientConfig {
  contestCache: CacheConfig;
  taskCache: CacheConfig;
}
