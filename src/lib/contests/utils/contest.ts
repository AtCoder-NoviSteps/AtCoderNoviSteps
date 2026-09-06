import { ContestType, type ContestLabelTranslations } from '$lib/contests/types/contest';
import {
  regexForJag,
  regexForAojUniversity,
  ATCODER_OTHERS,
  AOJ_COURSES,
  abcLikePrefixes,
  arcLikePrefixes,
  agcLikePrefixes,
  atCoderUniversityPrefixes,
  atCoderOthersPrefixes,
  aojCoursePrefixes,
  getContestPrefixes,
  getPrefixForAojCourses,
} from './prefixes';

export { regexForJag, regexForAojUniversity, AOJ_COURSES, getContestPrefixes, getPrefixForAojCourses };

// See:
// https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/utils/ContestClassifier.ts

// Exact-match table: O(1) lookup for contest IDs that map to a single type.
const CONTEST_TYPES_BY_ID: ReadonlyMap<string, ContestType> = new Map([
  ['abs', ContestType.ABS],
  ['typical90', ContestType.TYPICAL90],
  ['dp', ContestType.EDPC],
  ['tdpc', ContestType.TDPC],
  ['ndpc', ContestType.NDPC],
  ['practice2', ContestType.ACL_PRACTICE],
  ['tessoku-book', ContestType.TESSOKU_BOOK],
  ['math-and-algorithm', ContestType.MATH_AND_ALGORITHM],
  ['fps-24', ContestType.FPS_24],
]);

type ClassificationRule = {
  matches: (contestId: string) => boolean;
  type: ContestType;
};

// Ordered rules: first match wins. Regex and prefix-based checks.
const CLASSIFICATION_RULES: readonly ClassificationRule[] = [
  // AtCoder numbered contests
  { matches: (id) => /^abc\d{3}$/.test(id), type: ContestType.ABC },
  { matches: (id) => /^arc\d{3}$/.test(id), type: ContestType.ARC },
  { matches: (id) => /^agc\d{3}$/.test(id), type: ContestType.AGC },
  { matches: (id) => /^awc\d{4}$/.test(id), type: ContestType.AWC },
  { matches: (id) => id.startsWith('APG4b'), type: ContestType.APG4B },
  { matches: (id) => id.startsWith('past'), type: ContestType.PAST },
  { matches: (id) => id.startsWith('joi'), type: ContestType.JOI },
  { matches: (id) => isWorldTourFinals(id), type: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE },
  // Set-based exact matches
  { matches: (id) => abcLikePrefixes.has(id), type: ContestType.ABC_LIKE },
  { matches: (id) => arcLikePrefixes.has(id), type: ContestType.ARC_LIKE },
  // Prefix-based matches
  { matches: (id) => agcLikePrefixes.some((p) => id.startsWith(p)), type: ContestType.AGC_LIKE },
  {
    matches: (id) => atCoderUniversityPrefixes.some((p) => id.startsWith(p)),
    type: ContestType.UNIVERSITY,
  },
  {
    matches: (id) => atCoderOthersPrefixes.some((p) => id.startsWith(p)),
    type: ContestType.OTHERS,
  },
  // AOJ
  { matches: (id) => aojCoursePrefixes.has(id), type: ContestType.AOJ_COURSES },
  { matches: (id) => /^PCK(Prelim|Final)\d*$/.test(id), type: ContestType.AOJ_PCK },
  { matches: (id) => /^ICPC(Prelim|Regional)\d*$/.test(id), type: ContestType.AOJ_ICPC },
  { matches: (id) => regexForJag.test(id), type: ContestType.AOJ_JAG },
  { matches: (id) => regexForAojUniversity.test(id), type: ContestType.AOJ_UNIVERSITY },
];

export const classifyContest = (contestId: string): ContestType | null => {
  const exactMatch = CONTEST_TYPES_BY_ID.get(contestId);
  if (exactMatch) return exactMatch;

  const matchedRule = CLASSIFICATION_RULES.find((rule) => rule.matches(contestId));
  return matchedRule?.type ?? null;
};

