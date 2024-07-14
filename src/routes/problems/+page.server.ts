import { type Actions } from '@sveltejs/kit';

import * as crud from '$lib/services/task_results';
import type { TaskResults } from '$lib/types/task';
import { Roles } from '$lib/types/user';
import * as action from '$lib/actions/update_task_result';

// 問題一覧ページは、ログインしていなくても閲覧できるようにする
export async function load({ locals, url }) {
  const session = await locals.auth.validate();
  const params = await url.searchParams;

  const tagIds: string | null = params.get('tagIds');
  const isAdmin: boolean = session?.user.role === Roles.ADMIN;
  // TODO: utilに移動させる
  const isLoggedIn: boolean = session !== null;

  if (tagIds != null) {
    return {
      taskResults: (await crud.getTasksWithTagIds(tagIds, session?.user.userId)) as TaskResults,
      isAdmin: isAdmin,
      isLoggedIn: isLoggedIn,
    };
  } else {
    return {
      taskResults: (await crud.getTaskResults(session?.user.userId)) as TaskResults,
      isAdmin: isAdmin,
      isLoggedIn: isLoggedIn,
    };
  }
}

export const actions = {
  update: async ({ request, locals }) => {
    const operationLog = 'problems -> actions -> update';
    return await action.updateTaskResult({ request, locals }, operationLog);
  },
} satisfies Actions;
