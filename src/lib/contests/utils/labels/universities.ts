/**
 * Regular expression to match AtCoder University contest identifiers.
 *
 * The pattern matches strings that:
 * - Start with either "ku", "qu", "ut", "tt","tu", or "wu"
 * - Followed by "pc"
 * - End with exactly year (four digits)
 *
 * Example matches:
 * - "kupc2024"
 * - "qupc2018"
 * - "utpc2014"
 * - "ttpc2022"
 * - "tupc2023"
 * - "wupc2019"
 */
const regexForAtCoderUniversity = /^(ku|qu|ut|tt|tu|wu)(pc)(\d{4})$/i;

/**
 * Generates a formatted contest label for AtCoder University contests.
 *
 * classifyContest matches university contests by prefix, so an ID such as
 * `utpc24` reaches this function without a four-digit year. Returning null lets
 * the caller fall back to the raw contest_id instead of breaking the whole page.
 *
 * @param contestId - The ID of the contest to format (ex: utpc2023).
 * @returns The formatted contest label (ex: UTPC 2023), or null if the format is unknown.
 */
export function getAtCoderUniversityContestLabel(contestId: string): string | null {
  if (!regexForAtCoderUniversity.test(contestId)) {
    return null;
  }

  return contestId.replace(
    regexForAtCoderUniversity,
    (_, contestType, common, contestYear) =>
      `${(contestType + common).toUpperCase()} ${contestYear}`,
  );
}
