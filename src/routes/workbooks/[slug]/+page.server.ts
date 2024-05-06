import { error } from '@sveltejs/kit';

import * as workBooksCrud from '$lib/services/workbooks';
import * as userCrud from '$lib/services/users';
import * as taskCrud from '$lib/services/tasks';
import { BAD_REQUEST, NOT_FOUND } from '$lib/constants/http-response-status-codes';

// TODO: 一般公開するまでは、管理者のみアクセスできるようにする
// See:
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/parseInt
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
export async function load({ params }) {
  const id = parseInt(params.slug);

  if (Number.isNaN(id)) {
    throw error(BAD_REQUEST, `不正な問題集idです。`);
  }

  const workbook = await workBooksCrud.getWorkBook(id);

  if (!workbook) {
    throw error(NOT_FOUND, `問題集id: ${id} は見つかりませんでした。`);
  }

  const workbookAuthor = await userCrud.getUserById(workbook.userId);

  // ユーザが問題集を作成したあとに、アカウントが削除されていないかを確認
  const authorId = workbookAuthor ? workbookAuthor.id : 'unknown';
  // FIXME: ユーザの回答状況を反映させるため、taskResultsに置き換え
  const tasks = await taskCrud.getTasksByTaskId();

  return { workbook: workbook, authorId: authorId, tasks: tasks };
}
