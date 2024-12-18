import { ContestType, type ContestPrefix, type ContestLabelTranslations } from '$lib/types/contest';

// See:
// https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/utils/ContestClassifier.ts
export const classifyContest = (contest_id: string) => {
  // AtCoder
  if (/^abc\d{3}$/.exec(contest_id)) {
    return ContestType.ABC;
  }

  if (/^arc\d{3}$/.exec(contest_id)) {
    return ContestType.ARC;
  }

  if (/^agc\d{3}$/.exec(contest_id)) {
    return ContestType.AGC;
  }

  if (contest_id.startsWith('APG4b')) {
    return ContestType.APG4B;
  }

  if (contest_id === 'abs') {
    return ContestType.ABS;
  }

  if (contest_id === 'typical90') {
    return ContestType.TYPICAL90;
  }

  if (contest_id === 'dp') {
    return ContestType.EDPC;
  }

  if (contest_id === 'tdpc') {
    return ContestType.TDPC;
  }

  if (contest_id.startsWith('past')) {
    return ContestType.PAST;
  }

  if (contest_id === 'practice2') {
    return ContestType.ACL_PRACTICE;
  }

  if (contest_id.startsWith('joi')) {
    return ContestType.JOI;
  }

  if (contest_id === 'tessoku-book') {
    return ContestType.TESSOKU_BOOK;
  }

  if (contest_id === 'math-and-algorithm') {
    return ContestType.MATH_AND_ALGORITHM;
  }

  if (abcLikePrefixes.has(contest_id)) {
    return ContestType.ABC_LIKE;
  }

  if (arcLikePrefixes.has(contest_id)) {
    return ContestType.ARC_LIKE;
  }

  if (agcLikePrefixes.some((prefix) => contest_id.startsWith(prefix))) {
    return ContestType.AGC_LIKE;
  }

  if (atCoderUniversityPrefixes.some((prefix) => contest_id.startsWith(prefix))) {
    return ContestType.UNIVERSITY;
  }

  if (atCoderOthersPrefixes.some((prefix) => contest_id.startsWith(prefix))) {
    return ContestType.OTHERS;
  }

  // AIZU ONLINE JUDGE
  if (aojCoursePrefixes.has(contest_id)) {
    return ContestType.AOJ_COURSES;
  }

  if (/^PCK(Prelim|Final)\d*$/.exec(contest_id)) {
    return ContestType.AOJ_PCK;
  }

  if (/^JAG(Prelim|Regional|Summer|Winter|Spring)\d*$/.exec(contest_id)) {
    return ContestType.AOJ_JAG;
  }

  return null;
};

// HACK: As of December 2024, the following contests are applicable.
// Note: The classification logic may need to be revised when new contests are added.
const ABC_LIKE: ContestPrefix = {
  panasonic2020: 'パナソニックプログラミングコンテスト 2020',
} as const;
const abcLikePrefixes = new Set(getContestPrefixes(ABC_LIKE));

const ARC_LIKE: ContestPrefix = {
  'tenka1-2018': 'Tenka1 Programmer Contest 2018',
  'dwacon5th-prelims': '第5回 ドワンゴからの挑戦状 予選',
  'dwacon6th-prelims': '第6回 ドワンゴからの挑戦状 予選',
  keyence2019: 'キーエンス プログラミング コンテスト 2019',
  keyence2020: 'キーエンス プログラミング コンテスト 2020',
  keyence2021: 'キーエンス プログラミング コンテスト 2021',
  'jsc2019-qual': '第一回日本最強プログラマー学生選手権-予選-',
} as const;
const arcLikePrefixes = new Set(getContestPrefixes(ARC_LIKE));

const AGC_LIKE: ContestPrefix = {
  'code-festival-2016-qual': 'CODE FESTIVAL 2016 qual',
  'code-festival-2017-qual': 'CODE FESTIVAL 2017 qual',
  'cf17-final': 'CODE FESTIVAL 2017 final',
} as const;
const agcLikePrefixes = getContestPrefixes(AGC_LIKE);

// HACK: As of November 2024, UTPC, TTPC and TUPC are included.
// More university contests may be added in the future.
/**
 * Maps university contest ID prefixes to their display names.
 *
 * @example
 * {
 *   utpc: 'UTPC' // University of Tokyo Programming Contest
 *   ttpc: 'TTPC' // Tokyo Institute of Technology Programming Contest
 *   tupc: 'TUPC' // Tohoku University Programming Contest
 * }
 *
 * @remarks
 * When adding new university contests:
 * 1. Use lowercase prefix as key
 * 2. Use official contest name as value
 * 3. Ensure prefix doesn't conflict with existing contest types
 */
const ATCODER_UNIVERSITIES: ContestPrefix = {
  utpc: 'UTPC',
  ttpc: 'TTPC',
  tupc: 'TUPC',
} as const;

const atCoderUniversityPrefixes = getContestPrefixes(ATCODER_UNIVERSITIES);

/**
 * Maps other AtCoder contest ID prefixes to their display names.
 * Includes special, corporate, and promotional contests that don't fit other categories.
 *
 * @example
 * {
 *   'mujin-pc-2018': 'Mujin Programming Challenge 2018',
 *   'discovery2016': 'DISCO presents ディスカバリーチャンネル プログラミングコンテスト2016'
 * }
 *
 * @remarks
 * When adding new contests:
 * 1. Use kebab-case for contest ID prefix as key
 * 2. Use official contest name in English or Japanese as value
 * 3. Ensure the contest doesn't belong to other specific categories
 */
