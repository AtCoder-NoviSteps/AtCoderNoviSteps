import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

import { workBookSchema } from '$lib/zod/schema';
import * as crud from '$lib/services/workbooks';
import { Roles } from '$lib/types/user';
import type { WorkBook } from '$lib/types/workbook';
import { BAD_REQUEST, TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

export const load = async ({ locals }) => {
  // TODO: ログインしていない場合は、ログイン画面へ遷移させる
  const user = locals.user;
  const isAdmin = user.role === Roles.ADMIN;
  const form = await superValidate(null, zod(workBookSchema));

  return { form: form, user: user, isAdmin: isAdmin };
};

export const actions = {
  default: async ({ request }) => {
    console.log('form -> actions -> create');
    const form = await superValidate(request, zod(workBookSchema));

    if (!form.valid) {
      return fail(BAD_REQUEST, { form });
    }

    // TODO: try-catchを付ける
    const workBook: WorkBook = form.data;
    await crud.createWorkBook(workBook);

    // TODO: リダイレクトのときもメッセージを表示することはできるか調べる
    throw redirect(TEMPORARY_REDIRECT, '/workbooks');
  },
};
