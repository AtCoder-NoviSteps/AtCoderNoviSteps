import * as crud from '$lib/services/task_results';
import type { TaskResults } from '$lib/types/task';
import { Roles } from '$lib/types/user';

// 問題一覧ページは、ログインしていなくても閲覧できるようにする
export async function load({ locals, url }) {
  const session = await locals.auth.validate();
  const params = await url.searchParams;

  const tagIds: string | null = params.get('tagIds');
  const isAdmin: boolean = session?.user.role === Roles.ADMIN;

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
