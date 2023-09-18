import { fail, type Actions } from '@sveltejs/kit';
import * as crud from '$lib/services/task_results';
import { BAD_REQUEST } from '$lib/constants/http-response-status-codes';
// import { redirect } from '@sveltejs/kit';

// TODO: ユーザを識別できるようにする。
export async function load({ params }) {
  const taskResult = await crud.getTaskResult(params.slug as string);

  return { taskResult: taskResult };
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

    // HACK: 回答状況をクリックした後に、問題一覧ページに戻った方が良い?
    // throw redirect(307, '/problems');
  },
} satisfies Actions;
