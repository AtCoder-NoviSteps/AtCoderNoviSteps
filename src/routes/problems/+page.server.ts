import { type Actions } from '@sveltejs/kit';

import * as task_crud from '$lib/services/task_results';
import { getVoteGradeStatistics } from '$features/votes/services/vote_statistics';
import type { TaskResults } from '$lib/types/task';
import { Roles } from '$lib/types/user';
import { updateTaskResult } from '$lib/actions/update_task_result';
import { voteAbsoluteGrade } from '@/features/votes/actions/vote_actions';

// 一覧表ページは、ログインしていなくても閲覧できるようにする
export async function load({ locals, url }) {
  const session = await locals.auth.validate();
  const params = await url.searchParams;

  const tagIds: string | null = params.get('tagIds');
  const isAdmin: boolean = session?.user.role === Roles.ADMIN;
  // TODO: utilに移動させる
  const isLoggedIn: boolean = session !== null;

  if (tagIds != null) {
    return {
      taskResults: (await task_crud.getTasksWithTagIds(
        tagIds,
        session?.user.userId,
      )) as TaskResults,
      voteResults: await getVoteGradeStatistics(),
      isAdmin: isAdmin,
      isLoggedIn: isLoggedIn,
    };
  } else {
    return {
      taskResults: (await task_crud.getTaskResults(session?.user.userId)) as TaskResults,
      voteResults: await getVoteGradeStatistics(),
      isAdmin: isAdmin,
      isLoggedIn: isLoggedIn,
    };
  }
}

export const actions = {
  update: async ({ request, locals }) => {
    const operationLog = 'problems -> actions -> update';
    return await updateTaskResult({ request, locals }, operationLog);
  },
  voteAbsoluteGrade: async ({ request, locals }) => {
    await voteAbsoluteGrade({ request, locals });
  },
} satisfies Actions;
