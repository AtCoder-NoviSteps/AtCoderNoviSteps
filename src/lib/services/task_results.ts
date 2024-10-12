import { error } from '@sveltejs/kit';

import { default as db } from '$lib/server/database';
import { getTasks, getTask } from '$lib/services/tasks';
import { getUser } from '$lib/services/users';
import * as answer_crud from '$lib/services/answers';

import type { TaskAnswer } from '$lib/types/answer';
import type { Task } from '$lib/types/task';
import type { TaskResult, TaskResults, Tasks } from '$lib/types/task';
import type { WorkBookTaskBase, WorkBookTasksBase } from '$lib/types/workbook';
import type { Check } from '$lib/type/check';

import { NOT_FOUND } from '$lib/constants/http-response-status-codes';
import { getSubmissionStatusMapWithId, getSubmissionStatusMapWithName } from './submission_status';

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

export async function cpoyTaskResults(
  sourceUserName: string,
  destinationUserName: string,
): Promise<Check[]> {
  const checks = [];
  const failureMessage = { label: 'コピーが失敗しました。', status: false };
  const sourceUser = await getUser(sourceUserName);
  const destinationUser = await getUser(destinationUserName);
  if (sourceUser == null) {
    checks.push({ label: 'Source UserName が存在しません。コピーを中止します。', status: false });
    checks.push(failureMessage);
    return checks;
  } else {
    checks.push({ label: 'Source UserName が存在することを確認しました', status: true });
  }

  if (destinationUser == null) {
    checks.push({ label: 'Target UserName が存在しません。コピーを中止します。', status: false });
    checks.push(failureMessage);
    return checks;
  } else {
    checks.push({ label: 'Target UserName が存在することを確認しました。', status: true });
  }

  const sourceAnswers = await answer_crud.getAnswers(sourceUser.id);
  const destinationAnswers = await answer_crud.getAnswers(destinationUser.id);

  if (sourceAnswers.size == 0) {
    checks.push({
      label: 'Source UserName にコピー対象のデータがありません。コピーを中止します。',
      status: false,
    });
    checks.push(failureMessage);
    return checks;
  }
  if (destinationAnswers.size > 0) {
    checks.push({
      label: 'Target UserName にすでにデータがあります。コピーを中止します。',
      status: false,
    });
    checks.push(failureMessage);
    return checks;
  }

  //const sourceTaskResults = await relateTasksAndAnswers(sourceUserId, tasks, sourceAnswers);

  try {
    await db.$transaction(async () => {
      sourceAnswers.forEach(async (taskResult: TaskResult) => {
        await answer_crud.upsertAnswer(
          taskResult.task_id,
          destinationUser.id,
          taskResult.status_id,
        );
      });
    });
  } catch {
    checks.push({ label: 'コピー中に何らかのエラーが発生しました。', status: false });
    return checks;
  }
  checks.push({ label: 'コピーが正常に完了しました。', status: true });
  return checks;
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

  if (!task || task.length == 0) {
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
