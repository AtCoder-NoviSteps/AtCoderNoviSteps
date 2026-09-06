import { ContestType, type ContestLabelTranslations } from '$lib/contests/types/contest';
import {
  regexForJag,
  regexForAojUniversity,
  ATCODER_OTHERS,
  AOJ_COURSES,
  aojCoursePrefixes,
} from './prefixes';
import { classifyContest, getWorldTourFinalsLabel } from './classification';

export {
  regexForJag,
  regexForAojUniversity,
  getContestPrefixes,
  getPrefixForAojCourses,
} from './prefixes';
export { classifyContest, isWorldTourFinals, getWorldTourFinalsLabel } from './classification';
export { AOJ_COURSES } from './prefixes';
export { contestTypePriorities, getContestPriority } from './priority';

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
const regexForAxc = /^(abc|arc|agc|atc)(\d{3})$/i;
const regexForAwc = /^(awc)(\d{4})$/i;

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

type LabelGenerator = (contestId: string) => string | null;

function generateAxcLabel(contestId: string): string {
  return contestId.replace(
    regexForAxc,
    (_, contestType, contestNumber) => `${contestType.toUpperCase()} ${contestNumber}`,
  );
}

function generateAwcLabel(contestId: string): string {
  return contestId.replace(
    regexForAwc,
    (_, contestType, contestNumber) => `${contestType.toUpperCase()} ${contestNumber}`,
  );
}

// Handles atc\d{3}, ATCODER_OTHERS dict, chokudai_S prefix, and uppercase fallback.
// classifyContest maps these to OTHERS via prefix match, but the original
// getContestNameLabel dispatched them independently — this chain preserves that behavior.
function generateOthersLabel(contestId: string): string {
  if (regexForAxc.test(contestId)) {
    return generateAxcLabel(contestId);
  }

  const othersLabel = ATCODER_OTHERS[contestId as keyof typeof ATCODER_OTHERS];
  if (othersLabel) return othersLabel;

  if (contestId.startsWith('chokudai_S')) {
    return contestId.replace('chokudai_S', 'Chokudai SpeedRun ');
  }

  return contestId.toUpperCase();
}

const LABEL_GENERATORS: ReadonlyMap<ContestType, LabelGenerator> = new Map([
  [ContestType.ABC, generateAxcLabel],
  [ContestType.ARC, generateAxcLabel],
  [ContestType.AGC, generateAxcLabel],
  [ContestType.AWC, generateAwcLabel],
  [ContestType.APG4B, (id) => id],
  [ContestType.TYPICAL90, () => '競プロ典型 90 問'],
  [ContestType.EDPC, () => 'EDPC'],
  [ContestType.TDPC, () => 'TDPC'],
  [ContestType.NDPC, () => 'NDPC'],
  [ContestType.PAST, (id) => getPastContestLabel(PAST_TRANSLATIONS, id)],
  [ContestType.ACL_PRACTICE, () => 'ACL Practice'],
  [ContestType.JOI, (id) => getJoiContestLabel(id)],
  [ContestType.TESSOKU_BOOK, () => '競技プログラミングの鉄則'],
  [ContestType.MATH_AND_ALGORITHM, () => 'アルゴリズムと数学'],
  [ContestType.FPS_24, () => 'FPS 24 題'],
  [ContestType.ATCODER_MAIN_OFFICIAL_ONSITE, (id) => getWorldTourFinalsLabel(id)],
  [ContestType.UNIVERSITY, (id) => getAtCoderUniversityContestLabel(id)],
  [ContestType.OTHERS, generateOthersLabel],
  [ContestType.AOJ_COURSES, (id) => getAojContestLabel(AOJ_COURSES, id)],
  [ContestType.AOJ_PCK, (id) => getAojContestLabel(PCK_TRANSLATIONS, id)],
  [ContestType.AOJ_ICPC, (id) => getAojContestLabel(ICPC_TRANSLATIONS, id)],
  [ContestType.AOJ_JAG, (id) => getAojContestLabel(JAG_TRANSLATIONS, id)],
  [ContestType.AOJ_UNIVERSITY, (id) => getAojUniversityContestLabel(id)],
]);

export const getContestNameLabel = (contestId: string): string => {
  const contestType = classifyContest(contestId);
  if (!contestType) return contestId.toUpperCase();

  const generator = LABEL_GENERATORS.get(contestType);
  if (!generator) return contestId.toUpperCase();

  return generator(contestId) ?? contestId.toUpperCase();
};

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

/**
 * Generates a formatted contest label for AtCoder University contests.
 *
 * This function takes a contest ID string and replaces parts of it using a regular expression
 * to generate a formatted label. The label is constructed by converting the contest type and
 * common part to uppercase and appending the contest year.
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

/**
 * Maps PCK contest type abbreviations to their Japanese translations.
 *
 * @example
 * {
 *   PCK: 'パソコン甲子園',
 *   Prelim: '予選',
 *   Final: '本選'
 * }
 */
const PCK_TRANSLATIONS = {
  PCK: 'パソコン甲子園',
  Prelim: ' 予選 ',
  Final: ' 本選 ',
};

function getAojUniversityContestLabel(contestId: string): string {
  const label = contestId
    .replace(/^AOJ-/, '')
    .replace(/UAPC/g, 'ACPC')
    .replace(/([A-Z]{2,})(\d{4})/g, '$1 $2')
    .replace(/-in-/, ' in ')
    .replace(/-day(\d+)/, ' Day$1')
    .replace(/-summer/, ' Summer');
  return '（' + label + '）';
}

/**
 * Maps JAG contest type abbreviations to their Japanese translations.
 *
 * @example
 * {
 *   Prelim: '模擬国内',
 *   Regional: '模擬地区'
 * }
 */
const JAG_TRANSLATIONS = {
  Prelim: ' 模擬国内 ',
  Regional: ' 模擬地区 ',
  Summer: ' 夏合宿 ',
  Winter: ' 冬合宿 ',
  Spring: ' 春合宿 ',
  '-day': ' Day',
};

const ICPC_TRANSLATIONS = {
  Prelim: ' 国内予選 ',
  Regional: ' アジア地区 ',
};

export function getAojContestLabel(
  translations: Readonly<ContestLabelTranslations>,
  contestId: string,
): string {
  let label = contestId;

  Object.entries(translations).forEach(([abbrEnglish, japanese]) => {
    label = label.replace(abbrEnglish, japanese);
  });

  return '（' + label + '）';
}

export const addContestNameToTaskIndex = (contestId: string, taskTableIndex: string): string => {
  const contestName = getContestNameLabel(contestId);

  if (isAojContest(contestId)) {
    return `AOJ ${taskTableIndex}${contestName}`;
  }

  return `${contestName} - ${taskTableIndex}`;
};

function isAojContest(contestId: string): boolean {
  return (
    aojCoursePrefixes.has(contestId) ||
    contestId.startsWith('PCK') ||
    regexForJag.test(contestId) ||
    contestId.startsWith('ICPC') ||
    regexForAojUniversity.test(contestId)
  );
}
