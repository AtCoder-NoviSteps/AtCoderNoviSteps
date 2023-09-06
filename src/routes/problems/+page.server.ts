import * as tasks from '$lib/services/tasks';
import type { Tasks } from '$lib/types/task';

// TODO: ユーザを識別できるようにする。
export async function load() {
  return {
    tasks: (await tasks.getTasks()) as Tasks,
  };
}
