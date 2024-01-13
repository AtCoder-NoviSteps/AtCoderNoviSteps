import * as crud from '$lib/services/task_results';
import type { TaskResults } from '$lib/types/task';
import { redirect } from '@sveltejs/kit';
import { Roles } from '$lib/types/user';
// TODO: ユーザを識別できるようにする。
export async function load({ locals, url }) {
  const session = await locals.auth.validate();
  const params = await url.searchParams;

  if (!session) {
    throw redirect(302, '/login');
  }

  const tagIds: string | null = params.get('tagIds');
  let isAdmin: boolean = false;
  if (session?.user.role === Roles.ADMIN) {
    isAdmin = true;
  }
  if (tagIds != null) {
    return {
      taskResults: (await crud.getTasksWithTagIds(tagIds, session?.user.userId)) as TaskResults,
      isAdmin: isAdmin,
    };
  } else {
    return {
      taskResults: (await crud.getTaskResults(session?.user.userId)) as TaskResults,
      isAdmin: isAdmin,
    };
  }
}
