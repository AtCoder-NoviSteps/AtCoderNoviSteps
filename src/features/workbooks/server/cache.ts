import { Cache, DEFAULT_CACHE_TTL } from '$lib/clients/cache';
import type { WorkbooksWithAuthors } from '$features/workbooks/types/workbook';

const BY_USER_KEY = 'workbooks_by_user';

const placementCache = new Cache<WorkbooksWithAuthors>(DEFAULT_CACHE_TTL, 100);
const byUserCache = new Cache<WorkbooksWithAuthors>(DEFAULT_CACHE_TTL);

export function getCachedWorkbooksByPlacement(
  key: string,
  fetchFn: () => Promise<WorkbooksWithAuthors>,
): Promise<WorkbooksWithAuthors> {
  return placementCache.getOrFetch(key, fetchFn);
}

export function getCachedWorkbooksByUser(
  fetchFn: () => Promise<WorkbooksWithAuthors>,
): Promise<WorkbooksWithAuthors> {
  return byUserCache.getOrFetch(BY_USER_KEY, fetchFn);
}

export function invalidateWorkbookCaches(): void {
  placementCache.clear();
  byUserCache.delete(BY_USER_KEY);
}

export function disposeWorkbookCaches(): void {
  placementCache.dispose();
  byUserCache.dispose();
}
