import { error } from '@sveltejs/kit';

import type { WorkBook } from '$lib/types/workbook';
import * as userCrud from '$lib/services/users';
import * as workBookCrud from '$lib/services/workbooks';
import { BAD_REQUEST, NOT_FOUND } from '$lib/constants/http-response-status-codes';

// See:
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/parseInt
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
export async function getWorkbookWithAuthor(
  slug: string,
): Promise<{ workBook: WorkBook; isExistingAuthor: boolean }> {
  const id = parseInt(slug);

  if (Number.isNaN(id)) {
    error(BAD_REQUEST, '不正な問題集idです。');
  }

  const workBook = await workBookCrud.getWorkBook(id);

  if (!workBook) {
    error(NOT_FOUND, `問題集id: ${id} は見つかりませんでした。`);
  }

  // ユーザが問題集を作成したあとに、アカウントが削除されていないかを確認
  const workbookAuthor = await userCrud.getUserById(workBook.authorId);
  const isExistingAuthor = workbookAuthor ? true : false;

  return { workBook: workBook, isExistingAuthor: isExistingAuthor };
}

export function parseWorkBookId(slug: string): number | null {
  const isOnlyDigits = (id: string) => /^\d+$/.test(id);
  const id = Number(slug);
  const isInteger = id % 1 === 0;
  const isValidInteger = Number.isSafeInteger(id);

  if (!isOnlyDigits(slug) || isNaN(id) || !isInteger || id <= 0 || !isValidInteger) {
    return null;
  }

  return id;
}
