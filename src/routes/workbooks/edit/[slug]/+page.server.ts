import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';
import { getWorkbookWithAuthor } from '$lib/utils/workbook';
import { workBookSchema } from '$lib/zod/schema';
import * as tasksCrud from '$lib/services/tasks';

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
  form.data = { ...form.data, ...workBookWithAuthor.workbook };
  const tasks = await tasksCrud.getTasks();
  const tasksMapByIds = await tasksCrud.getTasksByTaskId();

  return { form: form, ...workBookWithAuthor, tasks: tasks, tasksMapByIds: tasksMapByIds };
}
