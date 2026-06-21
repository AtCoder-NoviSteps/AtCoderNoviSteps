import { Cache } from '$lib/clients/cache';

import type { VotedGradeStatistics } from '@prisma/client';

import type { TaskWithVoteInfo } from '$features/votes/services/vote_statistics';

const VOTE_STATS_TTL_MS = 10 * 60 * 1000;
const VOTE_STATS_KEY = 'vote_grade_statistics';
const ALL_TASKS_WITH_VOTE_INFO_KEY = 'all_tasks_with_vote_info';

const voteStatsCache = new Cache<Map<string, VotedGradeStatistics>>(VOTE_STATS_TTL_MS);
const allTasksWithVoteInfoCache = new Cache<TaskWithVoteInfo[]>(VOTE_STATS_TTL_MS);

export function getCachedVoteStats(
  fetchFn: () => Promise<Map<string, VotedGradeStatistics>>,
): Promise<Map<string, VotedGradeStatistics>> {
  return voteStatsCache.getOrFetch(VOTE_STATS_KEY, fetchFn);
}

export function getCachedAllTasksWithVoteInfo(
  fetchFn: () => Promise<TaskWithVoteInfo[]>,
): Promise<TaskWithVoteInfo[]> {
  return allTasksWithVoteInfoCache.getOrFetch(ALL_TASKS_WITH_VOTE_INFO_KEY, fetchFn);
}

export function invalidateVoteCaches(): void {
  voteStatsCache.delete(VOTE_STATS_KEY);
  allTasksWithVoteInfoCache.delete(ALL_TASKS_WITH_VOTE_INFO_KEY);
}

export function disposeVoteCaches(): void {
  voteStatsCache.dispose();
  allTasksWithVoteInfoCache.dispose();
}
