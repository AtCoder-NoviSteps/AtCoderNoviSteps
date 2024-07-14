import { error, type Actions } from '@sveltejs/kit';

import { getLoggedInUser, isAdmin, canRead } from '$lib/utils/authorship';
import { Roles } from '$lib/types/user';
import { getWorkbookWithAuthor, parseWorkBookId } from '$lib/utils/workbook';
import * as taskResultsCrud from '$lib/services/task_results';
import type { TaskResult } from '$lib/types/task';
import { BAD_REQUEST, FORBIDDEN } from '$lib/constants/http-response-status-codes';
import * as action from '$lib/actions/update_task_result';

export async function load({ locals, params }) {
  const loggedInUser = await getLoggedInUser(locals);
  const loggedInAsAdmin = isAdmin(loggedInUser?.role as Roles);
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

  const taskResults: Map<string, TaskResult> = await taskResultsCrud.getTaskResultsByTaskId(
    workBook.workBookTasks,
    loggedInUser?.id as string,
  );

  return {
    isLoggedIn: loggedInUser !== null,
    loggedInAsAdmin: loggedInAsAdmin,
    ...workbookWithAuthor,
    taskResults: taskResults,
  };
}

export const actions = {
  update: async ({ request, locals }) => {
    const operationLog = 'workbook -> actions -> update';
    return await action.updateTaskResult({ request, locals }, operationLog);
  },
} satisfies Actions;
