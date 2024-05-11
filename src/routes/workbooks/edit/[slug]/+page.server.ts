import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

import { BAD_REQUEST, TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';
import { getWorkbookWithAuthor, validateWorkBookId } from '$lib/utils/workbook';
import { workBookSchema } from '$lib/zod/schema';
import * as tasksCrud from '$lib/services/tasks';
import * as workBooksCrud from '$lib/services/workbooks';

// TODO: 一般公開するまでは、管理者のみアクセスできるようにする
export async function load({ locals, params }) {
  // FIXME: ログインしているかどうかの判定が他のページと共通しているので、メソッドとして切り出す
  // ログインしていない場合は、ログイン画面へ遷移させる
  const session = await locals.auth.validate();

  if (!session) {
    throw redirect(TEMPORARY_REDIRECT, '/login');
  }

  const workBookWithAuthor = await getWorkbookWithAuthor(params.slug);
  const form = await superValidate(null, zod(workBookSchema));
  form.data = { ...form.data, ...workBookWithAuthor.workBook };
  const tasks = await tasksCrud.getTasks();
  const tasksMapByIds = await tasksCrud.getTasksByTaskId();

  return { form: form, ...workBookWithAuthor, tasks: tasks, tasksMapByIds: tasksMapByIds };
}

export const actions = {
  default: async ({ request, params }) => {
    console.log('form -> actions -> update');
    const form = await superValidate(request, zod(workBookSchema));

    const workBook = form.data;
    const workBookId = parseInt(params.slug);

    validateWorkBookId(workBookId);

    try {
      await workBooksCrud.updateWorkBook(workBookId, workBook);
    } catch (error) {
      console.error(`Failed to update WorkBook with id ${workBookId}:`, error);
      return fail(BAD_REQUEST);
    }

    throw redirect(TEMPORARY_REDIRECT, '/workbooks');
  },
};
