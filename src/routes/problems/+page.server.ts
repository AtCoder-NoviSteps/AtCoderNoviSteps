import { fail, type Actions } from '@sveltejs/kit';

import * as crud from '$lib/services/task_results';
import type { TaskResults } from '$lib/types/task';
import { Roles } from '$lib/types/user';
import { BAD_REQUEST } from '$lib/constants/http-response-status-codes';

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

// HACK: Actionを切り出すことができれば、問題集の回答状況の更新でほぼそのまま利用できる
export const actions = {
  update: async ({ request, locals }) => {
    console.log('problems -> actions -> update');
    const response = await request.formData();

    const session = await locals.auth.validate();
    // TODO: ログインしていなければ、エラー処理

    const userId = session?.user.userId;

    try {
      const taskId = response.get('taskId') as string;
      const submissionStatus = response.get('submissionStatus') as string;

      await crud.updateTaskResult(taskId, submissionStatus, userId);
    } catch (error) {
      return fail(BAD_REQUEST);
    }
  },
} satisfies Actions;
