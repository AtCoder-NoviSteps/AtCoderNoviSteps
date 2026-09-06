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
 * @param contestId - The ID of the contest to format (ex: utpc2023).
 * @returns The formatted contest label (ex: UTPC 2023).
 */
export function getAtCoderUniversityContestLabel(contestId: string): string {
  if (!regexForAtCoderUniversity.test(contestId)) {
    throw new Error(`Invalid university contest ID format: ${contestId}`);
  }

  return contestId.replace(
    regexForAtCoderUniversity,
    (_, contestType, common, contestYear) =>
      `${(contestType + common).toUpperCase()} ${contestYear}`,
  );
}
