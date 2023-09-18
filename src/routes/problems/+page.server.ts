import * as crud from '$lib/services/task_results';
import type { TaskResults } from '$lib/types/task';

// TODO: ユーザを識別できるようにする。
export async function load() {
  return {
    taskResults: (await crud.getTaskResults()) as TaskResults,
  };
}
