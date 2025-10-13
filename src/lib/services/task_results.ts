import { error } from '@sveltejs/kit';

import { default as db } from '$lib/server/database';
import {
  getSubmissionStatusMapWithId,
  getSubmissionStatusMapWithName,
} from '$lib/services/submission_status';
import { getTasks, getTask } from '$lib/services/tasks';
import { getUser } from '$lib/services/users';
import * as answer_crud from '$lib/services/answers';

import {
  validateUserAnswersTransferability,
  isExistingUser,
  isSameUser,
} from '$lib/utils/account_transfer';

import type { User } from '@prisma/client';
import type { TaskAnswer } from '$lib/types/answer';
import type { Task } from '$lib/types/task';
import type { TaskResult, TaskResults, Tasks } from '$lib/types/task';
import type { WorkBookTasksBase } from '$lib/types/workbook';
import type { FloatingMessages } from '$lib/types/floating_message';

import { NOT_FOUND } from '$lib/constants/http-response-status-codes';

// DBから取得した問題とログインしているユーザの回答を紐付けしたデータ保持
const statusById = await getSubmissionStatusMapWithId();
const statusByName = await getSubmissionStatusMapWithName();

export async function getTaskResults(userId: string): Promise<TaskResults> {
  // 問題と特定のユーザの回答状況を使ってデータを結合
  // 計算量: 問題数をN、特定のユーザの解答数をMとすると、O(N + M)になるはず。
  const tasks = await getTasks();
  const answers = await answer_crud.getAnswers(userId);

  return await relateTasksAndAnswers(userId, tasks, answers);
}

export async function copyTaskResults(
  sourceUserName: string,
  destinationUserName: string,
): Promise<FloatingMessages> {
  const messages: FloatingMessages = [];

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

  if (!sourceUser || !destinationUser) {
    throw new Error(
      `Not found User(s): ${!sourceUser ? sourceUserName : ''} ${!destinationUser ? destinationUserName : ''}`,
    );
  }

  if (isSameUser(sourceUser, destinationUser)) {
    throw new Error("Can't copy answers to the same user: " + sourceUserName);
  }

  if (
    !isExistingUser(sourceUserName, sourceUser, messages) ||
    !isExistingUser(destinationUserName, destinationUser, messages)
  ) {
    throw new Error(`Not found user(s) for ${sourceUserName} and/or ${destinationUserName}`);
  }

  if (sourceUser && destinationUser) {
    const sourceUserAnswers: Map<string, TaskResult> = await answer_crud.getAnswers(sourceUser.id);
    const isValidatedSourceUser = validateUserAnswersTransferability(
      sourceUser,
      sourceUserAnswers,
      true,
      messages,
    );

    const destinationUserAnswers: Map<string, TaskResult> = await answer_crud.getAnswers(
      destinationUser.id,
    );
    const isValidatedDestinationUser = validateUserAnswersTransferability(
      destinationUser,
      destinationUserAnswers,
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
// Why : 未回答の問題も含めて取得するため、データ総量を抑えるためにも問題集の一覧(ユーザの回答を含む)を参照するときは上記のメソッドを使用する。
export async function getTaskResultsByTaskId(
  workBookTasks: WorkBookTasksBase,
  userId: string,
): Promise<Map<string, TaskResult>> {
  const startTime = Date.now();

  // Step 1: Extract task IDs with type-safe filtering
  const taskIds = workBookTasks
    .map((workBookTask) => workBookTask.taskId)
    .filter((id): id is string => id !== null && id !== undefined);

  if (taskIds.length === 0) {
    return new Map();
  }

  // Step 2: Bulk fetch all tasks (1 query)
  // Using Prisma's `where: { task_id: { in: taskIds } }` for efficient filtering
  const tasks = await db.task.findMany({
    where: {
      task_id: { in: taskIds }, // SQL: WHERE task_id IN ('id1', 'id2', ...)
    },
    select: {
      contest_id: true,
      task_table_index: true,
      task_id: true,
      title: true,
      grade: true,
    },
  });

  // Step 3: Bulk fetch all answers (1 query)
  // Using compound conditions: task_id IN (...) AND user_id = userId
  const answers = userId
    ? await db.taskAnswer.findMany({
        where: {
          task_id: { in: taskIds }, // SQL: WHERE task_id IN (...)
          user_id: userId, // SQL: AND user_id = 'userId'
        },
        select: {
          task_id: true,
          user_id: true,
          status_id: true,
        },
      })
    : [];

  // Step 4: Create Maps for O(1) lookup
  const tasksMap = new Map(tasks.map((task: Task) => [task.task_id, task]));
  const answersMap = new Map(answers.map((answer: TaskAnswer) => [answer.task_id, answer]));
  const taskResultsMap = new Map<string, TaskResult>();

  // Step 5: Merge in memory using mergeTaskAndAnswer
  for (const taskId of taskIds) {
    const task = tasksMap.get(taskId);

    if (!task) {
      console.warn(`Not found task: ${taskId} in database`);
      continue;
    }

    const answer = answersMap.get(taskId);
    const taskResult = mergeTaskAndAnswer(task, userId, answer);

    taskResultsMap.set(taskId, taskResult);
  }

  const duration = Date.now() - startTime;
  console.log(
    `[getTaskResultsByTaskId] Loaded ${taskIds.length} tasks in ${duration}ms (${answers.length} answers)`,
  );

  return taskResultsMap;
}

/**
 * Merge task and answer to create TaskResult
 * Extracted common logic from getTaskResult (excluding DB access)
 *
 * @param task - Task object from database
 * @param userId - User ID for creating TaskResult
 * @param answer - TaskAnswer object from database (can be null or undefined)
 * @returns TaskResult with merged data
 */
function mergeTaskAndAnswer(
  task: Task,
  userId: string,
  answer: TaskAnswer | null | undefined,
): TaskResult {
  const taskResult = createDefaultTaskResult(userId, task);

  if (!answer) {
    return taskResult;
  }

  const status = statusById.get(answer.status_id);

  if (status) {
    taskResult.status_id = status.id;
    taskResult.status_name = status.status_name;
    taskResult.submission_status_image_path = status.image_path;
    taskResult.submission_status_label_name = status.label_name;
    taskResult.is_ac = status.is_ac;
    taskResult.user_id = userId;
  }

  return taskResult;
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

// Note: This function will be deprecated in the future in favor of bulk operations (getTaskResultsByTaskId)
export async function getTaskResult(slug: string, userId: string) {
  const task = await getTask(slug);

  if (!task || task.length === 0) {
    error(NOT_FOUND, `問題 ${slug} は見つかりませんでした。`);
  }

  const taskAnswer: TaskAnswer | null = await answer_crud.getAnswer(slug, userId);

  return mergeTaskAndAnswer(task[0], userId, taskAnswer);
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
