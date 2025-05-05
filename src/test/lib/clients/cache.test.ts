import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Cache } from '$lib/clients/cache';

describe('Cache', () => {
  // Mock time functions
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('constructor', () => {
    test('expects to create a cache with default values', () => {
      const cache = new Cache<string>();
      expect(cache.size).toBe(0);
    });

    test('expects to throw error if TTL is not positive', () => {
      expect(() => new Cache<string>(-1)).toThrow('TTL must be positive');
      expect(() => new Cache<string>(-2)).toThrow('TTL must be positive');
    });

    test('expects to throw error if max size is not positive', () => {
      expect(() => new Cache<string>(1000, 0)).toThrow('Max size must be positive');
      expect(() => new Cache<string>(1000, -1)).toThrow('Max size must be positive');
    });
  });

  describe('set and get', () => {
    test('expects to set and get a value', () => {
      const cache = new Cache<string>();
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
    });

    test('expects to return undefined for non-existent key', () => {
      const cache = new Cache<string>();
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    test('expects to throw error for invalid key', () => {
      const cache = new Cache<string>();
      expect(() => cache.set('', 'value')).toThrow('Invalid cache key');
      expect(() => cache.set('a'.repeat(256), 'value')).toThrow('Invalid cache key');
      // @ts-expect-error: Testing invalid input
      expect(() => cache.set(123, 'value')).toThrow('Invalid cache key');
    });

    test('expects to return undefined and delete entry if it is expired', () => {
      const TTL = 1000;
      const cache = new Cache<string>(TTL);

      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');

      vi.advanceTimersByTime(TTL + 1);
      expect(cache.get('key')).toBeUndefined();
      expect(cache.size).toBe(0);
    });
  });

  describe('key overwriting', () => {
    test('expects to overwrite value for existing key', () => {
      const cache = new Cache<string>();
      cache.set('key', 'value1');
      expect(cache.get('key')).toBe('value1');

      cache.set('key', 'value2');
      expect(cache.get('key')).toBe('value2');
      expect(cache.size).toBe(1); // The size is same.
    });

    test('expects to reset expiration when overwriting key', () => {
      const TTL = 1000;
      const cache = new Cache<string>(TTL);

      vi.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
      cache.set('key', 'value1');

      // 800 ms elapsed (not expired).
      vi.advanceTimersByTime(800);

      // overwrite the key.
      cache.set('key', 'value2');

      // Another 800 ms elapsed (total 1600 ms, expired if original value).
      vi.advanceTimersByTime(800);

      // Overwritten values have not yet expired.
      expect(cache.get('key')).toBe('value2');
    });
  });

  describe('LRU behavior', () => {
    test('expects to evict least recently accessed item when max size is reached', () => {
      const cache = new Cache<string>(1000, 3);

      // Add three items to the cache.
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Add a new item to exceed the max size (key1 expected to be evicted).
      cache.set('key4', 'value4');

      // Expect key1 to be evicted, the others to be present.
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('size management', () => {
    test('expects to report correct size', () => {
      const cache = new Cache<string>();
      expect(cache.size).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);

      cache.delete('key1');
      expect(cache.size).toBe(1);

      cache.clear();
      expect(cache.size).toBe(0);
    });

    test('expects to remove oldest entry when max size is reached', () => {
      const cache = new Cache<string>(1000, 2);

      vi.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
      cache.set('key1', 'value1');

      vi.setSystemTime(new Date('2023-01-01T00:00:01.000Z'));
      cache.set('key2', 'value2');

      vi.setSystemTime(new Date('2023-01-01T00:00:02.000Z'));
      cache.set('key3', 'value3');

      expect(cache.size).toBe(2);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });
  });

  describe('edge cases', () => {
    test('expects to handle different value types', () => {
      const cache = new Cache<unknown>();

      // Save various types of values.
      cache.set('string', 'test');
      cache.set('number', 123);
      cache.set('boolean', true);
      cache.set('null', null);
      cache.set('object', { a: 1, b: 2 });
      cache.set('array', [1, 2, 3]);

      // Validate the values are stored correctly.
      expect(cache.get('string')).toBe('test');
      expect(cache.get('number')).toBe(123);
      expect(cache.get('boolean')).toBeTruthy();
      expect(cache.get('null')).toBe(null);
      expect(cache.get('object')).toEqual({ a: 1, b: 2 });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    test('expects to handle boundary TTL cases', () => {
      const TTL = 1000;
      const cache = new Cache<string>(TTL);

      cache.set('key', 'value');

      // TTL just not expired yet.
      vi.advanceTimersByTime(TTL);
      expect(cache.get('key')).toBe('value');

      // TTL+1 has expired.
      vi.advanceTimersByTime(1);
      expect(cache.get('key')).toBeUndefined();
    });
  });

  describe('health', () => {
    test('expects to report correct health information', () => {
      const cache = new Cache<string>();

      vi.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
      cache.set('key1', 'value1');

      vi.setSystemTime(new Date('2023-01-01T00:00:01.000Z'));
      cache.set('key2', 'value2');

      const health = cache.health;
      expect(health.size).toBe(2);
      expect(health.oldestEntry).toBe(new Date('2023-01-01T00:00:00.000Z').getTime());
    });
  });

  describe('delete and clear', () => {
    test('expects to delete an entry', () => {
      const cache = new Cache<string>();
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');

      cache.delete('key');
      expect(cache.get('key')).toBeUndefined();
    });

    test('expects to clear all entries', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('automatic cleanup', () => {
    test('expects to automatically clean up expired entries', () => {
      const TTL = 1000;
      const cache = new Cache<string>(TTL);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);

      vi.advanceTimersByTime(TTL + 1);

      // Force cleanup by triggering the interval callback
      vi.runOnlyPendingTimers();

      expect(cache.size).toBe(0);
    });
  });

  describe('dispose', () => {
    test('expects to dispose resources correctly', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const cache = new Cache<string>();

      cache.set('key', 'value');
      cache.dispose();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(cache.size).toBe(0);
    });
  });
});
