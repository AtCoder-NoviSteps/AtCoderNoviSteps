import type { ContestLabelTranslations } from '$lib/contests/types/contest';

/**
 * A mapping of contest dates to their respective Japanese translations.
 * Each key represents a date in the format 'YYYYMM', and the corresponding value
 * is the Japanese translation indicating the contest number.
 *
 * Note:
 * After the 15th contest, the URL includes the number of times the contest has been held
 *
 * See:
 * https://atcoder.jp/contests/archive?ratedType=0&category=50
 *
 * Example:
 * - '201912': ' 第 1 回' (The 1st contest in December 2019)
 * - '202303': ' 第 14 回' (The 14th contest in March 2023)
 */
export const PAST_TRANSLATIONS = {
  '201912': ' 第 1 回',
  '202004': ' 第 2 回',
  '202005': ' 第 3 回',
  '202010': ' 第 4 回',
  '202012': ' 第 5 回',
  '202104': ' 第 6 回',
  '202107': ' 第 7 回',
  '202109': ' 第 8 回',
  '202112': ' 第 9 回',
  '202203': ' 第 10 回',
  '202206': ' 第 11 回',
  '202209': ' 第 12 回',
  '202212': ' 第 13 回',
  '202303': ' 第 14 回',
};

/**
 * A regular expression to match strings that representing the 15th or later PAST contests.
 * The string should start with "past" followed by exactly two digits and end with "-open".
 * The matching is case-insensitive.
 *
 * Examples:
 * - "past15-open" (matches)
 * - "past16-open" (matches)
 * - "past99-open" (matches)
 */
const regexForPast = /^past(\d+)-open$/i;

export function getPastContestLabel(
  translations: Readonly<ContestLabelTranslations>,
  contestId: string,
): string {
  let label = contestId;

  Object.entries(translations).forEach(([abbrEnglish, japanese]) => {
    label = label.replace(abbrEnglish, japanese);
  });

  if (label == contestId) {
    label = label.replace(regexForPast, (_, round) => {
      return `PAST 第 ${round} 回`;
    });
  }

  // Remove suffix
  return label.replace('-open', '').toUpperCase();
}
