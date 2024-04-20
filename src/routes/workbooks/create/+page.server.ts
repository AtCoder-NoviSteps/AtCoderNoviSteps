import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

import { workBookSchema } from '$lib/zod/schema';
import * as crud from '$lib/services/workbooks';
import { BAD_REQUEST, TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

export const load = async () => {
  // TODO: ユーザIdとユーザ名を取得
  console.log('called');
  const form = await superValidate(null, zod(workBookSchema));

  return { form };
};

export const actions = {
  default: async ({ request }) => {
    console.log('form -> actions -> create');
    const form = await superValidate(request, zod(workBookSchema));

    if (!form.valid) {
      return fail(BAD_REQUEST, { form });
    }

    // TODO: try-catchを付ける
    const workBook = form.data;
    crud.createWorkBook(workBook);

    // TODO: リダイレクトのときもメッセージを表示することはできるか調べる
    throw redirect(TEMPORARY_REDIRECT, '/workbooks');
  },
};
