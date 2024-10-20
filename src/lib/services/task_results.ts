import { error } from '@sveltejs/kit';

import { default as db } from '$lib/server/database';
import { getTasks, getTask } from '$lib/services/tasks';
import { getUser } from '$lib/services/users';
import * as answer_crud from '$lib/services/answers';
import { isAdmin } from '$lib/utils/authorship';

import type { TaskAnswer } from '$lib/types/answer';
import type { Task } from '$lib/types/task';
import type { TaskResult, TaskResults, Tasks } from '$lib/types/task';
import type { WorkBookTaskBase, WorkBookTasksBase } from '$lib/types/workbook';
import type { FloatingMessage, FloatingMessages } from '$lib/types/floating_message';

import { NOT_FOUND } from '$lib/constants/http-response-status-codes';
import { getSubmissionStatusMapWithId, getSubmissionStatusMapWithName } from './submission_status';
import type { User } from '@prisma/client';
import type { Roles } from '../types/user';

// DBから取得した問題一覧とログインしているユーザの回答を紐付けしたデータ保持
const statusById = await getSubmissionStatusMapWithId();
const statusByName = await getSubmissionStatusMapWithName();

export async function getTaskResults(userId: string): Promise<TaskResults> {
  // 問題一覧と特定のユーザの回答状況を使ってデータを結合
  // 計算量: 問題数をN、特定のユーザの解答数をMとすると、O(N + M)になるはず。
  const tasks = await getTasks();
  const answers = await answer_crud.getAnswers(userId);

  return await relateTasksAndAnswers(userId, tasks, answers);
}

export async function copyTaskResults(
  sourceUserName: string,
  destinationUserName: string,
): Promise<FloatingMessage[]> {
  const messages: FloatingMessage[] = [];

  try {
    await db.$transaction(async () => {
      await transferAnswers(sourceUserName, destinationUserName, messages);
    });

    return messages;
  } catch (error) {
    console.error(`Failed to copy task results:`, error);

    const failureMessage = { message: 'コピーが失敗しました', status: false };
    messages.push(failureMessage);

    return messages;
  }
}

async function transferAnswers(
  sourceUserName: string,
  destinationUserName: string,
  messages: FloatingMessages,
) {
  const sourceUser: User | null = await getUser(sourceUserName);
  const destinationUser: User | null = await getUser(destinationUserName);

  if (
    !isExistingUser(sourceUserName, sourceUser, messages) ||
    !isExistingUser(destinationUserName, destinationUser, messages)
  ) {
    throw new Error(`Not found user(s) for ${sourceUserName} and/or ${destinationUserName}`);
  }

  if (sourceUser && destinationUser) {
    const isValidatedSourceUser = await validateUserAndAnswers(sourceUser, true, messages);
    const isValidatedDestinationUser = await validateUserAndAnswers(
      destinationUser,
      false,
      messages,
    );

    if (!isValidatedSourceUser || !isValidatedDestinationUser) {
      throw new Error(
        `Failed to validate user(s) for ${sourceUserName}: ${isValidatedSourceUser} and/or ${destinationUserName}: ${isValidatedDestinationUser}`,
      );
    }

    const sourceAnswers = await answer_crud.getAnswers(sourceUser.id);

    for (const taskResult of sourceAnswers.values()) {
      await answer_crud.upsertAnswer(taskResult.task_id, destinationUser.id, taskResult.status_id);
    }

    messages.push({ message: 'コピーが正常に完了しました', status: true });
  }
}

export async function validateUserAndAnswers(
  user: User,
  expectedToHaveAnswers: boolean,
  messages: FloatingMessage[],
) {
  if (isAdminUser(user, messages)) {
    return false;
  }

  const answers = await answer_crud.getAnswers(user.id);

  if (expectedToHaveAnswers) {
    return existsUserAnswers(user, answers, expectedToHaveAnswers, messages);
  } else {
    return !existsUserAnswers(user, answers, expectedToHaveAnswers, messages);
  }
}

