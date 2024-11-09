import { ContestType, type ContestPrefix } from '$lib/types/contest';

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

  return null;
};

// HACK: As of early November 2024, the following contests are applicable.
// Note: The classification logic may need to be revised when new contests are added.
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

// HACK: As of early November 2024, only UTPC is included.
// More university contests may be added in the future.
/**
 * Maps university contest ID prefixes to their display names.
 *
 * @example
 * {
 *   utpc: 'UTPC' // University of Tokyo Programming Contest
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
  tupc: 'TUPC',
} as const;

const atCoderUniversityPrefixes = getContestPrefixes(ATCODER_UNIVERSITIES);

const ATCODER_OTHERS: ContestPrefix = {
  chokudai_S: 'Chokudai SpeedRun',
  'code-festival-2014-final': 'Code Festival 2014 決勝',
  donuts: 'Donutsプロコンチャレンジ',
  'mujin-pc-2016': 'Mujin Programming Challenge 2016',
  'tenka1-2016-final': '天下一プログラマーコンテスト2016本戦',
  discovery2016: 'DISCO presents ディスカバリーチャンネル プログラミングコンテスト2016',
  colopl: 'COLOCON',
  gigacode: 'GigaCode',
  cpsco2019: 'CPSCO 2019',
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
 * Contest type priorities (0 = Highest, 19 = Lowest)
 *
 * Priority assignment rationale:
 * - Educational contests (0-10): ABS, ABC, APG4B, etc.
 * - Contests for genius (11-15): ARC, AGC, and their variants
 * - Special contests (16-17): UNIVERSITY, OTHERS
 * - External platforms (18-19): AOJ_COURSES, AOJ_PCK
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

export const getContestNameLabel = (contest_id: string) => {
  if (contest_id === 'APG4b' || contest_id === 'APG4bPython') {
    return contest_id;
  }

  if (contest_id === 'typical90') {
    return '競プロ典型 90 問';
  }

  if (contest_id === 'dp') {
    return 'EDPC';
  }

  if (contest_id === 'tdpc') {
    return 'TDPC';
  }

  if (contest_id === 'practice2') {
    return 'ACL Practice';
  }

  if (contest_id === 'tessoku-book') {
    return '競技プログラミングの鉄則';
  }

  if (contest_id === 'math-and-algorithm') {
    return 'アルゴリズムと数学';
  }

  if (contest_id.startsWith('chokudai_S')) {
    return contest_id.replace('chokudai_S', 'Chokudai SpeedRun ');
  }

  if (aojCoursePrefixes.has(contest_id)) {
    return 'AOJ Courses';
  }

  if (contest_id.startsWith('PCK')) {
    return getAojPckLabel(contest_id);
  }

  return contest_id.toUpperCase();
};

function getAojPckLabel(contestId: string): string {
  const PCK_TRANSLATIONS = {
    PCK: 'パソコン甲子園',
    Prelim: '予選',
    Final: '本選',
  };

  const baseLabel = 'AOJ - ';

  Object.entries(PCK_TRANSLATIONS).forEach(([abbrEnglish, japanese]) => {
    contestId = contestId.replace(abbrEnglish, japanese);
  });

  return baseLabel + contestId;
}

export const addContestNameToTaskIndex = (contestId: string, taskTableIndex: string): string => {
  const contestName = getContestNameLabel(contestId);

  return `${contestName} - ${taskTableIndex}`;
};
