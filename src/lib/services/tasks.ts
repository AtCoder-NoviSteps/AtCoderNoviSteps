// TODO: Enable to fetch data from the database via API.
import { error } from '@sveltejs/kit';
import { tasks } from '$lib/server/sample_data';
import type { Task, Tasks } from '$lib/types/task';
import { NOT_FOUND } from '$lib/constants/http-response-status-codes';

export async function getTasks(): Promise<Tasks> {
  return tasks.map((task: Task) => ({
    contest_id: task.contest_id,
    id: task.id,
    title: task.title,
    grade: task.grade,
    user_id: task.user_id,
    submission_result: task.submission_result,
  }));
}

export async function getTask(slug: string): Promise<Task> {
  const task = tasks.find((task) => task.id === slug);

  if (!task) throw error(NOT_FOUND);

  return task;
}
