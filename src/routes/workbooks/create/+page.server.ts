import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

import { workBookSchema } from '$lib/zod/schema';
import * as workBooksCrud from '$lib/services/workbooks';
import { Roles } from '$lib/types/user';
import type { WorkBook } from '$lib/types/workbook';
import { BAD_REQUEST, TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';
import * as tasksCrud from '$lib/services/tasks';

export const load = async ({ locals }) => {
  // ログインしていない場合は、ログイン画面へ遷移させる
  const session = await locals.auth.validate();

  if (!session) {
    throw redirect(TEMPORARY_REDIRECT, '/login');
  }

  const form = await superValidate(null, zod(workBookSchema));
  const user = locals.user;
  const isAdmin = user.role === Roles.ADMIN;
  const tasks = await tasksCrud.getTasks();

  return { form: form, author: user, isAdmin: isAdmin, tasks: tasks };
};

export const actions = {
  default: async ({ request }) => {
    console.log('form -> actions -> create');
    const form = await superValidate(request, zod(workBookSchema));

    if (!form.valid) {
      return fail(BAD_REQUEST, { form: { ...form, message: 'TODO: エラーメッセージを記述' } });
    }

    const workBook: WorkBook = form.data;

    try {
      await workBooksCrud.createWorkBook(workBook);
    } catch (error) {
      // TODO: クライアント側のエラー
      return fail(BAD_REQUEST, { form: { ...form, message: 'TODO: エラーメッセージを記述' } });

      // TODO: サーバー側のエラー
    }

    // TODO: リダイレクトのときもメッセージを表示することはできるか調べる
    throw redirect(TEMPORARY_REDIRECT, '/workbooks');
  },
};
