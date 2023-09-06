import { getTasks } from '$lib/services/tasks';
import type { Tasks } from '$lib/types/task';

// TODO: ユーザを識別できるようにする。
export async function load() {
  const tasks: Tasks = await getTasks();

  return {
    tasks: tasks,
  };
}
