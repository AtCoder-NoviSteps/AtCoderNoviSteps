import { error } from '@sveltejs/kit';

import * as workBooksCrud from '$lib/services/workbooks';
import * as taskCrud from '$lib/services/tasks';
import * as taskResultsCrud from '$lib/services/task_results';
import * as userCrud from '$lib/services/users';
import { getLoggedInUser, canDelete } from '$lib/utils/authorship';
import { parseWorkBookId } from '$lib/utils/workbook';
import {
  BAD_REQUEST,
  FORBIDDEN,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} from '$lib/constants/http-response-status-codes';

// See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
export async function load({ locals }) {
  const loggedInUser = await getLoggedInUser(locals);

  const workbooks = await workBooksCrud.getWorkBooks();
  const workbooksWithAuthors = await Promise.all(
    workbooks.map(async (workbook) => {
      const workbookAuthor = await userCrud.getUserById(workbook.authorId);

      if (workbookAuthor) {
        return { ...workbook, authorName: workbookAuthor.username };
      } else {
        // ユーザが問題集を作成したあとに、アカウントを削除した場合
        return { ...workbook, authorName: 'unknown' };
      }
    }),
  );

  // 問題集を構成する問題のグレードの上下限を取得するために使用
  const tasksByTaskId = await taskCrud.getTasksByTaskId();
  // ユーザの回答状況を表示するために使用
  const taskResultsByTaskId = await taskResultsCrud.getTaskResultsOnlyResultExists(
    loggedInUser?.id as string,
    true,
  );

  return {
    workbooks: workbooksWithAuthors,
    tasksByTaskId: tasksByTaskId,
    taskResultsByTaskId: taskResultsByTaskId,
    loggedInUser: loggedInUser,
  };
}

export const actions = {
  delete: async ({ locals, request }) => {
    console.log('form -> actions -> delete');
    const loggedInUser = await getLoggedInUser(locals);

    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const workBookId = parseWorkBookId(slug as string);

    if (workBookId === null) {
      error(BAD_REQUEST, '不正な問題集idです。');
    }

    const workBook = await workBooksCrud.getWorkBook(workBookId);

    if (!workBook) {
      error(NOT_FOUND, `問題集id: ${workBookId} は見つかりませんでした。`);
    }
    if (loggedInUser && !canDelete(loggedInUser.id, workBook.authorId)) {
      error(FORBIDDEN, `問題集id: ${workBookId} にアクセスする権限がありません。`);
    }

    try {
      await workBooksCrud.deleteWorkBook(workBookId);
    } catch (e) {
      console.error(`Failed to delete WorkBook with id ${workBookId}:`, e);
      error(
        INTERNAL_SERVER_ERROR,
        `問題集id: ${workBookId} の削除に失敗しました。しばらくしてから、もう一度試してください。`,
      );
    }
  },
};
