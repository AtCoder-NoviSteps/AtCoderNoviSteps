import { error } from '@sveltejs/kit';
import { default as db } from '$lib/server/database';

import type {
  WorkBook,
  WorkBooks,
  WorkBookTasksBase,
  WorkBookType,
} from '$features/workbooks/types/workbook';

import {
  getWorkBookTasks,
  validateRequiredFields,
} from '$features/workbooks/services/workbook_tasks';
import * as userCrud from '$lib/services/users';

import { sanitizeUrl } from '$lib/utils/url';
import { parseWorkBookId, parseWorkBookUrlSlug } from '$features/workbooks/utils/workbook';
import { BAD_REQUEST, NOT_FOUND } from '$lib/constants/http-response-status-codes';

export async function getWorkBooks(): Promise<WorkBooks> {
  const workbooks = await db.workBook.findMany({
    orderBy: {
      id: 'asc',
    },
    include: {
      workBookTasks: {
        orderBy: {
          priority: 'asc',
        },
      },
    },
  });

  return workbooks;
}

export async function getWorkBook(workBookId: number): Promise<WorkBook | null> {
  const workBook = await db.workBook.findUnique({
    where: {
      id: workBookId,
    },
    include: {
      workBookTasks: {
        orderBy: {
          priority: 'asc',
        },
      },
    },
  });

  return workBook;
}

/**
 * Retrieves a WorkBook from the database by its URL slug.
 *
 * @param urlSlug - The URL slug identifier for the WorkBook to retrieve (e.g., 'bfs', 'dfs', 'union-find', '2-sat').
 * @returns A Promise that resolves to the found WorkBook (with included workBookTasks
 *          ordered by priority) or null if no WorkBook with the given slug exists
 */
export async function getWorkBookByUrlSlug(urlSlug: string): Promise<WorkBook | null> {
  const workBook = await db.workBook.findUnique({
    where: {
      urlSlug: urlSlug,
    },
    include: {
      workBookTasks: {
        orderBy: {
          priority: 'asc',
        },
      },
    },
  });

  return workBook;
}

export async function getWorkbookWithAuthor(
  slug: string,
): Promise<{ workBook: WorkBook; isExistingAuthor: boolean }> {
  const workBookId = parseWorkBookId(slug);
  const workBookUrlSlug = parseWorkBookUrlSlug(slug);

  if (workBookId === null && workBookUrlSlug === null) {
    error(BAD_REQUEST, '不正な問題集idです。');
  }

  let workBook: WorkBook | null = null;

  if (workBookId) {
    workBook = await getWorkBook(workBookId);
  } else if (workBookUrlSlug) {
    workBook = await getWorkBookByUrlSlug(workBookUrlSlug);
  }

  if (workBook === null) {
    error(NOT_FOUND, `問題集id: ${slug} は見つかりませんでした。`);
  }

  // Validate if the author of the workbook exists after the workbook has been created.
  const workbookAuthor = await userCrud.getUserById(workBook.authorId);
  const isExistingAuthor = !!workbookAuthor;

  return { workBook: workBook, isExistingAuthor: isExistingAuthor };
}

// See:
// https://www.prisma.io/docs/orm/prisma-schema/data-model/relations#create-a-record-and-nested-records
export async function createWorkBook(workBook: Omit<WorkBook, 'id'>): Promise<void> {
  const slug = workBook.urlSlug;

  if (slug && (await isExistingUrlSlug(slug))) {
    throw new Error(`WorkBook slug ${slug} has already existed`);
  }

  const sanitizedUrl = sanitizeUrl(workBook.editorialUrl);
  const newWorkBookTasks: WorkBookTasksBase = await getWorkBookTasks(workBook);

  const newWorkBook = await db.workBook.create({
    data: {
      authorId: workBook.authorId,
      title: workBook.title,
      description: workBook.description,
      editorialUrl: sanitizedUrl,
      isPublished: workBook.isPublished,
      isOfficial: workBook.isOfficial,
      isReplenished: workBook.isReplenished,
      workBookType: workBook.workBookType as WorkBookType,
      urlSlug: workBook.urlSlug,
      workBookTasks: {
        create: newWorkBookTasks,
      },
    },
    include: {
      workBookTasks: true,
    },
  });

  console.log(`Created workbook with title: ${newWorkBook.title}`);
}

async function isExistingUrlSlug(slug: string): Promise<boolean> {
  return !!(await getWorkBookByUrlSlug(slug));
}

async function isExistingWorkBook(workBookId: number): Promise<boolean> {
  const workBook = await getWorkBook(workBookId);

  if (workBook) {
    return true;
  } else {
    return false;
  }
}

export async function updateWorkBook(workBookId: number, workBook: WorkBook): Promise<void> {
  if (!(await isExistingWorkBook(workBookId))) {
    throw new Error(`Not found WorkBook with id ${workBookId}.`);
  }

  const newWorkBookTasks: WorkBookTasksBase = await getWorkBookTasks(workBook);

  validateRequiredFields(newWorkBookTasks);

  try {
    // 指定した問題集の問題を一度全て削除してから、新しいものを作成
    await db.$transaction([
      db.workBookTask.deleteMany({
        where: { workBookId: workBookId },
      }),
      db.workBook.update({
        where: { id: workBookId },
        data: {
          ...workBook,
          workBookTasks: {
            create: newWorkBookTasks,
          },
        },
      }),
    ]);

    console.log(await getWorkBook(workBookId));
  } catch (error) {
    console.error(
      `Failed to update WorkBook with id ${workBookId} and title ${workBook.title}:`,
      error,
    );
    throw error;
  }
}

export async function deleteWorkBook(workBookId: number): Promise<void> {
  if (!(await isExistingWorkBook(workBookId))) {
    throw new Error(`Not found WorkBook with id ${workBookId}.`);
  }

  await db.workBook.delete({
    where: {
      id: workBookId,
    },
  });
}
