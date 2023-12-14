import { error } from '@sveltejs/kit';
import { getTasks } from '$lib/services/tasks';
import * as answer_crud from './answers';
import type { Task, TaskResult, TaskResults } from '$lib/types/task';
import { NOT_FOUND } from '$lib/constants/http-response-status-codes';
import { default as db } from '$lib/server/database';
import { getSubmissionStatus } from './submission_status';

// In a real app, this data would live in a database,
// rather than in memory. But for now, we cheat.
// DBから取得した問題一覧とログインしているユーザの回答を紐付けしたデータ保持
// HACK: よりスマート、かつ、セキュリティにも安全な方法があるはず
const taskResultsMap = new Map();

// TODO: Enable to fetch data from the database.
export async function getTaskResults(): Promise<TaskResults> {
  // FIXME: 問題一覧と特定のユーザの回答状況を使ってデータを結合
  // 計算量: 問題数をN、特定のユーザの解答数をMとすると、O(N + M)になるはず。

  // TODO: useIdを動的に変更できるようにする。
  // TODO: getUser(userId)を用意して、取得できるようにする。
  const userId = 'hogehoge';

  const tasks = await getTasks();
  const answers = answer_crud.getAnswers();
  const sampleTaskResults = tasks.map((task: Task) => {
    const taskResult = createTaskResult(userId, task);

    if (answers.has(task.task_id)) {
      const answer = answers.get(task.task_id);
      taskResult.status_id = answer.status_id;
      taskResult.submission_status = answer.submission_status;
    }

    return taskResult;
  });

  if (!taskResultsMap.has(userId)) {
    taskResultsMap.set(userId, sampleTaskResults);
  }

  return Array.from(taskResultsMap.get(userId).values());
}

export function createTaskResult(userId: string, task: Task): TaskResult {
  const taskResult: TaskResult = {
    contest_id: task.contest_id,
    task_id: task.task_id,
    title: task.title,
    grade: task.grade,
    user_id: userId,
    task_table_index: task.task_table_index,
    status_id: '1',
    submission_status: 'ns', // FIXME: Use const
  };

  return taskResult;
}

export async function getTaskResult(slug: string): Promise<TaskResult> {
  // TODO: useIdを動的に変更できるようにする。
  const userId = 'hogehoge';
  const task: TaskResult = taskResultsMap
    .get(userId)
    .find((taskResult: TaskResult) => taskResult.task_id === slug);

  if (!task) throw error(NOT_FOUND, `問題 ${slug} は見つかりませんでした。`);

  return task;
}

export async function updateTaskResult(slug: string, submissionStatus: string) {
  const taskResult: TaskResult = await getTaskResult(slug);
  taskResult.status_id = (await getSubmissionStatus()).get(submissionStatus).id;
  taskResult.submission_status = submissionStatus;
}

export async function getTasksWithTagIds(tagIds_string: string): Promise<TaskResults> {
  const taskResultsMap = new Map();

  const userId = 'hogehoge';
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

  const answers = answer_crud.getAnswers();

  const sampleTaskResults = tasks.map((task: Task) => {
    const taskResult = createTaskResult(userId, task);

    if (answers.has(task.task_id)) {
      const answer = answers.get(task.task_id);
      taskResult.submission_status = answer.submission_status;
    }

    return taskResult;
  });

  if (!taskResultsMap.has(userId)) {
    taskResultsMap.set(userId, sampleTaskResults);
  }

  return Array.from(taskResultsMap.get(userId).values());
}
