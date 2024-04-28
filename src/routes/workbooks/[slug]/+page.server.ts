import { error } from '@sveltejs/kit';

import * as workBooksCrud from '$lib/services/workbooks';
import * as userCrud from '$lib/services/users';
import { BAD_REQUEST, NOT_FOUND } from '$lib/constants/http-response-status-codes';

// FIXME: データベースから取得できるようになったら削除する
const sampleWorkbook = new Map();

sampleWorkbook.set(1, {
  tasks: [
    { status_name: 'AC', contest_id: 'ABC222', title: 'A. Four Digits', task_id: 'abc222_a' },
    { status_name: '挑戦中', contest_id: 'ABC180', title: 'A. box', task_id: 'abc180_a' },
    {
      status_name: '未挑戦',
      contest_id: 'ABC169',
      title: 'A. Multiplication 1',
      task_id: 'abc169_a',
    },
  ],
});
sampleWorkbook.set(2, {
  tasks: [
    { status_name: '挑戦中', contest_id: 'ABC222', title: 'A. Four Digits', task_id: 'abc222_a' },
    { status_name: 'AC', contest_id: 'ABC178', title: 'A. Not', task_id: 'abc178_a' },
    { status_name: '解説AC', contest_id: 'ABC172', title: 'A. Calc', task_id: 'abc172_a' },
  ],
});

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
  let tasks = null;

  // FIXME: 問題集を構成する問題と置き換え
  // TODO: DBから取得できるようにする
  if (sampleWorkbook.has(id)) {
    tasks = sampleWorkbook.get(id).tasks;
  }

  // ユーザが問題集を作成したあとに、アカウントが削除されていないかを確認
  const authorId = workbookAuthor ? workbookAuthor.id : 'unknown';

  return { workbook: workbook, authorId: authorId, tasks: tasks };
}
