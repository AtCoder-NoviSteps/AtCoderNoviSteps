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
  const isExistingAuthor = workbookAuthor ? true : false;

  return { workBook: workBook, isExistingAuthor: isExistingAuthor };
}

/**
 * Finds a workbook ID from a given slug string.
 *
 * This function first attempts to parse the slug as a direct workbook ID.
 * If that fails, it tries to parse it as a workbook URL slug and looks up
 * the corresponding workbook in the database.
 *
 * @param slug - The slug string to search for, can be either a numeric ID or URL slug
 * @returns A Promise that resolves to the workbook ID if found, or null if not found
 *
 * @example
 * ```typescript
 * // Using numeric ID
 * const id1 = await findWorkBookIdFrom("123");
 *
 * // Using URL slug
 * const id2 = await findWorkBookIdFrom("union-find");
 * ```
 */
export async function findWorkBookIdFrom(slug: string): Promise<number | null> {
  const workBookId = parseWorkBookId(slug);

  if (workBookId !== null) {
    return workBookId;
  }

  const workBookUrlSlug = parseWorkBookUrlSlug(slug);

  if (workBookUrlSlug !== null) {
    const workBook = await workBookCrud.getWorkBookByUrlSlug(slug);

    if (workBook !== null && workBook.id !== null) {
      return workBook.id;
    }
  }

  return null;
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
