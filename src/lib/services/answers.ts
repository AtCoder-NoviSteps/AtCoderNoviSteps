import { initialize } from '@quramy/prisma-fabbrica/lib/internal';

import { default as prisma } from '$lib/server/database';
import type { TaskAnswer } from '@prisma/client';
import { sha256 } from '$lib/utils/hash';

initialize({ prisma });

export async function getAnswers(user_id: string) {
  const answers_from_db = prisma.taskAnswer.findMany({
    where: {
      user_id: user_id,
    },
  });
  const answersMap = new Map();

  (await answers_from_db).map((answer) => {
    answersMap.set(answer.task_id, answer);
  });
  return answersMap;
}

/**
 * Fetches task answers for a specific user and a list of selected task IDs.
 *
 * @param selectedTaskIds - An array of task IDs to filter the answers.
 * @param userId - The ID of the user whose answers are to be fetched.
 *
 * @returns A promise that resolves to an array of TaskAnswer objects.
 * @note conditions: task_id IN (...) AND user_id = userId
 */
export async function getAnswersWithSelectedTaskIds(selectedTaskIds: string[], userId: string) {
  return await prisma.taskAnswer.findMany({
    where: {
      task_id: { in: selectedTaskIds },
      user_id: userId,
    },
    select: {
      task_id: true,
      user_id: true,
      status_id: true,
    },
  });
}

export async function getAnswersOrderedByUpdatedDesc(user_id: string): Promise<TaskAnswer[]> {
  const answers_from_db = await prisma.taskAnswer.findMany({
    where: {
      user_id: { equals: user_id },
    },
    orderBy: {
      updated_at: 'desc',
    },
    take: -1, // Reverse the list
    include: {
      task: true,
    },
  });

  return answers_from_db;
}

export async function getAnswer(task_id: string, user_id: string) {
  const answers_from_db = await prisma.taskAnswer.findMany({
    where: {
      AND: [{ task_id: task_id }, { user_id: user_id }],
    },
  });

  if (answers_from_db.length === 0) {
    //TODO デフォルトはNosub?
    return null;
  }
  return answers_from_db[0];
}

export async function createAnswer(task_id: string, user_id: string, status_id: string) {
  const id = await sha256(task_id + user_id);
  const taskanswerInput: TaskAnswer = {
    id: id,
    task_id: task_id,
    user_id: user_id,
    status_id: status_id,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const taskAnswer = await prisma.taskAnswer.create({
    data: taskanswerInput,
  });

  return taskAnswer;
}

export async function upsertAnswer(taskId: string, userId: string, statusId: string) {
  try {
    const id = await sha256(taskId + userId);
    const newAnswer = {
      id: id,
      task_id: taskId,
      user_id: userId,
      status_id: statusId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await prisma.taskAnswer.upsert({
      where: {
        task_id_user_id: { task_id: taskId, user_id: userId },
      },
      update: {
        status_id: statusId,
      },
      create: newAnswer, // await createAnswer(taskId, userId, statusId)とすると、一意制約違反(P2002)が発生するため
    });
  } catch (error) {
    console.error(
      `Failed to update answer with taskId ${taskId}, userId ${userId}, statusId: ${statusId}:`,
      error,
    );
    throw error;
  }
}

// TODO: updateAnswer()
// TODO: deleteAnswer()
