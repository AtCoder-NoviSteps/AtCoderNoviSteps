import { default as db } from '$lib/server/database';

import type {
  WorkBook,
  WorkBooks,
  WorkbooksWithAuthors,
  WorkBookTasksBase,
  WorkBookType,
} from '$features/workbooks/types/workbook';
import { WorkBookType as WorkBookTypeConst } from '$features/workbooks/types/workbook';
import {
  type PlacementQuery,
  SolutionCategory,
} from '$features/workbooks/types/workbook_placement';

import {
  getWorkBookTasks,
  validateRequiredFields,
} from '$features/workbooks/services/workbook_tasks';
import * as userCrud from '$lib/services/users';

import { sanitizeUrl } from '$lib/utils/url';
import { parseWorkBookId, parseWorkBookUrlSlug } from '$features/workbooks/utils/workbook';

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

export async function getWorkBooksWithAuthors(): Promise<WorkbooksWithAuthors> {
  const workbooks = await db.workBook.findMany({
    orderBy: {
      id: 'asc',
    },
    include: {
      user: {
        select: { username: true },
      },
      workBookTasks: {
        orderBy: {
          priority: 'asc',
        },
      },
    },
  });

  return mapWithAuthorName(workbooks);
}

/**
 * Returns workbooks filtered by WorkBookPlacement, ordered by priority ASC.
 * Workbooks without a placement record are automatically excluded by Prisma's nested where filter.
 *
 * @param query - Discriminated union: CURRICULUM uses taskGrade; SOLUTION uses solutionCategory
 * @param includeUnpublished - When true, unpublished workbooks are included (admin use)
 */
export async function getWorkbooksByPlacement(
  query: PlacementQuery,
  includeUnpublished = false,
): Promise<WorkbooksWithAuthors> {
  const placementFilter =
    query.workBookType === WorkBookTypeConst.CURRICULUM
      ? { taskGrade: query.taskGrade }
      : { solutionCategory: query.solutionCategory };

  const workbooks = await db.workBook.findMany({
    where: {
      workBookType: query.workBookType,
      ...(includeUnpublished ? {} : { isPublished: true }),
      placement: placementFilter,
    },
    orderBy: {
      placement: { priority: 'asc' },
    },
    include: {
      user: {
        select: { username: true },
      },
      workBookTasks: {
        orderBy: { priority: 'asc' },
      },
    },
  });

  return mapWithAuthorName(workbooks);
}

/**
 * Returns all CREATED_BY_USER workbooks with author names, ordered by id ASC.
 * Intended for admin-only display on the workbooks list page.
 */
export async function getWorkBooksCreatedByUsers(): Promise<WorkbooksWithAuthors> {
  const workbooks = await db.workBook.findMany({
    where: { workBookType: WorkBookTypeConst.CREATED_BY_USER },
    orderBy: { id: 'asc' },
    include: {
      user: {
        select: { username: true },
      },
      workBookTasks: {
        orderBy: { priority: 'asc' },
      },
    },
  });

  return mapWithAuthorName(workbooks);
}

/**
 * Returns the list of SolutionCategory values that have at least one published
 * SOLUTION workbook with a placement record.
 */
export async function getAvailableSolutionCategories(): Promise<SolutionCategory[]> {
  const placements = await db.workBookPlacement.findMany({
    where: {
      workBook: { isPublished: true, workBookType: WorkBookTypeConst.SOLUTION },
      solutionCategory: { not: null },
    },
    select: { solutionCategory: true },
    distinct: ['solutionCategory'],
  });

  return placements
    .map((placement) => placement.solutionCategory)
    .filter((category): category is SolutionCategory => category !== null);
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
): Promise<{ workBook: WorkBook; isExistingAuthor: boolean } | null> {
  const workBookId = parseWorkBookId(slug);
  const workBookUrlSlug = parseWorkBookUrlSlug(slug);

  let workBook: WorkBook | null = null;

  if (workBookId) {
    workBook = await getWorkBook(workBookId);
  } else if (workBookUrlSlug) {
    workBook = await getWorkBookByUrlSlug(workBookUrlSlug);
  }

  if (workBook === null) {
    return null;
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
  const newWorkBookTasks: WorkBookTasksBase = getWorkBookTasks(workBook);

  await db.workBook.create({
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

  console.log('Workbook created successfully');
}

async function isExistingUrlSlug(slug: string): Promise<boolean> {
  return !!(await getWorkBookByUrlSlug(slug));
}

async function isExistingWorkBook(workBookId: number): Promise<boolean> {
  return (await db.workBook.count({ where: { id: workBookId } })) > 0;
}

export async function updateWorkBook(workBookId: number, workBook: WorkBook): Promise<void> {
  if (!(await isExistingWorkBook(workBookId))) {
    throw new Error(`Not found WorkBook with id ${workBookId}.`);
  }

  const newWorkBookTasks: WorkBookTasksBase = getWorkBookTasks(workBook);

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

// ---- Private helpers ----

function mapWithAuthorName<T extends { user: { username: string } | null }>(
  workbooks: T[],
): (T & { authorName: string })[] {
  return workbooks.map((workbook) => ({
    ...workbook,
    authorName: workbook.user?.username ?? 'unknown',
  }));
}
