import { error } from '@sveltejs/kit';
import db from '$lib/server/database';
import { taskResults } from '$lib/server/sample_data';
import type { TaskResult, TaskResults } from '$lib/types/task';
import { NOT_FOUND } from '$lib/constants/http-response-status-codes';

// TODO: Enable to fetch data from the database.
export async function getTaskResults(): Promise<TaskResults> {
  // FIXME: 問題そのものとユーザの回答状況を分離 + ここでデータをO(N + M)で合成

  // TODO: useIdを動的に変更できるようにする。
  const userId = 'hogehoge';
  const sampleTaskResults = taskResults.map((taskResult: TaskResult) => ({
    contest_id: taskResult.contest_id,
    id: taskResult.id,
    title: taskResult.title,
    grade: taskResult.grade,
    user_id: taskResult.user_id,
    submission_status: taskResult.submission_status,
  }));

  if (!db.has(userId)) {
    db.set(userId, sampleTaskResults);
  }

  return Array.from(db.get(userId).values());
}

export async function getTaskResult(slug: string): Promise<TaskResult> {
  // TODO: useIdを動的に変更できるようにする。
  const userId = 'hogehoge';
  const task: TaskResult = db.get(userId).find((taskResult: TaskResult) => taskResult.id === slug);

  if (!task) throw error(NOT_FOUND, `問題 ${slug} は見つかりませんでした。`);

  return task;
}

export async function updateTaskResult(slug: string, submissionStatus: string) {
  // TODO: useIdを動的に変更できるようにする。
  const userId = 'hogehoge';
  const taskResult: TaskResult = db
    .get(userId)
    .find((taskResult: TaskResult) => taskResult.id === slug);
  taskResult.submission_status = submissionStatus;
}
