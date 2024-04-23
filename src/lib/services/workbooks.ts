import { default as db } from '$lib/server/database';
import type { WorkBook, WorkBookType } from '$lib/types/workbook';

export async function getWorkBooks() {
  const workbooks = await db.workBook.findMany({ orderBy: { id: 'asc' } });

  return workbooks;
}

// TODO: getWorkBook(workBookId)

export async function createWorkBook(workBook: WorkBook) {
  const newWorkBook = await db.workBook.create({
    data: {
      userId: workBook.userId,
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
