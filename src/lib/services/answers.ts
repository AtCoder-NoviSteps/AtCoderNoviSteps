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

// TODO: updateAnswer()
// TODO: deleteAnswer()
