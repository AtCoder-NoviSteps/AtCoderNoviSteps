import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';

import type { PlacementQuery } from '$features/workbooks/types/workbook_placement';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';
import { WorkBookType } from '$features/workbooks/types/workbook';

import {
  getCachedWorkbooksByPlacement,
  getCachedWorkbooksByUser,
  invalidateWorkbookCaches,
  disposeWorkbookCaches,
} from './cache';

const solutionQuery: PlacementQuery = {
  workBookType: WorkBookType.SOLUTION,
  solutionCategory: SolutionCategory.SEARCH_SIMULATION,
};
const mockFetchFn = () => vi.fn().mockResolvedValue([]);

afterAll(() => disposeWorkbookCaches());

describe('getCachedWorkbooksByPlacement', () => {
  beforeEach(() => invalidateWorkbookCaches());
  afterEach(() => vi.restoreAllMocks());

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockFetchFn();
    await getCachedWorkbooksByPlacement(solutionQuery, false, fetchFn);
    await getCachedWorkbooksByPlacement(solutionQuery, false, fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('misses cache when solutionCategory differs', async () => {
    const fetchFn = mockFetchFn();
    const otherQuery: PlacementQuery = {
      ...solutionQuery,
      solutionCategory: SolutionCategory.DYNAMIC_PROGRAMMING,
    };
    await getCachedWorkbooksByPlacement(solutionQuery, false, fetchFn);
    await getCachedWorkbooksByPlacement(otherQuery, false, fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  test('misses cache when includeUnpublished differs', async () => {
    const fetchFn = mockFetchFn();
    await getCachedWorkbooksByPlacement(solutionQuery, false, fetchFn);
    await getCachedWorkbooksByPlacement(solutionQuery, true, fetchFn);
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
    await getCachedWorkbooksByPlacement(solutionQuery, false, placementFn);
    await getCachedWorkbooksByUser(userFn);
    invalidateWorkbookCaches();
    await getCachedWorkbooksByPlacement(solutionQuery, false, placementFn);
    await getCachedWorkbooksByUser(userFn);
    expect(placementFn).toHaveBeenCalledTimes(2);
    expect(userFn).toHaveBeenCalledTimes(2);
  });
});
