import type { ContestLabelTranslations } from '#lib/contests/types/contest.js';

/**
 * Year-months ('YYYYMM') in the contest ids of the 1st to 14th PAST contests; index + 1 is the round.
 *
 * Note:
 * After the 15th contest, the URL includes the number of times the contest has been held
 *
 * See:
 * https://atcoder.jp/contests/archive?ratedType=0&category=50
 */
const PAST_YEAR_MONTHS = [
  '201912',
  '202004',
  '202005',
  '202010',
  '202012',
  '202104',
  '202107',
  '202109',
  '202112',
  '202203',
  '202206',
  '202209',
  '202212',
  '202303',
] as const;

/**
 * A mapping of contest dates to their respective Japanese translations.
 * Each key represents a date in the format 'YYYYMM', and the corresponding value
 * is the Japanese translation indicating the contest number.
 *
 * Example:
 * - '201912': ' 第 1 回' (The 1st contest in December 2019)
 * - '202303': ' 第 14 回' (The 14th contest in March 2023)
 */
export const PAST_TRANSLATIONS: ContestLabelTranslations = Object.fromEntries(
  PAST_YEAR_MONTHS.map((yearMonth, index) => [yearMonth, ` 第 ${index + 1} 回`]),
);

/**
 * Returns the contest id of the given PAST round.
 *
 * Example:
 * - 1 → 'past201912-open'
 * - 15 → 'past15-open'
 */
export function getPastContestId(round: number): string {
  const yearMonth = PAST_YEAR_MONTHS[round - 1];

  return yearMonth ? `past${yearMonth}-open` : `past${round}-open`;
}

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
