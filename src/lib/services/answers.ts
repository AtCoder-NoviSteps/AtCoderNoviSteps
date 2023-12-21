//import { answers } from '$lib/server/sample_data';
//import taskAnswerSchema from '$lib/server/taskanswer';

//server/databaseのインポートでは保存がうまくいかず。
import { PrismaClient } from '@prisma/client';
import { initialize, defineTaskAnswerFactory } from '../server/__generated__/fabbrica';
// import { PrismaClient } from '@prisma/client';
// prisma.taskAnswer.createが実行できれば、defineTaskAnswerFactoryをインポートしなくて済むはずです。
// また、initializeは、内部メソッドを直接インポートすることで対処できそうです。
//import { initialize } from '@quramy/prisma-fabbrica/lib/internal';
///import { defineTaskAnswerFactory } from '../../__generated__/fabbrica';

//import { default as prisma } from '$lib/server/database';
const prisma = new PrismaClient();
initialize({ prisma });

//あとで入れ替える
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
// TODO: createAnswer()
export async function createAnswer(task_id: string, user_id: string, status_id: string) {
  const taskAnswerFactory = defineTaskAnswerFactory();
  const taskAnser = await taskAnswerFactory.create({
    //task_id: answer.task_id,
    task: {
      connect: { task_id: task_id },
    },
    //username: answer.username,
    user: {
      connect: { id: user_id },
    },
    status: {
      connect: { id: status_id },
    },
  });

  return taskAnser;
}

// TODO: updateAnswer()
// TODO: deleteAnswer()
