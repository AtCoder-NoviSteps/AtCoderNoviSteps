import { error, redirect } from '@sveltejs/kit';

import * as taskCrud from '$lib/services/tasks';
import * as taskResultsCrud from '$lib/services/task_results';
import * as workBooksCrud from '$features/workbooks/services/workbooks';

import { Roles } from '$lib/types/user';
import {
  WorkBookTab,
  type WorkBookTab as WorkBookTabType,
} from '$features/workbooks/types/workbook';
import {
  type PlacementQuery,
  getPublishedWorkbooksByPlacement,
  getWorkBooksCreatedByUsers,
  getAvailableSolutionCategories,
} from '$features/workbooks/services/workbooks';
import { isAdmin, getLoggedInUser, canDelete } from '$lib/utils/authorship';
import {
  parseWorkBookTab,
  parseWorkBookGrade,
  parseWorkBookCategory,
} from '$features/workbooks/utils/workbook_url_params';
import { parseWorkBookId } from '$features/workbooks/utils/workbook';
import { WorkBookType } from '$features/workbooks/types/workbook';

import {
  BAD_REQUEST,
  FORBIDDEN,
  FOUND,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} from '$lib/constants/http-response-status-codes';

export async function load({ locals, url }) {
  const loggedInUser = await getLoggedInUser(locals);
  const params = url.searchParams;

  const tab = parseWorkBookTab(params);

  // CREATED_BY_USER tab is admin-only
  if (tab === WorkBookTab.CREATED_BY_USER && (!loggedInUser || !isAdmin(loggedInUser.role as Roles))) {
    redirect(FOUND, '/workbooks');
  }

  const selectedGrade = parseWorkBookGrade(params);
  const selectedCategory = parseWorkBookCategory(params);

  try {
    const [workbooks, availableCategories, tasksMapByIds, taskResultsByTaskId] = await Promise.all([
      fetchWorkbooksByTab(tab, selectedGrade, selectedCategory),
      getAvailableSolutionCategories(),
      taskCrud.getTasksByTaskId(),
      loggedInUser
        ? taskResultsCrud.getTaskResultsOnlyResultExists(loggedInUser.id, true)
        : Promise.resolve(new Map()),
    ]);

    return {
      workbooks,
      availableCategories,
      tasksMapByIds,
      taskResultsByTaskId,
      loggedInUser,
      tab,
      selectedGrade,
      selectedCategory,
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

function fetchWorkbooksByTab(
  tab: WorkBookTabType,
  grade: ReturnType<typeof parseWorkBookGrade>,
  category: ReturnType<typeof parseWorkBookCategory>,
) {
  if (tab === WorkBookTab.CREATED_BY_USER) {
    return getWorkBooksCreatedByUsers();
  }

  return getPublishedWorkbooksByPlacement(buildPlacementQuery(tab, grade, category));
}

function buildPlacementQuery(
  tab: WorkBookTabType,
  grade: ReturnType<typeof parseWorkBookGrade>,
  category: ReturnType<typeof parseWorkBookCategory>,
): PlacementQuery {
  if (tab === WorkBookTab.CURRICULUM) {
    return { workBookType: WorkBookType.CURRICULUM, taskGrade: grade };
  }

  return { workBookType: WorkBookType.SOLUTION, solutionCategory: category };
}
