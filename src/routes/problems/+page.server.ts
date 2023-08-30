// TODO: Enable to fetch data from the database via API.
import { tasks } from './sample_data';

export function load() {
  return {
    tasks: tasks.map((task) => ({
      contest_id: task.contest_id,
      id: task.id,
      title: task.title,
      grade: task.grade,
      user_id: task.user_id,
      submission_result: task.submission_result,
    })),
  };
}
