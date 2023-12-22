//import { answers } from '$lib/server/sample_data';
//import taskAnswerSchema from '$lib/server/taskanswer';

//server/databaseのインポートでは保存がうまくいかず。
//import { PrismaClient } from '@prisma/client';
//import {defineTaskAnswerFactory } from '../../../prisma/.fabbrica';
// import { PrismaClient } from '@prisma/client';
// prisma.taskAnswer.createが実行できれば、defineTaskAnswerFactoryをインポートしなくて済むはずです。
// また、initializeは、内部メソッドを直接インポートすることで対処できそうです。
//import { initialize } from '@quramy/prisma-fabbrica/lib/internal';
///import { defineTaskAnswerFactory } from '../../__generated__/fabbrica';

//import { default as prisma } from '$lib/server/database';
//const prisma = new PrismaClient();
import client from '$lib/server/database';
import type { TaskAnswer } from '@prisma/client';
//initialize({ client });

//あとで入れ替える
export async function getAnswers(user_id: string) {
  const answers_from_db = client.taskAnswer.findMany({
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

export async function getAnswer(task_id: string, user_id: string) {
  const answers_from_db = await client.taskAnswer.findMany({
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

async function sha256(text: string) {
  const uint8 = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', uint8);
  return Array.from(new Uint8Array(digest))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
}

// TODO: createAnswer()
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

  //const taskAnswerFactory = defineTaskAnswerFactory();
  const taskAnswer = await client.taskAnswer.create({
    data: taskanswerInput,
  });
  //const taskAnser = await taskAnswerFactory.create({
  //task_id: answer.task_id,
  //  task: {
  //    connect: { task_id: task_id },
  //  },
  //username: answer.username,
  // user: {
  //    connect: { id: user_id },
  //  },
  //  status: {
  //    connect: { id: status_id },
  //  },
  //});

  return taskAnswer;
}

// TODO: updateAnswer()
// TODO: deleteAnswer()
