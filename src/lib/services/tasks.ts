import { error } from '@sveltejs/kit';
import db from '$lib/server/database';
import { tasks } from '$lib/server/sample_data';
import type { Task, Tasks } from '$lib/types/task';
import { NOT_FOUND } from '$lib/constants/http-response-status-codes';

// TODO: Enable to fetch data from the database.
export async function getTasks(): Promise<Tasks> {
  // FIXME: 問題そのものとユーザの回答状況を分離 + ここでデータをO(N + M)で合成

  // TODO: useIdを動的に変更できるようにする。
  const userId = 'hogehoge';
  const sampleTasks = tasks.map((task: Task) => ({
    contest_id: task.contest_id,
    id: task.id,
    title: task.title,
    grade: task.grade,
    user_id: task.user_id,
    submission_status: task.submission_status,
  }));

  if (!db.has(userId)) {
    db.set(userId, sampleTasks);
  }

  return Array.from(db.get(userId).values());
}

export async function getTask(slug: string): Promise<Task> {
  // TODO: useIdを動的に変更できるようにする。
  const userId = 'hogehoge';
  const task: Task = db.get(userId).find((task: Task) => task.id === slug);

  if (!task) throw error(NOT_FOUND, `問題 ${slug} は見つかりませんでした。`);

  return task;
}

export async function updateTask(slug: string, submissionStatus: string) {
  // TODO: useIdを動的に変更できるようにする。
  const userId = 'hogehoge';
  const taskResult: Task = db.get(userId).find((task: Task) => task.id === slug);
  taskResult.submission_status = submissionStatus;
}
