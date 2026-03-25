import { describe, test, expect, vi, beforeEach } from 'vitest';

import { TaskGrade } from '@prisma/client';

import { getVoteGrade, upsertVoteGradeTables } from './vote_grade';

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
      upsert: vi.fn(),
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

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockVoteGradeFindUnique(value: PrismaVoteGrade) {
  vi.mocked(prisma.voteGrade.findUnique).mockResolvedValue(value);
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
