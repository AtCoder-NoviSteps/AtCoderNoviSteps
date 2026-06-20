import { Cache } from '$lib/clients/cache';
import type { VotedGradeStatistics } from '@prisma/client';

const VOTE_STATS_TTL_MS = 10 * 60 * 1000;
const KEY = 'vote_grade_statistics';

const cache = new Cache<Map<string, VotedGradeStatistics>>(VOTE_STATS_TTL_MS);

export function getCachedVoteStats(
  fetchFn: () => Promise<Map<string, VotedGradeStatistics>>,
): Promise<Map<string, VotedGradeStatistics>> {
  return cache.getOrFetch(KEY, fetchFn);
}

export function invalidateVoteCaches(): void {
  cache.delete(KEY);
}

export function disposeVoteCaches(): void {
  cache.dispose();
}
