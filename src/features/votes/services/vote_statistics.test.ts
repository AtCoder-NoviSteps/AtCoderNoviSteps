import { describe, test, expect, vi, beforeEach } from 'vitest';

import { TaskGrade } from '@prisma/client';

import {
  getVoteGradeStatistics,
  getAllTasksWithVoteInfo,
  getVoteCountersByTaskId,
  getVoteStatsByTaskId,
  getAllVoteStatisticsAsArray,
  getAllVoteCounters,
} from './vote_statistics';

vi.mock('$lib/server/database', () => ({
  default: {
    voteGrade: {
      findUnique: vi.fn(),
    },
    votedGradeCounter: {
      findMany: vi.fn(),
    },
    votedGradeStatistics: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from '$lib/server/database';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Type aliases
// ---------------------------------------------------------------------------

type PrismaVotedGradeStatistics = Awaited<
  ReturnType<typeof prisma.votedGradeStatistics.findMany>
>[number];
type PrismaVotedGradeCounter = Awaited<
  ReturnType<typeof prisma.votedGradeCounter.findMany>
>[number];

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockVotedGradeStatisticsFindMany(value: PrismaVotedGradeStatistics[]) {
  vi.mocked(prisma.votedGradeStatistics.findMany).mockResolvedValue(
    value as unknown as Awaited<ReturnType<typeof prisma.votedGradeStatistics.findMany>>,
  );
}

function mockVotedGradeCounterFindMany(value: PrismaVotedGradeCounter[]) {
  vi.mocked(prisma.votedGradeCounter.findMany).mockResolvedValue(
    value as unknown as Awaited<ReturnType<typeof prisma.votedGradeCounter.findMany>>,
  );
}

function mockTaskFindMany(value: object[]) {
  vi.mocked(prisma.task.findMany).mockResolvedValue(
    value as unknown as Awaited<ReturnType<typeof prisma.task.findMany>>,
  );
}

function makeStatisticsRecord(
  overrides: Partial<PrismaVotedGradeStatistics> = {},
): PrismaVotedGradeStatistics {
  return {
    id: 'stats-abc001_a',
    taskId: 'abc001_a',
    grade: TaskGrade.Q5,
    isExperimental: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as PrismaVotedGradeStatistics;
}

function makeCounterRecord(
  overrides: Partial<PrismaVotedGradeCounter> = {},
): PrismaVotedGradeCounter {
  return {
    id: 'counter-abc001_a-Q5',
    taskId: 'abc001_a',
    grade: TaskGrade.Q5,
    count: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as PrismaVotedGradeCounter;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getVoteGradeStatistics', () => {
  test('returns an empty Map when no statistics exist', async () => {
    mockVotedGradeStatisticsFindMany([]);

    const result = await getVoteGradeStatistics();

    expect(result.size).toBe(0);
  });

  test('maps each taskId to its statistics record', async () => {
    const stat = makeStatisticsRecord({ taskId: 'abc001_a', grade: TaskGrade.Q5 });
    mockVotedGradeStatisticsFindMany([stat]);

    const result = await getVoteGradeStatistics();

    expect(result.get('abc001_a')?.grade).toBe(TaskGrade.Q5);
  });

  test('builds a Map entry per statistics record', async () => {
    const records = [
      makeStatisticsRecord({ taskId: 'abc001_a', grade: TaskGrade.Q5 }),
      makeStatisticsRecord({ id: 'stats-abc002_a', taskId: 'abc002_a', grade: TaskGrade.D1 }),
    ];
    mockVotedGradeStatisticsFindMany(records);

    const result = await getVoteGradeStatistics();

    expect(result.size).toBe(2);
    expect(result.get('abc002_a')?.grade).toBe(TaskGrade.D1);
  });
});

describe('getAllTasksWithVoteInfo', () => {
  test('attaches estimatedGrade from statistics when available', async () => {
    mockTaskFindMany([
      {
        task_id: 'abc001_a',
        contest_id: 'abc001',
        title: 'Problem A',
        grade: TaskGrade.PENDING,
        task_table_index: 'A',
      },
    ]);
    mockVotedGradeStatisticsFindMany([
      makeStatisticsRecord({ taskId: 'abc001_a', grade: TaskGrade.Q5 }),
    ]);
    mockVotedGradeCounterFindMany([]);

    const result = await getAllTasksWithVoteInfo();

    expect(result[0].estimatedGrade).toBe(TaskGrade.Q5);
  });

  test('returns null estimatedGrade when no statistics exist for the task', async () => {
    mockTaskFindMany([
      {
        task_id: 'abc001_a',
        contest_id: 'abc001',
        title: 'Problem A',
        grade: TaskGrade.PENDING,
        task_table_index: 'A',
      },
    ]);
    mockVotedGradeStatisticsFindMany([]);
    mockVotedGradeCounterFindMany([]);

    const result = await getAllTasksWithVoteInfo();

    expect(result[0].estimatedGrade).toBeNull();
  });

  test('includes the confirmed grade and task_table_index from the task record', async () => {
    mockTaskFindMany([
      {
        task_id: 'abc001_a',
        contest_id: 'abc001',
        title: 'Problem A',
        grade: TaskGrade.Q5,
        task_table_index: 'A',
      },
    ]);
    mockVotedGradeStatisticsFindMany([]);
    mockVotedGradeCounterFindMany([]);

    const result = await getAllTasksWithVoteInfo();

    expect(result[0].grade).toBe(TaskGrade.Q5);
    expect(result[0].task_table_index).toBe('A');
  });

  test('aggregates voteTotal across all grade counters for the task', async () => {
    mockTaskFindMany([
      {
        task_id: 'abc001_a',
        contest_id: 'abc001',
        title: 'Problem A',
        grade: TaskGrade.PENDING,
        task_table_index: 'A',
      },
    ]);
    mockVotedGradeStatisticsFindMany([]);
    mockVotedGradeCounterFindMany([
      makeCounterRecord({ taskId: 'abc001_a', grade: TaskGrade.Q5, count: 2 }),
      makeCounterRecord({ id: 'c2', taskId: 'abc001_a', grade: TaskGrade.Q4, count: 3 }),
    ]);

    const result = await getAllTasksWithVoteInfo();

    expect(result[0].voteTotal).toBe(5);
  });

  test('returns 0 voteTotal when no counters exist for the task', async () => {
    mockTaskFindMany([
      {
        task_id: 'abc001_a',
        contest_id: 'abc001',
        title: 'Problem A',
        grade: TaskGrade.PENDING,
        task_table_index: 'A',
      },
    ]);
    mockVotedGradeStatisticsFindMany([]);
    mockVotedGradeCounterFindMany([]);

    const result = await getAllTasksWithVoteInfo();

    expect(result[0].voteTotal).toBe(0);
  });
});

describe('getVoteCountersByTaskId', () => {
  test('queries with the correct taskId filter and grade ascending order', async () => {
    mockVotedGradeCounterFindMany([]);

    await getVoteCountersByTaskId('abc001_a');

    expect(prisma.votedGradeCounter.findMany).toHaveBeenCalledWith({
      where: { taskId: 'abc001_a' },
      orderBy: { grade: 'asc' },
    });
  });
});

describe('getVoteStatsByTaskId', () => {
  test('queries with the correct taskId filter', async () => {
    vi.mocked(prisma.votedGradeStatistics.findFirst).mockResolvedValue(
      makeStatisticsRecord() as unknown as Awaited<
        ReturnType<typeof prisma.votedGradeStatistics.findFirst>
      >,
    );

    await getVoteStatsByTaskId('abc001_a');

    expect(prisma.votedGradeStatistics.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { taskId: 'abc001_a' } }),
    );
  });

  test('returns null when no statistics exist for the task', async () => {
    vi.mocked(prisma.votedGradeStatistics.findFirst).mockResolvedValue(null);

    const result = await getVoteStatsByTaskId('abc001_a');

    expect(result).toBeNull();
  });
});

describe('getAllVoteStatisticsAsArray', () => {
  test('queries with taskId ascending order', async () => {
    mockVotedGradeStatisticsFindMany([]);

    await getAllVoteStatisticsAsArray();

    expect(prisma.votedGradeStatistics.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { taskId: 'asc' } }),
    );
  });
});

describe('getAllVoteCounters', () => {
  test('returns all vote counters without filters', async () => {
    const counters = [makeCounterRecord(), makeCounterRecord({ id: 'c2', taskId: 'abc002_a' })];
    mockVotedGradeCounterFindMany(counters);

    const result = await getAllVoteCounters();

    expect(result).toHaveLength(2);
    expect(prisma.votedGradeCounter.findMany).toHaveBeenCalledWith();
  });
});
