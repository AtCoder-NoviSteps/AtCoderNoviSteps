import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';

import {
  getCachedWorkbooksByPlacement,
  getCachedWorkbooksByUser,
  invalidateWorkbookCaches,
  disposeWorkbookCaches,
} from './cache';

const mockFetchFn = () => vi.fn().mockResolvedValue([]);

afterAll(() => disposeWorkbookCaches());

describe('getCachedWorkbooksByPlacement', () => {
  beforeEach(() => invalidateWorkbookCaches());
  afterEach(() => vi.restoreAllMocks());

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockFetchFn();
    await getCachedWorkbooksByPlacement('SOLUTION:SEARCH_SIMULATION:false', fetchFn);
    await getCachedWorkbooksByPlacement('SOLUTION:SEARCH_SIMULATION:false', fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('misses cache when key differs', async () => {
    const fetchFn = mockFetchFn();
    await getCachedWorkbooksByPlacement('SOLUTION:SEARCH_SIMULATION:false', fetchFn);
    await getCachedWorkbooksByPlacement('SOLUTION:DYNAMIC_PROGRAMMING:false', fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

describe('getCachedWorkbooksByUser', () => {
  beforeEach(() => invalidateWorkbookCaches());
  afterEach(() => vi.restoreAllMocks());

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockFetchFn();
    await getCachedWorkbooksByUser(fetchFn);
    await getCachedWorkbooksByUser(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('invalidateWorkbookCaches', () => {
  beforeEach(() => invalidateWorkbookCaches());
  afterEach(() => vi.restoreAllMocks());

  test('clears both placement and user caches', async () => {
    const placementFn = mockFetchFn();
    const userFn = mockFetchFn();
    await getCachedWorkbooksByPlacement('SOLUTION:SEARCH_SIMULATION:false', placementFn);
    await getCachedWorkbooksByUser(userFn);
    invalidateWorkbookCaches();
    await getCachedWorkbooksByPlacement('SOLUTION:SEARCH_SIMULATION:false', placementFn);
    await getCachedWorkbooksByUser(userFn);
    expect(placementFn).toHaveBeenCalledTimes(2);
    expect(userFn).toHaveBeenCalledTimes(2);
  });
});
