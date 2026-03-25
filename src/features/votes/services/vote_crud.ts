import { default as prisma } from '$lib/server/database';
import { TaskGrade, type VotedGradeStatistics } from '@prisma/client';
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

export async function getVoteGradeStatistics(): Promise<Map<string, VotedGradeStatistics>> {
  const allStats = await prisma.votedGradeStatistics.findMany();
  const gradesMap = new Map<string, VotedGradeStatistics>();

  allStats.forEach((stat) => {
    gradesMap.set(stat.taskId, stat);
  });
  return gradesMap;
}

export async function getAllTasksWithVoteInfo() {
  const [allTasks, stats, counters] = await Promise.all([
    prisma.task.findMany({ orderBy: { task_id: 'asc' } }),
    prisma.votedGradeStatistics.findMany(),
    prisma.votedGradeCounter.findMany(),
  ]);

  const statsMap = new Map(stats.map((s) => [s.taskId, s]));
  const totalsMap = new Map<string, number>();
  for (const c of counters) {
    totalsMap.set(c.taskId, (totalsMap.get(c.taskId) ?? 0) + c.count);
  }

  return allTasks.map((task) => ({
    task_id: task.task_id,
    contest_id: task.contest_id,
    title: task.title,
    estimatedGrade: statsMap.get(task.task_id)?.grade ?? null,
    voteTotal: totalsMap.get(task.task_id) ?? 0,
  }));
}

export async function getVoteCountersByTaskId(taskId: string) {
  return prisma.votedGradeCounter.findMany({
    where: { taskId },
    orderBy: { grade: 'asc' },
  });
}

/** Fetches all vote counters at once, for use when aggregating across many tasks. */
export async function getAllVoteCounters() {
  return prisma.votedGradeCounter.findMany();
}

export async function getVoteStatsByTaskId(taskId: string) {
  return prisma.votedGradeStatistics.findFirst({ where: { taskId } });
}

export async function getAllVoteStatisticsAsArray() {
  return prisma.votedGradeStatistics.findMany({ orderBy: { taskId: 'asc' } });
}

// 概念実装（読み込み→処理を同一トランザクション内で行う）
export async function upsertVoteGradeTables(userId: string, taskId: string, grade: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.voteGrade.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });

    // 冪等性: 既に同じグレードなら何もしない
    if (existing?.grade === grade) return;

    // old があるならそのカウントをデクリメント
    if (existing) {
      await tx.votedGradeCounter.update({
        where: { taskId_grade: { taskId, grade: existing.grade } },
        data: { count: { decrement: 1 } },
      });
    }

    // vote の upsert
    const voteId = await sha256(taskId + userId);
    await tx.voteGrade.upsert({
      where: { userId_taskId: { userId, taskId } },
      update: { grade: grade as TaskGrade },
      create: {
        id: voteId,
        userId,
        taskId,
        grade: grade as TaskGrade,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // new グレードのカウンタを upsert で increment
    const counterId = await sha256(taskId + grade);
    await tx.votedGradeCounter.upsert({
      where: { taskId_grade: { taskId, grade: grade as TaskGrade } },
      update: { count: { increment: 1 } },
      create: {
        id: counterId,
        taskId,
        grade: grade as TaskGrade,
        count: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Recompute median for this task and update VotedGradeStatistics
    const latestCounters = await tx.votedGradeCounter.findMany({
      where: { taskId },
      orderBy: { grade: 'asc' },
    });

    const medianGrade = computeMedianGrade(latestCounters);
    if (medianGrade !== null) {
      const statsId = await sha256(taskId + 'stats');

      await tx.votedGradeStatistics.upsert({
        where: { taskId: taskId },
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
  });
}
