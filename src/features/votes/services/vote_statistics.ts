import { default as prisma } from '$lib/server/database';
import type { VotedGradeStatistics, VotedGradeCounter, TaskGrade } from '@prisma/client';

/** A task row enriched with estimated grade and total vote count. */
export type TaskWithVoteInfo = {
  task_id: string;
  contest_id: string;
  title: string;
  /** The confirmed grade stored in the DB. PENDING means not yet confirmed by admin. */
  grade: TaskGrade;
  estimatedGrade: TaskGrade | null;
  voteTotal: number;
};

export async function getVoteGradeStatistics(): Promise<Map<string, VotedGradeStatistics>> {
  const allStats = await prisma.votedGradeStatistics.findMany();
  const gradesMap = new Map<string, VotedGradeStatistics>();

  allStats.forEach((stat) => {
    gradesMap.set(stat.taskId, stat);
  });
  return gradesMap;
}

export async function getAllTasksWithVoteInfo(): Promise<TaskWithVoteInfo[]> {
  const [allTasks, stats, counters] = await Promise.all([
    prisma.task.findMany({ orderBy: { task_id: 'desc' } }),
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
    grade: task.grade,
    estimatedGrade: statsMap.get(task.task_id)?.grade ?? null,
    voteTotal: totalsMap.get(task.task_id) ?? 0,
  }));
}

export async function getVoteCountersByTaskId(taskId: string): Promise<VotedGradeCounter[]> {
  return prisma.votedGradeCounter.findMany({
    where: { taskId },
    orderBy: { grade: 'asc' },
  });
}

/** Fetches all vote counters at once, for use when aggregating across many tasks. */
export async function getAllVoteCounters(): Promise<VotedGradeCounter[]> {
  return prisma.votedGradeCounter.findMany();
}

export async function getVoteStatsByTaskId(taskId: string): Promise<VotedGradeStatistics | null> {
  return prisma.votedGradeStatistics.findFirst({ where: { taskId } });
}

export async function getAllVoteStatisticsAsArray(): Promise<VotedGradeStatistics[]> {
  return prisma.votedGradeStatistics.findMany({ orderBy: { taskId: 'asc' } });
}
