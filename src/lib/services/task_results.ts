import { error } from '@sveltejs/kit';
import { getTasks, getTask } from '$lib/services/tasks';
import * as answer_crud from './answers';
import type { TaskResult, TaskResults } from '$lib/types/task';
import type { Task } from '$lib/types/task';
import { NOT_FOUND } from '$lib/constants/http-response-status-codes';
import { default as db } from '$lib/server/database';
import { getSubmissionStatusMapWithId, getSubmissionStatusMapWithName } from './submission_status';
import type { TaskAnswer } from '../types/answer';

// In a real app, this data would live in a database,
// rather than in memory. But for now, we cheat.
// DBから取得した問題一覧とログインしているユーザの回答を紐付けしたデータ保持
// HACK: よりスマート、かつ、セキュリティにも安全な方法があるはず
//const taskResultsMap = new Map();

const statusById = await getSubmissionStatusMapWithId();
const statusByName = await getSubmissionStatusMapWithName();

// TODO: Enable to fetch data from the database.
export async function getTaskResults(userId: string): Promise<TaskResults> {
  const taskResultsMap = new Map();

  // FIXME: 問題一覧と特定のユーザの回答状況を使ってデータを結合
  // 計算量: 問題数をN、特定のユーザの解答数をMとすると、O(N + M)になるはず。

  // TODO: useIdを動的に変更できるようにする。
  // TODO: getUser(userId)を用意して、取得できるようにする。
  //const userId = 'hogehoge';

  const tasks = await getTasks();
  const answers = await answer_crud.getAnswers(userId);
  const sampleTaskResults = tasks.map((task: Task) => {
    const taskResult = createDefaultTaskResult(userId, task);

    if (answers.has(task.task_id)) {
      const answer = answers.get(task.task_id);
      const status = statusById.get(answer.status_id);
      taskResult.status_name = status.status_name;
      taskResult.submission_status_image_path = status.image_path;
      taskResult.is_ac = status.is_ac;
    }

    return taskResult;
  });

  if (!taskResultsMap.has(userId)) {
    taskResultsMap.set(userId, sampleTaskResults);
  }

  return Array.from(taskResultsMap.get(userId).values());
}

// TODO: Enable to fetch data from the database.
export async function getTaskResultsOnlyResultExists(userId: string): Promise<TaskResults> {
  const taskResultsMap = new Map();

  // TODO: answerの降順にしたい

  const tasks = await getTasks();
  const answers = await answer_crud.getAnswers(userId);
  const tasksHasAnswer = tasks.filter((task) => answers.has(task.task_id));
  const sampleTaskResults = tasksHasAnswer.map((task: Task) => {
    const taskResult = createDefaultTaskResult(userId, task);

    const answer = answers.get(task.task_id);
    const status = statusById.get(answer.status_id);
    taskResult.status_name = status.status_name;
    taskResult.submission_status_image_path = status.image_path;
    taskResult.is_ac = status.is_ac;
    taskResult.updated_at = answer.updated_at;

    return taskResult;
  });

  if (!taskResultsMap.has(userId)) {
    taskResultsMap.set(userId, sampleTaskResults);
  }

  return Array.from(taskResultsMap.get(userId).values());
}

export function createDefaultTaskResult(userId: string, task: Task): TaskResult {
  const taskResult: TaskResult = {
    contest_id: task.contest_id,
    task_id: task.task_id,
    title: task.title,
    grade: task.grade,
    user_id: userId,
    task_table_index: task.task_table_index,
    status_id: '1',
    status_name: 'ns', // FIXME: Use const
    submission_status_image_path: 'ns.png',
    is_ac: false,
    updated_at: new Date(),
  };

  return taskResult;
}
export async function getTaskResult(slug: string, userId: string) {
  // TODO: useIdを動的に変更できるようにする。
  //const userId = 'hogehoge';
  //const task: TaskResult = taskResultsMap
  //  .get(userId)
  //  .find((taskResult: TaskResult) => taskResult.task_id === slug);

  const task = await getTask(slug);

  if (!task || task.length == 0) {
    throw error(NOT_FOUND, `問題 ${slug} は見つかりませんでした。`);
  }

  const taskResult = createDefaultTaskResult(userId, task[0]);
  const taskanswer: TaskAnswer | null = await answer_crud.getAnswer(slug, userId);

  if (!taskanswer) {
    return taskResult;
  }

  const status = statusById.get(taskanswer.status_id);
  taskResult.status_id = status.status_id;
  taskResult.status_name = status.status_name;
  taskResult.submission_status_image_path = status.image_path;
  taskResult.is_ac = status.is_ac;
  taskResult.user_id = userId;

  //console.log(taskResult.status_id, taskResult.status_name, taskResult.user_id)

  return taskResult;
}

export async function updateTaskResult(slug: string, submissionStatus: string, userId: string) {
  const taskResult: TaskResult | null = await getTaskResult(slug, userId);

  if (taskResult) {
    //taskResult.status_id = statusByName.get(submissionStatus).id;
    //taskResult.submission_status = submissionStatus;
    const status_id = statusByName.get(submissionStatus).id;

    const resisteredTaskAnswer = await db.taskAnswer.findMany({
      where: { task_id: slug, user_id: userId },
    });

    if (resisteredTaskAnswer.length == 0) {
      //console.log('invoke createTaskResult(', slug, submissionStatus, userId, ')');
      await answer_crud.createAnswer(slug, userId, status_id);
    }

    //console.log('invoke updateTaskResult(', slug, submissionStatus, userId, ')');
    await db.taskAnswer.update({
      where: {
        task_id_user_id: { task_id: slug, user_id: userId },
      },
      data: {
        status_id: status_id,
      },
    });
  }
}

export async function getTasksWithTagIds(
  tagIds_string: string,
  userId: string,
): Promise<TaskResults> {
  const taskResultsMap = new Map();

  //const userId = 'hogehoge';
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

  const sampleTaskResults = tasks.map((task: Task) => {
    const taskResult = createDefaultTaskResult(userId, task);

    if (answers.has(task.task_id)) {
      //TODO 同じコードがあるからまとめたい
      const answer = answers.get(task.task_id);
      const status = statusById.get(answer.status_id);
      taskResult.status_name = status.status_name;
      taskResult.submission_status_image_path = status.image_path;
      taskResult.is_ac = status.is_ac;
      taskResult.user_id = userId;
    }

    return taskResult;
  });

  if (!taskResultsMap.has(userId)) {
    taskResultsMap.set(userId, sampleTaskResults);
  }

  return Array.from(taskResultsMap.get(userId).values());
}
