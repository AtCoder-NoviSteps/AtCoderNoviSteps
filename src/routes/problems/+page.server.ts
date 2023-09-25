import * as crud from '$lib/services/task_results';
import type { TaskResults } from '$lib/types/task';
import { redirect } from '@sveltejs/kit';

// TODO: ユーザを識別できるようにする。
export async function load({ locals }) {
  const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, '/login');
  }

  return {
    taskResults: (await crud.getTaskResults()) as TaskResults,
  };
}