// World Tour Finals (AtCoder official onsite finals), Algorithm division only.
//
// Seeded contest_id values carry a trailing "-open" (e.g. wtf19-open), except
// wtf22-day2 which AtCoder Problems records without it; strip it before matching
// so both forms work and it never leaks into the display label.
//
// From 2025 the id gains an "algo" infix (awtf2025algo-open) to disambiguate
// from the new Heuristic division (awtf2025heuristic), which stays out of scope.
const regexForWorldTourFinals = /^(wtf19|wtf22-day[12]|awtf2024|awtf20\d{2}algo)$/;

export const isWorldTourFinals = (contestId: string): boolean =>
  regexForWorldTourFinals.test(stripOpenSuffix(contestId));

export const getWorldTourFinalsLabel = (contestId: string): string => {
  const base = 'World Tour Finals';
  const id = stripOpenSuffix(contestId);

  if (id === 'wtf19') {
    return `${base} 2019`;
  }

  const dayMatch = /^wtf22-day([12])$/.exec(id);

  if (dayMatch) {
    return `${base} 2022 Day${dayMatch[1]}`;
  }

  if (id === 'awtf2024') {
    return `${base} 2024`;
  }

  const algoMatch = /^awtf(20\d{2})algo$/.exec(id);

  if (algoMatch) {
    // "Algorithm" distinguishes from the Heuristic division, introduced in 2025.
    return `${base} ${algoMatch[1]} Algorithm`;
  }

  return contestId.toUpperCase();
};

const stripOpenSuffix = (contestId: string): string =>
  contestId.endsWith('-open') ? contestId.slice(0, -'-open'.length) : contestId;

/**
 * Contest type priorities (0 = Highest, 26 = Lowest)
 *
 * Priority assignment rationale:
 * - Educational contests (0-11, 17): ABS, ABC, APG4B and AWC etc.
 * - Contests for genius (12-16): ARC, AGC, and their variants
 * - Special contests (18-21): UNIVERSITY, FPS_24, ATCODER_MAIN_OFFICIAL_ONSITE, OTHERS
 * - External platforms (22-26): AOJ_COURSES, AOJ_PCK, AOJ_ICPC, AOJ_JAG, AOJ_UNIVERSITY
 *
 * @remarks
 * HACK: The priorities for ARC, AGC, UNIVERSITY, AOJ_COURSES, and AOJ_PCK are temporary
 * and may be adjusted based on future requirements.
 *
 * See:
 * https://jsprimer.net/basic/map-and-set/
 */
export const contestTypePriorities: Map<ContestType, number> = new Map([
  [ContestType.ABS, 0],
  [ContestType.ABC, 1],
  [ContestType.APG4B, 2],
  [ContestType.TYPICAL90, 3],
  [ContestType.EDPC, 4],
  [ContestType.TDPC, 5],
  [ContestType.NDPC, 6],
  [ContestType.PAST, 7],
  [ContestType.ACL_PRACTICE, 8],
  [ContestType.JOI, 9],
  [ContestType.TESSOKU_BOOK, 10],
  [ContestType.MATH_AND_ALGORITHM, 11],
  [ContestType.ARC, 12],
  [ContestType.AGC, 13],
  [ContestType.ABC_LIKE, 14],
  [ContestType.ARC_LIKE, 15],
  [ContestType.AGC_LIKE, 16],
  [ContestType.AWC, 17],
  [ContestType.UNIVERSITY, 18],
  [ContestType.FPS_24, 19],
  [ContestType.ATCODER_MAIN_OFFICIAL_ONSITE, 20],
  [ContestType.OTHERS, 21], // AtCoder (その他)
  [ContestType.AOJ_COURSES, 22],
  [ContestType.AOJ_PCK, 23],
  [ContestType.AOJ_ICPC, 24],
  [ContestType.AOJ_JAG, 25],
  [ContestType.AOJ_UNIVERSITY, 26],
]);

export function getContestPriority(contestId: string): number {
  const contestType = classifyContest(contestId);
  const INF: number = 10 ** 3;

  if (contestType === null || contestType === undefined) {
    return INF;
  } else {
    return contestTypePriorities.get(contestType) as number;
  }
}

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
