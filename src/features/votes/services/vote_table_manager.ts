import { default as prisma } from '$lib/server/database';
import { TaskGrade, type VoteGrade } from '@prisma/client';
import { sha256 } from '$lib/utils/hash';

export async function getVoteGrade(userId: string, taskId: string) {
  const res = await prisma.voteGrade.findUnique({
    where: {
      userId_taskId: { userId: userId, taskId: taskId },
    },
  });
  let voted = false;
  let grade = null;
  if(res !== null){
    voted = true;
    grade = res.grade;
  }
  return {
    voted: voted,
    grade: grade,
  };
}

export async function upsertVoteGrade(userId: string, taskId: string, grade: string) {
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
