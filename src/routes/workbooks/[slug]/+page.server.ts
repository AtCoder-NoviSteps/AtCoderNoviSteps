import { error, type Actions } from '@sveltejs/kit';

import { Roles } from '$lib/types/user';
import type { TaskResult } from '$lib/types/task';

import * as taskResultsCrud from '$lib/services/task_results';
import * as action from '$lib/actions/update_task_result';

import { getLoggedInUser, isAdmin, canRead } from '$lib/utils/authorship';
import { getWorkbookWithAuthor, findWorkBookIdFrom } from '$lib/utils/workbook';
import { BAD_REQUEST, FORBIDDEN } from '$lib/constants/http-response-status-codes';

export async function load({ locals, params }) {
  const loggedInUser = await getLoggedInUser(locals);
  const loggedInAsAdmin = isAdmin(loggedInUser?.role as Roles);
  const slug = params.slug.toLowerCase();
  const workBookId = await findWorkBookIdFrom(slug);

  if (workBookId === null) {
    error(BAD_REQUEST, '不正な問題集idです。');
  }

  const workbookWithAuthor = await getWorkbookWithAuthor(slug);
  const workBook = workbookWithAuthor.workBook;
  const isPublished = workBook.isPublished;
  const authorId = workBook.authorId;

  if (loggedInUser && !canRead(isPublished, loggedInUser.id, authorId)) {
    error(FORBIDDEN, `問題集id: ${slug} にアクセスする権限がありません。`);
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
