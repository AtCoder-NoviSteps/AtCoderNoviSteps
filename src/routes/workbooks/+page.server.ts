import { error } from '@sveltejs/kit';

import * as workBooksCrud from '$features/workbooks/services/workbooks';
import * as taskCrud from '$lib/services/tasks';
import * as taskResultsCrud from '$lib/services/task_results';

import { getLoggedInUser, canDelete } from '$lib/utils/authorship';
import { parseWorkBookId } from '$features/workbooks/utils/workbook';

import {
  BAD_REQUEST,
  FORBIDDEN,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} from '$lib/constants/http-response-status-codes';

export async function load({ locals }) {
  const loggedInUser = await getLoggedInUser(locals);

  try {
    // Each query is independent, so we execute them in parallel with Promise.all
    const [workbooks, tasksMapByIds, taskResultsByTaskId] = await Promise.all([
      workBooksCrud.getWorkBooksWithAuthors(),
      // Used to get the most frequent grade of the tasks that make up the workbook
      taskCrud.getTasksByTaskId(),
      // Used to display the user's answer status
      taskResultsCrud.getTaskResultsOnlyResultExists(loggedInUser?.id as string, true),
    ]);

    return {
      workbooks: workbooks,
      tasksMapByIds: tasksMapByIds,
      taskResultsByTaskId: taskResultsByTaskId,
      loggedInUser: loggedInUser,
    };
  } catch (e) {
    console.error('Failed to fetch workbooks, tasks or task results: ', e);
    error(
      INTERNAL_SERVER_ERROR,
      '問題もしくは回答の取得に失敗しました。しばらくしてから、もう一度試してください。',
    );
  }
}

export const actions = {
  delete: async ({ locals, request }) => {
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
      console.log(`Deleted workbook ${workBookId} by user ${loggedInUser?.id}`);
    } catch (e) {
      console.error(`Failed to delete WorkBook with id ${workBookId}:`, e);
      error(
        INTERNAL_SERVER_ERROR,
        `問題集id: ${workBookId} の削除に失敗しました。しばらくしてから、もう一度試してください。`,
      );
    }
  },
};