export function isExistingUser(
  userName: string,
  user: User | null,
  messages: FloatingMessage[],
): boolean {
  if (user === null) {
    messages.push({
      message: `${userName} が存在しません。コピーを中止します`,
      status: false,
    });
    return false;
  } else {
    messages.push({ message: `${userName} が存在することを確認しました`, status: true });
    return true;
  }
}

export function isAdminUser(user: User | null, messages: FloatingMessage[]): boolean {
  if (user === null) {
    return false;
  }

  if (user.role && isAdmin(user.role as Roles)) {
    messages.push({
      message: `${user.username} は管理者権限をもっているためコピーできません。コピーを中止します`,
      status: false,
    });

    return true;
  }

  return false;
}

export function existsUserAnswers(
  user: User,
  answers: Map<string, TaskResult>,
  expectedToHaveAnswers: boolean,
  messages: FloatingMessage[],
): boolean {
  const hasAnswers = answers.size > 0;

  if (hasAnswers !== expectedToHaveAnswers) {
    messages.push({
      message: expectedToHaveAnswers
        ? `${user.username} にコピー対象のデータがありません。コピーを中止します`
        : `${user.username} にすでにデータがあります。コピーを中止します`,
      status: false,
    });

    return !expectedToHaveAnswers;
  }

  return expectedToHaveAnswers;
}

async function relateTasksAndAnswers(
  userId: string,
  tasks: Tasks,
  answers: Map<string, TaskAnswer>,
): Promise<TaskResults> {
  // TODO: 汎用メソッドとして切り出す
  const isLoggedIn = userId !== undefined;

  const taskResults = tasks.map((task: Task) => {
    const taskResult = createDefaultTaskResult(userId, task);

    if (isLoggedIn && answers.has(task.task_id)) {
      const answer = answers.get(task.task_id);
      const status = statusById.get(answer?.status_id);
      taskResult.status_name = status.status_name;
      taskResult.submission_status_image_path = status.image_path;
      taskResult.submission_status_label_name = status.label_name;
      taskResult.is_ac = status.is_ac;
    }

    return taskResult;
  });

  return taskResults;
}

// Note: 問題集の一覧（ユーザの回答を含む）を参照するときに使用する。
//       with_mapをtrueにすると、taskIdを使って各TaskResultにO(1)でアクセスできる。
// Why : データ総量を抑えるため。
export async function getTaskResultsOnlyResultExists(
  userId: string,
  with_map: boolean = false,
): Promise<TaskResults | Map<string, TaskResult>> {
  const taskResultsMap: Map<string, TaskResult> = new Map();

  // TODO: answerの降順にしたい
  const tasks = await getTasks();
  const answers = await answer_crud.getAnswers(userId);
  const tasksHasAnswer = tasks.filter((task) => answers.has(task.task_id));
  const taskResultsWithAnswer = tasksHasAnswer.map((task: Task) => {
    const taskResult = createDefaultTaskResult(userId, task);

    const answer = answers.get(task.task_id);
    const status = statusById.get(answer.status_id);
    taskResult.status_name = status.status_name;
    taskResult.submission_status_image_path = status.image_path;
    taskResult.submission_status_label_name = status.label_name;
    taskResult.is_ac = status.is_ac;
    taskResult.updated_at = answer.updated_at;

    // Note: 上記の高速化のための前処理で必要
    taskResultsMap.set(task.task_id, taskResult);

    return taskResult;
  });

  if (with_map) {
    return taskResultsMap;
  } else {
    return taskResultsWithAnswer;
  }
}

