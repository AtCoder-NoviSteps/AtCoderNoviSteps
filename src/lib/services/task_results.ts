import { error } from '@sveltejs/kit';
import db from '$lib/server/database';
import { getTasks } from '$lib/services/tasks';
import { getAnswers } from './answers';
import type { Task, Tasks, TaskResult, TaskResults } from '$lib/types/task';
import { NOT_FOUND } from '$lib/constants/http-response-status-codes';

// TODO: Enable to fetch data from the database.
export async function getTaskResults(): Promise<TaskResults> {
  // FIXME: 問題一覧と特定のユーザの回答状況を使ってデータを結合
  // 計算量: 問題数をN、特定のユーザの解答数をMとすると、O(N + M)になるはず。

  // TODO: useIdを動的に変更できるようにする。
  // TODO: getUser(userId)を用意して、取得できるようにする。
  const userId = 'hogehoge';

  // TODO: ユーザIDを指定したら、解答の一覧を取得できるようにする。
  const tasks: Tasks = getTasks();
  const answers = getAnswers();
  const sampleTaskResults = tasks.map((task: Task) => {
    const taskResult = createTaskResult(userId, task);

    if (answers.has(task.task_id)) {
      const answer = answers.get(task.task_id);
      taskResult.submission_status = answer.submission_status;
    }

    return taskResult;
  });

  if (!db.has(userId)) {
    db.set(userId, sampleTaskResults);
  }

  return Array.from(db.get(userId).values());
}

export function createTaskResult(userId: string, task: Task): TaskResult {
  const taskResult: TaskResult = {
    contest_id: task.contest_id,
    task_id: task.task_id,
    title: task.title,
    grade: task.grade,
    user_id: userId,
    submission_status: 'ns', // FIXME: Use const
  };

  return taskResult;
}

export async function getTaskResult(slug: string): Promise<TaskResult> {
  // TODO: useIdを動的に変更できるようにする。
  const userId = 'hogehoge';
  const task: TaskResult = db
    .get(userId)
    .find((taskResult: TaskResult) => taskResult.task_id === slug);

  if (!task) throw error(NOT_FOUND, `問題 ${slug} は見つかりませんでした。`);

  return task;
}

export async function updateTaskResult(slug: string, submissionStatus: string) {
  const taskResult: TaskResult = await getTaskResult(slug);
  taskResult.submission_status = submissionStatus;
}
