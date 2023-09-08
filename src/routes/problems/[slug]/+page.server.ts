import * as tasks from '$lib/services/tasks';
import { fail, type Actions } from '@sveltejs/kit';
// import { redirect } from '@sveltejs/kit';

// TODO: ユーザを識別できるようにする。
export async function load({ params }) {
  const task = await tasks.getTask(params.slug as string);

  return { task };
}

export const actions = {
  default: async ({ request, params }) => {
    const response = await request.formData();
    const slug = params.slug as string;

    try {
      const submissionStatus = response.get('submissionStatus') as string;
      await tasks.updateTask(slug, submissionStatus);
    } catch (error) {
      return fail(400, { slug });
    }

    // HACK: 回答状況をクリックした後に、問題一覧ページに戻った方が良い?
    // throw redirect(307, '/problems');
  },
} satisfies Actions;
