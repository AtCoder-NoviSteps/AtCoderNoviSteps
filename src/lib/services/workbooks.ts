import { default as db } from '$lib/server/database';
import type { WorkBook, WorkBookType } from '$lib/types/workbook';

export async function getWorkBooks() {
  const workbooks = await db.workBook.findMany({ orderBy: { id: 'asc' } });

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
  const newWorkBookTasks = await Promise.all(
    workBook.workBookTasks.map(async (task) => {
      return {
        taskId: task.taskId,
        priority: task.priority,
      };
    }),
  );

  const newWorkBook = await db.workBook.create({
    data: {
      userId: workBook.userId,
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

// TODO: updateWorkBook(workBookId)

// TODO: deleteWorkBook(workBookId)
