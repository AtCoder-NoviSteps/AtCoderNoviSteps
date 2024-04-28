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
  });

  return workBook;
}

export async function createWorkBook(workBook: WorkBook) {
  const newWorkBook = await db.workBook.create({
    data: {
      userId: workBook.authorId,
      title: workBook.title,
      isPublished: workBook.isPublished,
      isOfficial: workBook.isOfficial,
      workBookType: workBook.workBookType as WorkBookType,
    },
  });

  console.log(newWorkBook);
}

// TODO: updateWorkBook(workBookId)

// TODO: deleteWorkBook(workBookId)
