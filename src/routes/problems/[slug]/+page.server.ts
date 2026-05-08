import { fail, type Actions, redirect } from '@sveltejs/kit';

import * as crud from '$lib/services/task_results';
import { getButtons } from '$lib/services/submission_status';
import { getLoggedInUser } from '$features/auth/services/session';

import { BAD_REQUEST, TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

const buttons = await getButtons();

export async function load({ locals, params, url }) {
  // getLoggedInUser either returns a user or throws redirect(); null is unreachable.
  // Non-null assertion (!) is safe here.
  const loggedInUser = await getLoggedInUser(locals, url);
  const taskResult = await crud.getTaskResult(params.slug as string, loggedInUser.id);

  return { taskResult: taskResult, buttons: buttons };
}

export const actions = {
  default: async ({ request, params, locals, url }) => {
    const response = await request.formData();
    const slug = params.slug as string;

    // Note: getLoggedInUser either returns a user or throws redirect(); null is unreachable.
    // This action implicitly requires login (redirect on no session).
    const loggedInUser = await getLoggedInUser(locals, url);
    const userId = loggedInUser.id;

    try {
      const submissionStatus = response.get('submissionStatus') as string;
      await crud.updateTaskResult(slug, submissionStatus, userId);
    } catch (error) {
      console.log('Failed to update task result: ', error);
      return fail(BAD_REQUEST, { slug });
    }

    // HACK: 回答状況をクリックした後に一覧表ページに戻るのをユーザが望んでいるか?
    redirect(TEMPORARY_REDIRECT, '/problems');
  },
} satisfies Actions;
