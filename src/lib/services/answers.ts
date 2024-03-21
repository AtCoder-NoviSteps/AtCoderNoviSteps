import { initialize } from '@quramy/prisma-fabbrica/lib/internal';

import { default as prisma } from '$lib/server/database';

import type { TaskAnswer } from '@prisma/client';
import type * as answer from '$lib/types/answer';
import type { Task } from '$lib/types/task';
import type { UserSubmissionsAPI } from '$lib/types/apidata';

import * as atCoderProblemsService from '$lib/services/problemsApiService';
import { getSubmissionStatusMapWithName } from '$lib/services/submission_status';
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

export async function extractUnregisteredAnswersFromSubmissionsAPI(
  atcoderUsername: string,
  startTimeInUnixSecond: number,
  unansweredTasks: Map<string, Task>,
  userId: string,
): Promise<Map<string, answer.TaskAnswer>> {
  const submissions = await atCoderProblemsService.getUserSubmissions(
    atcoderUsername,
    startTimeInUnixSecond,
  );
  // 同じ問題で複数の提出がある場合は、最新の提出(AC もしくは WA)のみ抽出するため
  submissions.sort(compareByEpochSecond);

  const submissionStatus = await getSubmissionStatusMapWithName();

  const fetchedTaskAnswers: Map<string, answer.TaskAnswer> = new Map();
  submissions.map((submission: UserSubmissionsAPI) => {
    const taskId: string = submission.problem_id;
    const submissionResult: string = submission.result.toLocaleLowerCase();
    const isAcOrWa: boolean = unansweredTasks.has(taskId) && submissionStatus.has(submissionResult);

    if (isAcOrWa) {
      const status = submissionStatus.get(submissionResult);
      const taskAnswerForImport: answer.TaskAnswer = {
        task_id: taskId,
        user_id: userId,
        status_id: status.id,
      };
      fetchedTaskAnswers.set(taskId, taskAnswerForImport);
    }
  });

  return fetchedTaskAnswers;
}

// See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
function compareByEpochSecond(first: UserSubmissionsAPI, second: UserSubmissionsAPI) {
  return first.epoch_second - second.epoch_second;
}
