import * as tasks from '$lib/services/tasks';

// TODO: ユーザを識別できるようにする。
export async function load({ params }) {
  const task = await tasks.getTask(params.slug as string);

  return { task };
}
