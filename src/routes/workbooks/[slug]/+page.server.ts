import { error } from '@sveltejs/kit';

import { getLoggedInUser, canRead } from '$lib/utils/authorship';
import { getWorkbookWithAuthor, parseWorkBookId } from '$lib/utils/workbook';
import * as taskCrud from '$lib/services/tasks';
import { BAD_REQUEST, FORBIDDEN } from '$lib/constants/http-response-status-codes';

export async function load({ locals, params }) {
  const loggedInUser = await getLoggedInUser(locals);
  const workBookId = parseWorkBookId(params.slug);

  if (workBookId === null) {
    error(BAD_REQUEST, '不正な問題集idです。');
  }

  const workbookWithAuthor = await getWorkbookWithAuthor(params.slug);
  const workBook = workbookWithAuthor.workBook;
  const isPublished = workBook.isPublished;
  const authorId = workBook.authorId;

  if (loggedInUser && !canRead(isPublished, loggedInUser.id, authorId)) {
    error(FORBIDDEN, `問題集id: ${params.slug} にアクセスする権限がありません。`);
  }

  // FIXME: ユーザの回答状況を反映させるため、taskResultsに置き換え
  const tasks = await taskCrud.getTasksByTaskId();

  return { ...workbookWithAuthor, tasks: tasks };
}
