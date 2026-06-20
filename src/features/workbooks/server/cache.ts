import { Cache } from '$lib/clients/cache';
import type { WorkbooksWithAuthors } from '$features/workbooks/types/workbook';
import { WorkBookType as WorkBookTypeConst } from '$features/workbooks/types/workbook';
import type { PlacementQuery } from '$features/workbooks/types/workbook_placement';

const HOUR_MS = 60 * 60 * 1000;
const BY_USER_KEY = 'workbooks_by_user';

const placementCache = new Cache<WorkbooksWithAuthors>(HOUR_MS, 100);
const byUserCache = new Cache<WorkbooksWithAuthors>(HOUR_MS);

function buildPlacementKey(query: PlacementQuery, includeUnpublished: boolean): string {
  if (query.workBookType === WorkBookTypeConst.CURRICULUM) {
    return `CURRICULUM:${query.taskGrade}:${includeUnpublished}`;
  }

  return `SOLUTION:${query.solutionCategory}:${includeUnpublished}`;
}

export function getCachedWorkbooksByPlacement(
  query: PlacementQuery,
  includeUnpublished: boolean,
  fetchFn: () => Promise<WorkbooksWithAuthors>,
): Promise<WorkbooksWithAuthors> {
  const key = buildPlacementKey(query, includeUnpublished);
  return placementCache.getOrFetch(key, fetchFn);
}

export function getCachedWorkbooksByUser(
  fetchFn: () => Promise<WorkbooksWithAuthors>,
): Promise<WorkbooksWithAuthors> {
  return byUserCache.getOrFetch(BY_USER_KEY, fetchFn);
}

export function invalidateWorkbookCaches(): void {
  placementCache.clear();
  byUserCache.clear();
}

export function disposeWorkbookCaches(): void {
  placementCache.dispose();
  byUserCache.dispose();
}
