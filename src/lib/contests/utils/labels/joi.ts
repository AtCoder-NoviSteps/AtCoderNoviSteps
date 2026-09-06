/**
 * Regular expression to match specific patterns in contest identifiers.
 *
 * The pattern matches strings that follow these rules:
 * - Starts with "joi" (case insensitive).
 * - Optionally followed by "g" or "open".
 * - Optionally represents year (4-digit number).
 * - Optionally followed by "yo", "ho", "sc", or "sp" (Qual, Final and Spring camp).
 * - Optionally represents year (4-digit number).
 * - Optionally followed by "1" or "2" (Qual 1st, 2nd).
 * - Optionally followed by "a", "b", or "c" (Round 1, 2 and 3).
 *
 * Flags:
 * - `i`: Case insensitive matching.
 *
 * Examples:
 * - "joi2024yo1a" (matches)
 * - "joi2023ho" (matches)
 * - "joisc2022" (matches)
 * - "joisp2021" (matches)
 * - "joig2024-open" (matches)
 * - "joisc2024" (matches)
 * - "joisp2022" (matches)
 * - "joi24yo3d" (does not match)
 * - "joi2026sf" (matches)
 */
const regexForJoi = /^(joi)(g|open)*(\d{4})*(yo|ho|sc|sp|sf)*(\d{4})*(1|2)*(a|b|c)*/i;

/**
 * Transforms a contest ID into a formatted contest label.
 *
 * This function processes the given contest ID by removing specific suffixes
 * and applying various transformations to generate a human-readable contest label.
 *
 * @param contestId - The ID of the contest to be transformed.
 * @returns The formatted contest label.
 */
export function getJoiContestLabel(contestId: string): string {
  let label = contestId;
  // Remove suffix
  label = label.replace('-open', '');

  label = label.replace(
    regexForJoi,
    (_, base, subType, yearPrefix, division, yearSuffix, qual, qualRound) => {
      const SPACE = ' ';

      let newLabel = base.toUpperCase();
      newLabel += addJoiSubTypeIfNeeds(subType);

      if (division !== undefined) {
        newLabel += SPACE;
        newLabel += addJoiDivisionNameIfNeeds(division, qual);
      }

      newLabel += SPACE;
      newLabel += addJoiYear(yearSuffix, yearPrefix);

      if (qualRound !== undefined) {
        newLabel += SPACE;
        newLabel += addJoiQualRoundNameIfNeeds(qualRound);
      }

      return newLabel;
    },
  );

  return label;
}

function addJoiSubTypeIfNeeds(subType: string): string {
  if (subType === 'g') {
    return subType.toUpperCase();
  } else if (subType === 'open') {
    return ' Open';
  }

  return '';
}

function addJoiDivisionNameIfNeeds(division: string, qual: string): string {
  if (division === 'yo') {
    if (qual === undefined) {
      return '予選';
    } else if (qual === '1') {
      return '一次予選';
    } else if (qual === '2') {
      return '二次予選';
    }
  } else if (division === 'ho') {
    return '本選';
  } else if (division === 'sf') {
    return 'セミファイナルステージ';
  } else if (division === 'sc' || division === 'sp') {
    return '春合宿';
  }

  return '';
}

function addJoiYear(yearSuffix: string, yearPrefix: string): string {
  if (yearPrefix !== undefined) {
    return yearPrefix;
  } else if (yearSuffix !== undefined) {
    return yearSuffix;
  }

  return '';
}

function addJoiQualRoundNameIfNeeds(qualRound: string): string {
  if (qualRound === 'a') {
    return '第 1 回';
  } else if (qualRound === 'b') {
    return '第 2 回';
  } else if (qualRound === 'c') {
    return '第 3 回';
  }

  return '';
}
