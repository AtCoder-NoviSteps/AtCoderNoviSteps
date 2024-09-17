import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

import { getLoggedInUser } from '$lib/utils/authorship';
import { workBookSchema } from '$lib/zod/schema';
import * as workBooksCrud from '$lib/services/workbooks';
import { Roles } from '$lib/types/user';
import type { WorkBook } from '$lib/types/workbook';
import {
  BAD_REQUEST,
  FORBIDDEN,
  TEMPORARY_REDIRECT,
} from '$lib/constants/http-response-status-codes';
import * as tasksCrud from '$lib/services/tasks';

export const load = async ({ locals }) => {
  // ログインしていない場合は、ログイン画面へ遷移させる
  const session = await locals.auth.validate();

  if (!session) {
    redirect(TEMPORARY_REDIRECT, '/login');
  }

  const form = await superValidate(null, zod(workBookSchema));
  const author = locals.user;
  const isAdmin = author.role === Roles.ADMIN;

  // FIXME: 一般ユーザが問題集を作成できるようになったら削除する
  if (!isAdmin) {
    error(FORBIDDEN, `アクセス権限がありません。`);
  }

  const tasksMapByIds = await tasksCrud.getTasksByTaskId();

  return { form: form, author: author, isAdmin: isAdmin, tasksMapByIds: tasksMapByIds };
};

export const actions = {
  default: async ({ locals, request }) => {
    console.log('form -> actions -> create');
    await getLoggedInUser(locals);
    const form = await superValidate(request, zod(workBookSchema));

    if (!form.valid) {
      return fail(BAD_REQUEST, {
        form: {
          ...form,
          message:
            '問題集の入力項目に不正な値があります。修正してから「作成」ボタンを押してください。',
        },
      });
    }

    const workBook: WorkBook = form.data;

    try {
      await workBooksCrud.createWorkBook(workBook);
    } catch (e) {
      console.error('Failed to create a workbook', e);
      return fail(BAD_REQUEST, {
        form: {
          ...form,
          message: '問題集の作成に失敗しました。しばらくしてから、もう一度試してください。',
        },
      });
    }

    // TODO: リダイレクトのときもメッセージを表示することはできるか調べる
    return redirect(TEMPORARY_REDIRECT, '/workbooks');
  },
};
