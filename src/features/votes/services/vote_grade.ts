import { default as prisma } from '$lib/server/database';
import { TaskGrade } from '@prisma/client';
import { sha256 } from '$lib/utils/hash';
import type { VoteGradeResult } from '$features/votes/types/vote_result';
import { computeMedianGrade } from '$features/votes/utils/median';
import {
  MIN_VOTES_FOR_STATISTICS,
  MIN_VOTES_FOR_PROVISIONAL_GRADE,
} from '$features/votes/constants/statistics';
import { invalidateVoteCaches } from '$features/votes/server/cache';

export async function getVoteGrade(userId: string, taskId: string): Promise<VoteGradeResult> {
  const voteRecord = await prisma.voteGrade.findUnique({
    where: {
      userId_taskId: { userId: userId, taskId: taskId },
    },
  });
  let voted = false;
  let grade = null;
  if (voteRecord !== null) {
    voted = true;
    grade = voteRecord.grade;
  }
  return {
    voted: voted,
    grade: grade,
  };
}

// 概念実装（読み込み→処理を同一トランザクション内で行う）
export async function upsertVoteGradeTables(
  userId: string,
  taskId: string,
  grade: TaskGrade,
): Promise<{ success: true }> {
  const isUpdated = await prisma.$transaction(async (tx) => {
    const existing = await tx.voteGrade.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });

    if (existing?.grade === grade) {
      return false;
    }

    if (existing) {
      await decrementOldGradeCounter(tx, taskId, existing.grade);
    }
    await upsertVoteRecord(tx, userId, taskId, grade);
    await incrementNewGradeCounter(tx, taskId, grade);

    const latestCounters = await tx.votedGradeCounter.findMany({
      where: { taskId },
      orderBy: { grade: 'asc' },
    });

    const total = latestCounters.reduce((sum, counter) => sum + counter.count, 0);
    const taskRecord = await tx.task.findUnique({
      where: { task_id: taskId },
      select: { grade: true },
    });
    const minVotes =
      taskRecord?.grade === TaskGrade.PENDING
        ? MIN_VOTES_FOR_PROVISIONAL_GRADE
        : MIN_VOTES_FOR_STATISTICS;
    if (total < minVotes) {
      return true;
    }

    await updateVoteStatistics(tx, taskId, latestCounters, minVotes);

    return true;
  });

  if (isUpdated) {
    invalidateVoteCaches();
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Transaction helpers
// ---------------------------------------------------------------------------

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type GradeCounter = { grade: TaskGrade; count: number };

async function decrementOldGradeCounter(
  tx: TxClient,
  taskId: string,
  oldGrade: TaskGrade,
): Promise<void> {
  // updateMany does not throw if the row is missing (data inconsistency guard).
  // count is also guarded to never go below zero.
  await tx.votedGradeCounter.updateMany({
    where: { taskId, grade: oldGrade, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

async function upsertVoteRecord(
  tx: TxClient,
  userId: string,
  taskId: string,
  grade: TaskGrade,
): Promise<void> {
  const voteId = await sha256(taskId + userId);
  await tx.voteGrade.upsert({
    where: { userId_taskId: { userId, taskId } },
    update: { grade },
    create: { id: voteId, userId, taskId, grade, createdAt: new Date(), updatedAt: new Date() },
  });
}

async function incrementNewGradeCounter(
  tx: TxClient,
  taskId: string,
  grade: TaskGrade,
): Promise<void> {
  const counterId = await sha256(taskId + grade);
  await tx.votedGradeCounter.upsert({
    where: { taskId_grade: { taskId, grade } },
    update: { count: { increment: 1 } },
    create: {
      id: counterId,
      taskId,
      grade,
      count: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function updateVoteStatistics(
  tx: TxClient,
  taskId: string,
  counters: GradeCounter[],
  minVotes: number,
): Promise<void> {
  const medianGrade = computeMedianGrade(counters, minVotes);
  if (medianGrade === null) {
    return;
  }

  const statsId = await sha256(taskId + 'stats');
  await tx.votedGradeStatistics.upsert({
    where: { taskId },
    update: { grade: medianGrade },
    create: {
      id: statsId,
      taskId,
      grade: medianGrade,
      isExperimental: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
