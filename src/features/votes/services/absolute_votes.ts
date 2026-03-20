import { default as prisma } from '$lib/server/database';
import { TaskGrade, type VoteGrade } from '@prisma/client';
import { sha256 } from '$lib/utils/hash';

export async function upsertVoteGrade(taskId: string, userId: string, grade: string) {
  try {
    const id = await sha256(taskId + userId);
    const newVoteGrade: VoteGrade = {
      id: id,
      userId: userId,
      taskId: taskId,
      grade: grade as TaskGrade,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await prisma.voteGrade.upsert({
      where: {
        userId_taskId: { userId: userId, taskId: taskId },
      },
      update: {
        grade: grade as TaskGrade,
      },
      create: newVoteGrade,
    });
  } catch (error) {
    console.error(
      `Failed to update answer with taskId ${taskId}, userId ${userId}, grade: ${grade}:`,
      error,
    );
    throw error;
  }
}
