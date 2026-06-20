import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';

import type { VotedGradeStatistics } from '@prisma/client';
import { TaskGrade } from '$lib/types/task';
import { getCachedVoteStats, invalidateVoteCaches, disposeVoteCaches } from './cache';

const makeStats = (): Map<string, VotedGradeStatistics> =>
  new Map([
    [
      'abc408_d',
      {
        id: '1',
        taskId: 'abc408_d',
        grade: TaskGrade.Q1,
        isExperimental: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      } as unknown as VotedGradeStatistics,
    ],
  ]);
const mockStatsFn = () => vi.fn().mockResolvedValue(makeStats());

afterAll(() => disposeVoteCaches());

describe('getCachedVoteStats', () => {
  beforeEach(() => invalidateVoteCaches());
  afterEach(() => vi.restoreAllMocks());

  test('delegates to cache and returns fetched value', async () => {
    const fetchFn = mockStatsFn();
    const result = await getCachedVoteStats(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.get('abc408_d')?.grade).toBe(TaskGrade.Q1);
  });

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockStatsFn();
    await getCachedVoteStats(fetchFn);
    await getCachedVoteStats(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('invalidateVoteCaches', () => {
  beforeEach(() => invalidateVoteCaches());
  afterEach(() => vi.restoreAllMocks());

  test('clears vote stats cache', async () => {
    const fetchFn = mockStatsFn();
    await getCachedVoteStats(fetchFn);
    invalidateVoteCaches();
    await getCachedVoteStats(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
