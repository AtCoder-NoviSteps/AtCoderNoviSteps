import { redirect, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

import { getLoggedInUser, canEdit, isAdmin } from '$lib/utils/authorship';
import { Roles } from '$lib/types/user';
import {
  BAD_REQUEST,
  FORBIDDEN,
  TEMPORARY_REDIRECT,
} from '$lib/constants/http-response-status-codes';
import { getWorkbookWithAuthor, validateWorkBookId } from '$lib/utils/workbook';
import { workBookSchema } from '$lib/zod/schema';
import * as tasksCrud from '$lib/services/tasks';
import * as workBooksCrud from '$lib/services/workbooks';

export async function load({ locals, params }) {
  const loggedInUser = await getLoggedInUser(locals);
  const loggedInAsAdmin = isAdmin(loggedInUser?.role as Roles);
  const workBookWithAuthor = await getWorkbookWithAuthor(params.slug);

  const form = await superValidate(null, zod(workBookSchema));
  form.data = { ...form.data, ...workBookWithAuthor.workBook };
  const tasks = await tasksCrud.getTasks();
  const tasksMapByIds = await tasksCrud.getTasksByTaskId();

  // ユーザidと問題集の作成者idが一致しない場合、ページへのアクセス権限がないことを表示する
  // 例外として、管理者はユーザの問題集を編集できる
  // HACK: load関数内でfailを使うと、プレーンオブジェクトを返していないというエラーが解決できず
  // やむを得ず、return文で直接オブジェクトを返しているが、もっとシンプルに記述できるはず
  if (
    loggedInUser &&
    !canEdit(
      loggedInUser.id,
      workBookWithAuthor.workBook.authorId,
      loggedInUser.role as Roles,
      workBookWithAuthor.workBook.isPublished,
    )
  ) {
    return {
      status: FORBIDDEN,
      message: `問題集id: ${params.slug}にアクセスする権限がありません。`,
      form,
      loggedInAsAdmin: loggedInAsAdmin,
      ...workBookWithAuthor,
      tasks,
      tasksMapByIds,
    };
  }

  return {
    form: form,
    loggedInAsAdmin: loggedInAsAdmin,
    ...workBookWithAuthor,
    tasks: tasks,
    tasksMapByIds: tasksMapByIds,
  };
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

    redirect(TEMPORARY_REDIRECT, '/workbooks');
  },
};
