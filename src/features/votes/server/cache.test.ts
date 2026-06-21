import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';

import type { VotedGradeStatistics } from '@prisma/client';
import { TaskGrade } from '$lib/types/task';
import type { TaskWithVoteInfo } from '$features/votes/services/vote_statistics';
import {
  getCachedVoteStats,
  getCachedAllTasksWithVoteInfo,
  invalidateVoteCaches,
  disposeVoteCaches,
} from './cache';

const makeTasksWithVoteInfo = (): TaskWithVoteInfo[] => [
  {
    task_id: 'abc408_d',
    contest_id: 'abc408',
    title: 'D - Flip Cards',
    grade: TaskGrade.PENDING,
    task_table_index: 'D',
    estimatedGrade: TaskGrade.Q1,
    voteTotal: 12,
  },
];
const mockTasksFn = () => vi.fn().mockResolvedValue(makeTasksWithVoteInfo());

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

describe('getCachedAllTasksWithVoteInfo', () => {
  beforeEach(() => invalidateVoteCaches());
  afterEach(() => vi.restoreAllMocks());

  test('delegates to fetchFn and returns fetched value', async () => {
    const fetchFn = mockTasksFn();
    const result = await getCachedAllTasksWithVoteInfo(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result[0].task_id).toBe('abc408_d');
    expect(result[0].voteTotal).toBe(12);
  });

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockTasksFn();
    await getCachedAllTasksWithVoteInfo(fetchFn);
    await getCachedAllTasksWithVoteInfo(fetchFn);
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

  test('clears all tasks with vote info cache', async () => {
    const fetchFn = mockTasksFn();
    await getCachedAllTasksWithVoteInfo(fetchFn);
    invalidateVoteCaches();
    await getCachedAllTasksWithVoteInfo(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
