import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';

import type { Task } from '$lib/types/task';
import {
  getCachedTasksMap,
  getCachedMergedTasksMap,
  invalidateTaskCaches,
  disposeTaskCaches,
} from './cache';

const taskEntry = new Map([['abc422_a', { task_id: 'abc422_a' } as unknown as Task]]);
const mockFetchFn = (data: Map<string, Task> = new Map()) => vi.fn().mockResolvedValue(data);

afterAll(() => disposeTaskCaches());

describe('getCachedTasksMap', () => {
  beforeEach(() => invalidateTaskCaches());
  afterEach(() => vi.restoreAllMocks());

  test('delegates to cache and returns fetched value', async () => {
    const fetchFn = mockFetchFn(taskEntry);
    const result = await getCachedTasksMap(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.get('abc422_a')?.task_id).toBe('abc422_a');
  });

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockFetchFn(taskEntry);
    await getCachedTasksMap(fetchFn);
    await getCachedTasksMap(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('getCachedMergedTasksMap', () => {
  beforeEach(() => invalidateTaskCaches());
  afterEach(() => vi.restoreAllMocks());

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockFetchFn();
    await getCachedMergedTasksMap(fetchFn);
    await getCachedMergedTasksMap(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('invalidateTaskCaches', () => {
  beforeEach(() => invalidateTaskCaches());
  afterEach(() => vi.restoreAllMocks());

  test('clears both tasks and mergedTasks caches', async () => {
    const tasksFn = mockFetchFn();
    const mergedFn = mockFetchFn();
    await getCachedTasksMap(tasksFn);
    await getCachedMergedTasksMap(mergedFn);
    invalidateTaskCaches();
    await getCachedTasksMap(tasksFn);
    await getCachedMergedTasksMap(mergedFn);
    expect(tasksFn).toHaveBeenCalledTimes(2);
    expect(mergedFn).toHaveBeenCalledTimes(2);
  });
});
