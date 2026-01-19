import { redirect, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';

import { getLoggedInUser, canEdit, isAdmin } from '$lib/utils/authorship';
import { Roles } from '$lib/types/user';
import {
  FORBIDDEN,
  TEMPORARY_REDIRECT,
  INTERNAL_SERVER_ERROR,
} from '$lib/constants/http-response-status-codes';
import { getWorkbookWithAuthor } from '$lib/utils/workbook';
import { workBookSchema } from '$lib/zod/schema';
import * as tasksCrud from '$lib/services/tasks';
import * as workBooksCrud from '$lib/services/workbooks';

/**
 * Loads workbook and author data, initializes a validation form and task lookups, and enforces edit permissions for the current user.
 *
 * @returns An object containing the initialized `form` (prefilled with the workbook), `loggedInAsAdmin` flag, the workbook with author data, `tasks`, and `tasksMapByIds`. If a logged-in user exists but is not authorized to edit the workbook, the returned object includes `status: FORBIDDEN` and a `message` describing the access restriction. */
export async function load({ locals, params }) {
  const loggedInUser = await getLoggedInUser(locals);
  const loggedInAsAdmin = isAdmin(loggedInUser?.role as Roles);
  const slug = params.slug.toLowerCase();
  const workBookWithAuthor = await getWorkbookWithAuthor(slug);

  const form = await superValidate(null, zod4(workBookSchema));
  const workBook = {
    ...workBookWithAuthor.workBook,
    urlSlug: workBookWithAuthor.workBook.urlSlug ?? undefined,
  };
  form.data = { ...form.data, ...workBook };
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
      message: `問題集id: ${slug}にアクセスする権限がありません。`,
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
    const form = await superValidate(request, zod4(workBookSchema));

    if (!form.valid) {
      return {
        form: {
          ...form,
          message:
            '問題集の入力項目に不正な値があります。修正してから、「更新」ボタンを押してください。',
        },
      };
    }

    const workBook = form.data;
    const slug = params.slug.toLowerCase();
    const workBookWithAuthor = await getWorkbookWithAuthor(slug);
    const workBookId = workBookWithAuthor.workBook.id;

    try {
      await workBooksCrud.updateWorkBook(workBookId, { ...workBook, id: workBookId });
    } catch (e) {
      console.error(`Failed to update WorkBook with id ${workBookId}:`, e);

      return fail(INTERNAL_SERVER_ERROR, {
        form: {
          ...form,
          message: `問題集: ${workBookId} の更新に失敗しました。しばらくしてから、もう一度試してください。`,
        },
      });
    }

    redirect(TEMPORARY_REDIRECT, '/workbooks');
  },
};