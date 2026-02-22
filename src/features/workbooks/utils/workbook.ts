import { isValidUrlSlug } from '$lib/utils/url';

// See:
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/parseInt
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
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
