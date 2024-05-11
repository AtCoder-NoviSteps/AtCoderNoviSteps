import { default as db } from '$lib/server/database';
import type { WorkBook, WorkBookTaskBase, WorkBookType } from '$lib/types/workbook';
import { getWorkBookTasks, validateRequiredFields } from '$lib/services/workbook_tasks';

export async function getWorkBooks() {
  const workbooks = await db.workBook.findMany({
    orderBy: {
      id: 'asc',
    },
    include: {
      workBookTasks: true,
    },
  });

  return workbooks;
}

export async function getWorkBook(workBookId: number) {
  const workBook = await db.workBook.findUnique({
    where: {
      id: workBookId,
    },
    include: {
      workBookTasks: true,
    },
  });

  return workBook;
}

// See:
// https://www.prisma.io/docs/orm/prisma-schema/data-model/relations#create-a-record-and-nested-records
export async function createWorkBook(workBook: WorkBook) {
  const newWorkBookTasks: WorkBookTaskBase[] = await getWorkBookTasks(workBook);
  const newWorkBook = await db.workBook.create({
    data: {
      authorId: workBook.authorId,
      title: workBook.title,
      description: workBook.description,
      isPublished: workBook.isPublished,
      isOfficial: workBook.isOfficial,
      workBookType: workBook.workBookType as WorkBookType,
      workBookTasks: {
        create: newWorkBookTasks,
      },
    },
    include: {
      workBookTasks: true,
    },
  });

  console.log(newWorkBook);
}

async function isExistingWorkBook(workBookId: number) {
  const workBook = await getWorkBook(workBookId);

  if (workBook) {
    return true;
  } else {
    return false;
  }
}

export async function updateWorkBook(workBookId: number, workBook: WorkBook) {
  if (!(await isExistingWorkBook(workBookId))) {
    throw new Error(`Not found WorkBook with id ${workBookId}.`);
  }

  const newWorkBookTasks: WorkBookTaskBase[] = await getWorkBookTasks(workBook);

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
    console.error(`Failed to update WorkBook with id ${workBookId}:`, error);
    throw error;
  }
}

export async function deleteWorkBook(workBookId: number) {
  if (!(await isExistingWorkBook(workBookId))) {
    throw new Error(`Not found WorkBook with id ${workBookId}.`);
  }

  await db.workBook.delete({
    where: {
      id: workBookId,
    },
  });
}
