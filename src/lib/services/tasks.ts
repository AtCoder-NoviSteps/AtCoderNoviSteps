// TODO: Enable to fetch data from the database via API.
import { tasks } from '$lib/server/sample_data';
import type { Task, Tasks } from '$lib/types/task';

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
