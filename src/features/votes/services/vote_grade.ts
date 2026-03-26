import { default as prisma } from '$lib/server/database';
import { TaskGrade } from '@prisma/client';
import { sha256 } from '$lib/utils/hash';
import type { VoteGradeResult } from '$features/votes/types/vote_result';
import { computeMedianGrade } from '$features/votes/utils/median';

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

// Minimum number of votes required to compute and store the median grade.
// Below this threshold the distribution is too sparse to be meaningful.
const MIN_VOTES_FOR_STATISTICS = 3;

// 概念実装（読み込み→処理を同一トランザクション内で行う）
export async function upsertVoteGradeTables(
  userId: string,
  taskId: string,
  grade: TaskGrade,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.voteGrade.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });

    // 冪等性: 既に同じグレードなら何もしない
    if (existing?.grade === grade) {
      return;
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
    if (total < MIN_VOTES_FOR_STATISTICS) {
      return;
    }

    await updateVoteStatistics(tx, taskId, latestCounters);
  });
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
  await tx.votedGradeCounter.update({
    where: { taskId_grade: { taskId, grade: oldGrade } },
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
): Promise<void> {
  const medianGrade = computeMedianGrade(counters);
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