// Note: 個別の問題集を参照するときのみ使用する。
// Why : 未回答の問題も含めて取得するため、データ総量を抑えるためにも問題集の一覧（ユーザの回答を含む）を参照するときは上記のメソッドを使用する。
export async function getTaskResultsByTaskId(
  workBookTasks: WorkBookTasksBase,
  userId: string,
): Promise<Map<string, TaskResult>> {
  const taskResultsWithTaskId = workBookTasks.map((workBookTask: WorkBookTaskBase) =>
    getTaskResultWithErrorHandling(workBookTask.taskId, userId).then((taskResult: TaskResult) => ({
      taskId: workBookTask.taskId,
      taskResult: taskResult,
    })),
  );

  const taskResultsMap = (await Promise.all(taskResultsWithTaskId)).reduce(
    (map, { taskId, taskResult }: { taskId: string; taskResult: TaskResult }) =>
      map.set(taskId, taskResult),
    new Map<string, TaskResult>(),
  );

  return taskResultsMap;
}

async function getTaskResultWithErrorHandling(taskId: string, userId: string): Promise<TaskResult> {
  try {
    return await getTaskResult(taskId, userId);
  } catch (error) {
    console.error(`Failed to get task result for taskId ${taskId}:`, error);
    return await handleTaskResultError(taskId, userId);
  }
}

async function handleTaskResultError(taskId: string, userId: string): Promise<TaskResult> {
  try {
    const task: Tasks = await getTask(taskId);
    return await createDefaultTaskResult(userId, task[0]);
  } catch (innerError) {
    console.error(`Failed to create a default task result for taskId ${taskId}:`, innerError);
    throw new Error(`問題id: ${taskId} の作成に失敗しました。`);
  }
}

export function createDefaultTaskResult(userId: string, task: Task): TaskResult {
  const taskResult: TaskResult = {
    contest_id: task.contest_id,
    task_id: task.task_id,
    title: task.title,
    grade: task.grade,
    user_id: userId,
    task_table_index: task.task_table_index,
    status_id: '4',
    status_name: 'ns', // FIXME: Use const
    submission_status_image_path: 'ns.png',
    submission_status_label_name: '未挑戦',
    is_ac: false,
    updated_at: new Date(),
  };

  return taskResult;
}

export async function getTaskResult(slug: string, userId: string) {
  const task = await getTask(slug);

  if (!task || task.length === 0) {
    error(NOT_FOUND, `問題 ${slug} は見つかりませんでした。`);
  }

  const taskResult = createDefaultTaskResult(userId, task[0]);
  const taskanswer: TaskAnswer | null = await answer_crud.getAnswer(slug, userId);

  if (!taskanswer) {
    return taskResult;
  }

  const status = statusById.get(taskanswer.status_id);
  taskResult.status_id = status.id;
  taskResult.status_name = status.status_name;
  taskResult.submission_status_image_path = status.image_path;
  taskResult.submission_status_label_name = status.label_name;
  taskResult.is_ac = status.is_ac;
  taskResult.user_id = userId;

  return taskResult;
}

export async function updateTaskResult(taskId: string, submissionStatus: string, userId: string) {
  const taskResult: TaskResult | null = await getTaskResult(taskId, userId);

  if (!taskResult) {
    console.error(`Failed to get task result for taskId ${taskId} and userId ${userId}`);
    return;
  }

  const statusId = statusByName.get(submissionStatus).id;

  await db.$transaction(async () => {
    await answer_crud.upsertAnswer(taskId, userId, statusId);
  });
}

export async function getTasksWithTagIds(
  tagIds_string: string,
  userId: string,
): Promise<TaskResults> {
  const tagIds = tagIds_string.split(',');
  const taskIdByTagIds = await db.taskTag.groupBy({
    by: ['task_id'],
    where: {
      tag_id: { in: tagIds },
    },
    having: {
      task_id: { _count: { equals: tagIds.length } },
    },
  });

  const taskIds = taskIdByTagIds.map((item) => item.task_id);
  const tasks = await db.task.findMany({
    where: {
      task_id: { in: taskIds },
    },
  });
  const answers = await answer_crud.getAnswers(userId);

  return await relateTasksAndAnswers(userId, tasks, answers);
}
