import { fail, type Actions } from '@sveltejs/kit';
import * as crud from '$lib/services/task_results';
import { BAD_REQUEST, TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';
import { redirect } from '@sveltejs/kit';

import { getButtons } from '$lib/services/submission_status';

const buttons = await getButtons();

export async function load({ locals, params }) {
  const session = await locals.auth.validate();
  if (!session) {
    redirect(302, '/login');
  }

  const taskResult = await crud.getTaskResult(params.slug as string, session?.user.userId);

  return { taskResult: taskResult, buttons: buttons };
}

export const actions = {
  default: async ({ request, params, locals }) => {
    const response = await request.formData();
    const slug = params.slug as string;

    const session = await locals.auth.validate();
    const userId = session?.user.userId;

    try {
      const submissionStatus = response.get('submissionStatus') as string;
      await crud.updateTaskResult(slug, submissionStatus, userId);
    } catch (error) {
      console.log('Failed to update task result: ', error);
      return fail(BAD_REQUEST, { slug });
    }

    // HACK: 回答状況をクリックした後に問題一覧ページに戻るのをユーザが望んでいるか?
    redirect(TEMPORARY_REDIRECT, '/problems');
  },
} satisfies Actions;
