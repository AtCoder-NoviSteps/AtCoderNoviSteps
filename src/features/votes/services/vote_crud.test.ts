import { describe, test, expect, vi, beforeEach } from 'vitest';

import { TaskGrade } from '@prisma/client';

import {
  getVoteGrade,
  getVoteGradeStatistics,
  getAllTasksWithVoteInfo,
  getVoteCountersByTaskId,
  getVoteStatsByTaskId,
  getAllVoteStatisticsAsArray,
  getAllVoteCounters,
  upsertVoteGradeTables,
} from './vote_crud';

vi.mock('$lib/server/database', () => ({
  default: {
    voteGrade: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    votedGradeCounter: {
      findMany: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    votedGradeStatistics: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from '$lib/server/database';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Type aliases
// ---------------------------------------------------------------------------

type PrismaVoteGrade = Awaited<ReturnType<typeof prisma.voteGrade.findUnique>>;
type PrismaVotedGradeStatistics = Awaited<
  ReturnType<typeof prisma.votedGradeStatistics.findMany>
>[number];
type PrismaVotedGradeCounter = Awaited<
  ReturnType<typeof prisma.votedGradeCounter.findMany>
>[number];

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockVoteGradeFindUnique(value: PrismaVoteGrade) {
  vi.mocked(prisma.voteGrade.findUnique).mockResolvedValue(value);
}

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

/** Creates a mock transaction client and wires prisma.$transaction to execute the callback with it. */
function setupTransaction() {
  const mockTx = {
    voteGrade: { findUnique: vi.fn(), upsert: vi.fn() },
    votedGradeCounter: { update: vi.fn(), upsert: vi.fn(), findMany: vi.fn() },
    votedGradeStatistics: { upsert: vi.fn() },
  };
  vi.mocked(prisma.$transaction).mockImplementation(async (callback: unknown) =>
    (callback as (tx: typeof mockTx) => Promise<unknown>)(mockTx),
  );
  return mockTx;
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

describe('getVoteGrade', () => {
  test('returns voted: false and grade: null when no vote record exists', async () => {
    mockVoteGradeFindUnique(null);

    const result = await getVoteGrade('user-1', 'abc001_a');

    expect(result).toEqual({ voted: false, grade: null });
  });

  test('returns voted: true and the stored grade when a vote record exists', async () => {
    mockVoteGradeFindUnique({
      id: 'vote-1',
      userId: 'user-1',
      taskId: 'abc001_a',
      grade: TaskGrade.Q5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getVoteGrade('user-1', 'abc001_a');

    expect(result).toEqual({ voted: true, grade: TaskGrade.Q5 });
  });

  test('queries with the correct userId and taskId', async () => {
    mockVoteGradeFindUnique(null);

    await getVoteGrade('user-42', 'abc123_d');

    expect(prisma.voteGrade.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_taskId: { userId: 'user-42', taskId: 'abc123_d' } },
      }),
    );
  });
});

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
      { task_id: 'abc001_a', contest_id: 'abc001', title: 'Problem A', grade: TaskGrade.PENDING },
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
      { task_id: 'abc001_a', contest_id: 'abc001', title: 'Problem A', grade: TaskGrade.PENDING },
    ]);
    mockVotedGradeStatisticsFindMany([]);
    mockVotedGradeCounterFindMany([]);

    const result = await getAllTasksWithVoteInfo();

    expect(result[0].estimatedGrade).toBeNull();
  });

  test('aggregates voteTotal across all grade counters for the task', async () => {
    mockTaskFindMany([
      { task_id: 'abc001_a', contest_id: 'abc001', title: 'Problem A', grade: TaskGrade.PENDING },
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
      { task_id: 'abc001_a', contest_id: 'abc001', title: 'Problem A', grade: TaskGrade.PENDING },
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

describe('upsertVoteGradeTables', () => {
  test('exits early without any writes when vote grade is unchanged (idempotency)', async () => {
    const tx = setupTransaction();
    tx.voteGrade.findUnique.mockResolvedValue({ grade: TaskGrade.Q5 });

    await upsertVoteGradeTables('user-1', 'abc001_a', TaskGrade.Q5);

    expect(tx.votedGradeCounter.update).not.toHaveBeenCalled();
    expect(tx.voteGrade.upsert).not.toHaveBeenCalled();
    expect(tx.votedGradeCounter.upsert).not.toHaveBeenCalled();
  });

  test('decrements the old grade counter when the user changes their vote', async () => {
    const tx = setupTransaction();
    tx.voteGrade.findUnique.mockResolvedValue({ grade: TaskGrade.Q4 });
    tx.voteGrade.upsert.mockResolvedValue({});
    tx.votedGradeCounter.upsert.mockResolvedValue({});
    tx.votedGradeCounter.findMany.mockResolvedValue([
      { grade: TaskGrade.Q5, count: 1 },
      { grade: TaskGrade.Q4, count: 0 },
    ]);

    await upsertVoteGradeTables('user-1', 'abc001_a', TaskGrade.Q5);

    expect(tx.votedGradeCounter.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { taskId_grade: { taskId: 'abc001_a', grade: TaskGrade.Q4 } },
        data: { count: { decrement: 1 } },
      }),
    );
  });

  test('upserts VoteGrade and increments counter for the new grade', async () => {
    const tx = setupTransaction();
    tx.voteGrade.findUnique.mockResolvedValue(null);
    tx.voteGrade.upsert.mockResolvedValue({});
    tx.votedGradeCounter.upsert.mockResolvedValue({});
    tx.votedGradeCounter.findMany.mockResolvedValue([{ grade: TaskGrade.Q5, count: 1 }]);

    await upsertVoteGradeTables('user-1', 'abc001_a', TaskGrade.Q5);

    expect(tx.voteGrade.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_taskId: { userId: 'user-1', taskId: 'abc001_a' } },
        update: { grade: TaskGrade.Q5 },
      }),
    );
    expect(tx.votedGradeCounter.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { taskId_grade: { taskId: 'abc001_a', grade: TaskGrade.Q5 } },
        update: { count: { increment: 1 } },
      }),
    );
  });

  test('upserts VotedGradeStatistics when total votes reaches 3', async () => {
    const tx = setupTransaction();
    tx.voteGrade.findUnique.mockResolvedValue(null);
    tx.voteGrade.upsert.mockResolvedValue({});
    tx.votedGradeCounter.upsert.mockResolvedValue({});
    // 3 votes all on Q5 → median = Q5
    tx.votedGradeCounter.findMany.mockResolvedValue([{ grade: TaskGrade.Q5, count: 3 }]);
    tx.votedGradeStatistics.upsert.mockResolvedValue({});

    await upsertVoteGradeTables('user-1', 'abc001_a', TaskGrade.Q5);

    expect(tx.votedGradeStatistics.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { taskId: 'abc001_a' },
        update: { grade: TaskGrade.Q5 },
      }),
    );
  });

  test('does not upsert VotedGradeStatistics when total votes is below 3', async () => {
    const tx = setupTransaction();
    tx.voteGrade.findUnique.mockResolvedValue(null);
    tx.voteGrade.upsert.mockResolvedValue({});
    tx.votedGradeCounter.upsert.mockResolvedValue({});
    tx.votedGradeCounter.findMany.mockResolvedValue([{ grade: TaskGrade.Q5, count: 2 }]);

    await upsertVoteGradeTables('user-1', 'abc001_a', TaskGrade.Q5);

    expect(tx.votedGradeStatistics.upsert).not.toHaveBeenCalled();
  });
});