const ATCODER_OTHERS: ContestPrefix = {
  chokudai_S: 'Chokudai SpeedRun',
  'code-festival-2014-final': 'Code Festival 2014 決勝',
  donuts: 'Donutsプロコンチャレンジ',
  'mujin-pc-2016': 'Mujin Programming Challenge 2016',
  'mujin-pc-2018': 'Mujin Programming Challenge 2018',
  'tenka1-2016-final': '天下一プログラマーコンテスト2016本戦',
  // Discovery Channel contest featuring algorithm problems
  discovery2016: 'DISCO presents ディスカバリーチャンネル プログラミングコンテスト2016',
  colopl: 'COLOCON',
  gigacode: 'GigaCode',
  cpsco2019: 'CPSCO 2019',
  DEGwer2023: 'DEGwer さんの D 論応援コンテスト',
} as const;
const atCoderOthersPrefixes = getContestPrefixes(ATCODER_OTHERS);

// AIZU ONLINE JUDGE AOJ Courses
export const AOJ_COURSES: ContestPrefix = {
  ITP1: 'プログラミング入門',
  ALDS1: 'アルゴリズムとデータ構造入門',
  ITP2: 'プログラミング応用',
  DPL: '組み合わせ最適化',
} as const;

export function getPrefixForAojCourses() {
  return getContestPrefixes(AOJ_COURSES);
}

const aojCoursePrefixes = new Set(getPrefixForAojCourses()); // For O(1) lookups

/**
 * Extracts contest prefixes (keys) from a contest prefix object.
 * @param contestPrefixes - Object mapping contest IDs to their display names
 * @returns Array of contest prefix strings
 */
export function getContestPrefixes(contestPrefixes: Record<string, string>) {
  return Object.keys(contestPrefixes);
}

/**
 * Contest type priorities (0 = Highest, 20 = Lowest)
 *
 * Priority assignment rationale:
 * - Educational contests (0-10): ABS, ABC, APG4B, etc.
 * - Contests for genius (11-15): ARC, AGC, and their variants
 * - Special contests (16-17): UNIVERSITY, OTHERS
 * - External platforms (18-20): AOJ_COURSES, AOJ_PCK, AOJ_JAG
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
  [ContestType.PAST, 6],
  [ContestType.ACL_PRACTICE, 7],
  [ContestType.JOI, 8],
  [ContestType.TESSOKU_BOOK, 9],
  [ContestType.MATH_AND_ALGORITHM, 10],
  [ContestType.ARC, 11],
  [ContestType.AGC, 12],
  [ContestType.ABC_LIKE, 13],
  [ContestType.ARC_LIKE, 14],
  [ContestType.AGC_LIKE, 15],
  [ContestType.UNIVERSITY, 16],
  [ContestType.OTHERS, 17], // AtCoder (その他)
  [ContestType.AOJ_COURSES, 18],
  [ContestType.AOJ_PCK, 19],
  [ContestType.AOJ_JAG, 20],
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
 *
 * followed by exactly three digits. The matching is case-insensitive.
 *
 * Example matches:
 * - "abc376"
 * - "ARC128"
 * - "agc045"
 *
 * Example non-matches:
 * - "xyz123"
 * - "abc12"
 * - "abc1234"
 */
const regexForAxc = /^(abc|arc|agc)(\d{3})/i;

/**
 * Regular expression to match AtCoder University contest identifiers.
 *
 * The pattern matches strings that:
 * - Start with either "ut", "tt", or "tu"
 * - Followed by "pc"
 * - End with exactly year (four digits)
 *
 * Example matches:
 * - "utpc2014"
 * - "ttpc2022"
 * - "tupc2023"
 */
const regexForAtCoderUniversity = /^(ut|tt|tu)(pc)(\d{4})/i;

export const getContestNameLabel = (contestId: string) => {
  // AtCoder
  if (regexForAxc.exec(contestId)) {
    return contestId.replace(
      regexForAxc,
      (_, contestType, contestNumber) => `${contestType.toUpperCase()} ${contestNumber}`,
    );
  }

  if (contestId === 'APG4b' || contestId === 'APG4bPython') {
    return contestId;
  }

  if (contestId === 'typical90') {
    return '競プロ典型 90 問';
  }

  if (contestId === 'dp') {
    return 'EDPC';
  }

  if (contestId === 'tdpc') {
    return 'TDPC';
  }

  if (contestId.startsWith('past')) {
    return getPastContestLabel(PAST_TRANSLATIONS, contestId);
  }

  if (contestId === 'practice2') {
    return 'ACL Practice';
  }

  if (contestId.startsWith('joi')) {
    return getJoiContestLabel(contestId);
  }

  if (contestId === 'tessoku-book') {
    return '競技プログラミングの鉄則';
  }

  if (contestId === 'math-and-algorithm') {
    return 'アルゴリズムと数学';
  }

  if (regexForAtCoderUniversity.exec(contestId)) {
    return getAtCoderUniversityContestLabel(contestId);
  }

  if (contestId.startsWith('chokudai_S')) {
    return contestId.replace('chokudai_S', 'Chokudai SpeedRun ');
  }

  // AIZU ONLINE JUDGE
  if (aojCoursePrefixes.has(contestId)) {
    return getAojContestLabel(AOJ_COURSES, contestId);
  }

  if (contestId.startsWith('PCK')) {
    return getAojContestLabel(PCK_TRANSLATIONS, contestId);
  }

  if (contestId.startsWith('JAG')) {
    return getAojContestLabel(JAG_TRANSLATIONS, contestId);
  }

  return contestId.toUpperCase();
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
 */
const regexForJoi = /^(joi)(g|open)*(\d{4})*(yo|ho|sc|sp)*(\d{4})*(1|2)*(a|b|c)*/i;

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
    aojCoursePrefixes.has(contestId) || contestId.startsWith('PCK') || contestId.startsWith('JAG')
  );
}
