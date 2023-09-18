import { tasks } from '$lib/server/sample_data';
import type { Tasks } from '$lib/types/task';

// TODO: useIdを動的に変更できるようにする。
export function getTasks(): Tasks {
  return tasks;
}

// TODO: getTask()
// TODO: createTask()
// TODO: updateTask()
// TODO: deleteTask()
