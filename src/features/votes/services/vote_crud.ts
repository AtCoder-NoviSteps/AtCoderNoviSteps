import { default as prisma } from '$lib/server/database';
import { TaskGrade } from '@prisma/client';
import { sha256 } from '$lib/utils/hash';
import { getGradeOrder, taskGradeOrderInfinity } from '$lib/utils/task';

const OrderToTaskGrade: Map<number, TaskGrade> = new Map([
  [1, TaskGrade.Q11],
  [2, TaskGrade.Q10],
  [3, TaskGrade.Q9],
  [4, TaskGrade.Q8],
  [5, TaskGrade.Q7],
  [6, TaskGrade.Q6],
  [7, TaskGrade.Q5],
  [8, TaskGrade.Q4],
  [9, TaskGrade.Q3],
  [10, TaskGrade.Q2],
  [11, TaskGrade.Q1],
  [12, TaskGrade.D1],
  [13, TaskGrade.D2],
  [14, TaskGrade.D3],
  [15, TaskGrade.D4],
  [16, TaskGrade.D5],
  [17, TaskGrade.D6],
  [taskGradeOrderInfinity, TaskGrade.PENDING],
]);

export async function getVoteGrade(userId: string, taskId: string) {
  const res = await prisma.voteGrade.findUnique({
    where: {
      userId_taskId: { userId: userId, taskId: taskId },
    },
  });
  let voted = false;
  let grade = null;
  if (res !== null) {
    voted = true;
    grade = res.grade;
  }
  return {
    voted: voted,
    grade: grade,
  };
}

export async function getVoteGradeStatistics() {
  const all_data = prisma.votedGradeStatistics.findMany();
  const gradesMap = new Map();

  (await all_data).map((data) => {
    gradesMap.set(data.taskId, data);
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
    const counters = await tx.votedGradeCounter.findMany({
      where: { taskId },
      orderBy: { grade: 'asc' },
    });

    const total = counters.reduce((s, c) => s + c.count, 0);
    if (total >= 3) {
      let median = 0;

      const getGradeOrderAtPosition = (target: number): number => {
        let cum = 0;
        for (const c of counters) {
          cum += c.count;
          if (cum >= target) return getGradeOrder(c.grade);
        }
        console.error('範囲外の値にアクセスしました');
        return taskGradeOrderInfinity;
      };

      if (total % 2) {
        const target = Math.ceil(total / 2);
        median = getGradeOrderAtPosition(target);
      } else {
        const target = total / 2;
        median = Math.round(
          (getGradeOrderAtPosition(target) + getGradeOrderAtPosition(target + 1)) / 2,
        );
      }

      let medianGrade: TaskGrade = OrderToTaskGrade.get(median) as TaskGrade;
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
