import { error } from '@sveltejs/kit';

import type { WorkBook } from '$lib/types/workbook';

import * as userCrud from '$lib/services/users';
import * as workBookCrud from '$lib/services/workbooks';

import { isValidUrlSlug } from '$lib/utils/url';
import { BAD_REQUEST, NOT_FOUND } from '$lib/constants/http-response-status-codes';

// See:
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/parseInt
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
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
    workBook = await workBookCrud.getWorkBook(workBookId);
  } else if (workBookUrlSlug) {
    workBook = await workBookCrud.getWorkBookByUrlSlug(workBookUrlSlug);
  }

  if (workBook === null) {
    error(NOT_FOUND, `問題集id: ${slug} は見つかりませんでした。`);
  }

  // Validate if the author of the workbook exists after the workbook has been created.
  const workbookAuthor = await userCrud.getUserById(workBook.authorId);
  const isExistingAuthor = !!workbookAuthor;

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

export function parseWorkBookUrlSlug(slug: string): string | null {
  return isValidUrlSlug(slug) ? slug : null;
}
