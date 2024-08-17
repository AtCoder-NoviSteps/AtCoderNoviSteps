import { default as db } from '$lib/server/database';
import type { WorkBook, WorkBooks, WorkBookTasksBase, WorkBookType } from '$lib/types/workbook';
import { getWorkBookTasks, validateRequiredFields } from '$lib/services/workbook_tasks';
import { sanitizeUrl } from '$lib/utils/url';

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

// See:
// https://www.prisma.io/docs/orm/prisma-schema/data-model/relations#create-a-record-and-nested-records
export async function createWorkBook(workBook: WorkBook): Promise<void> {
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
