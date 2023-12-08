import * as crud from '$lib/services/task_results';
import type { TaskResults } from '$lib/types/task';
import { redirect } from '@sveltejs/kit';

// TODO: ユーザを識別できるようにする。
export async function load({ locals, url }) {
  const session = await locals.auth.validate();
  const params = await url.searchParams;

  if (!session) {
    throw redirect(302, '/login');
  }

  const tagIds: string | null = params.get('tagIds');
  if (tagIds != null) {
    return {
      taskResults: (await crud.getTasksWithTagIds(tagIds)) as TaskResults,
    };
  } else {
    return {
      taskResults: (await crud.getTaskResults()) as TaskResults,
    };
  }
}
