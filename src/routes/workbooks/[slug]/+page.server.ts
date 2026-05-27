import { error, fail, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { Roles } from '$lib/types/user';

import * as taskResultsCrud from '$lib/services/task_results';
import { getWorkbookWithAuthor } from '$features/workbooks/services/workbooks';
import * as action from '$lib/actions/update_task_result';
import { getVoteGradeStatisticsForTaskIds } from '$features/votes/services/vote_statistics';
import { voteAbsoluteGrade as voteAbsoluteGradeAction } from '$features/votes/actions/vote_actions';
import { voteAbsoluteGradeSchema } from '$features/votes/zod/schema';

import { isAdmin, canRead } from '$lib/utils/authorship';
import { getLoggedInUser } from '$features/auth/services/session';
import { parseWorkBookId, parseWorkBookUrlSlug } from '$features/workbooks/utils/workbook';

import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '$lib/constants/http-response-status-codes';

export async function load({ locals, params, url }) {
  const loggedInUser = await getLoggedInUser(locals, url);
  const loggedInAsAdmin = isAdmin(loggedInUser?.role as Roles);
  const slug = params.slug.toLowerCase();

  if (!parseWorkBookId(slug) && !parseWorkBookUrlSlug(slug)) {
    error(BAD_REQUEST, '不正な問題集idです。');
  }

  const workbookWithAuthor = await getWorkbookWithAuthor(slug);

  if (!workbookWithAuthor) {
    error(NOT_FOUND, `問題集id: ${slug} は見つかりませんでした。`);
  }

  const workBook = workbookWithAuthor.workBook;
  const isPublished = workBook.isPublished;
  const authorId = workBook.authorId;

  if (loggedInUser && !canRead(isPublished, loggedInUser.id, authorId)) {
    error(FORBIDDEN, `問題集id: ${slug} にアクセスする権限がありません。`);
  }

  const taskIds = workBook.workBookTasks.map((t) => t.taskId);
  const [taskResults, voteStatisticsMap] = await Promise.all([
    taskResultsCrud.getTaskResultsByTaskId(workBook.workBookTasks, loggedInUser?.id as string),
    getVoteGradeStatisticsForTaskIds(taskIds),
  ]);

  return {
    isLoggedIn: loggedInUser !== null,
    isAtCoderVerified: locals.user?.is_validated === true,
    loggedInAsAdmin: loggedInAsAdmin,
    ...workbookWithAuthor,
    taskResults: taskResults,
    voteStatisticsMap: voteStatisticsMap,
  };
}

export const actions = {
  update: async ({ request, locals }) => {
    const operationLog = 'workbook -> actions -> update';
    return await action.updateTaskResult({ request, locals }, operationLog);
  },
  voteAbsoluteGrade: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(voteAbsoluteGradeSchema));
    if (!form.valid) {
      return fail(BAD_REQUEST, { form });
    }
    return await voteAbsoluteGradeAction({ locals, data: form.data });
  },
} satisfies Actions;
