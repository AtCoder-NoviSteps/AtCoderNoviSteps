import { fail, type Actions } from '@sveltejs/kit';
import * as crud from '$lib/services/task_results';
import { BAD_REQUEST, TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';
import { redirect } from '@sveltejs/kit';

import { getButtons } from '$lib/services/submission_status';
//export let buttonColor: string

// TODO: ユーザを識別できるようにする。
export async function load({ params }) {
  const taskResult = await crud.getTaskResult(params.slug as string);
  const buttons = await getButtons();

  return { taskResult: taskResult, buttons: buttons };
}

export const actions = {
  default: async ({ request, params }) => {
    const response = await request.formData();
    const slug = params.slug as string;

    try {
      const submissionStatus = response.get('submissionStatus') as string;
      await crud.updateTaskResult(slug, submissionStatus);
    } catch (error) {
      return fail(BAD_REQUEST, { slug });
    }

    // HACK: 回答状況をクリックした後に問題一覧ページに戻るのをユーザが望んでいるか?
    throw redirect(TEMPORARY_REDIRECT, '/problems');
  },
} satisfies Actions;
