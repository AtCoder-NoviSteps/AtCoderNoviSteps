/**
 * Regular expression to match contest codes.
 *
 * This regex matches strings that start with one of the following prefixes:
 * - "abc"
 * - "arc"
 * - "agc"
 * - "awc"
 *
 * followed by exactly three or four digits. The matching is case-insensitive.
 *
 * Example matches:
 * - "abc376"
 * - "ARC128"
 * - "agc045"
 * - "atc001"
 * - "awc0001"
 *
 * Example non-matches:
 * - "xyz123"
 * - "abc12"
 * - "abc1234"
 * - "atc1234"
 * - "awc12345"
 */
export const regexForAxc = /^(abc|arc|agc|atc)(\d{3})$/i;
const regexForAwc = /^(awc)(\d{4})$/i;

export function generateAxcLabel(contestId: string): string {
  return contestId.replace(
    regexForAxc,
    (_, contestType, contestNumber) => `${contestType.toUpperCase()} ${contestNumber}`,
  );
}

export function generateAwcLabel(contestId: string): string {
  return contestId.replace(
    regexForAwc,
    (_, contestType, contestNumber) => `${contestType.toUpperCase()} ${contestNumber}`,
  );
}
