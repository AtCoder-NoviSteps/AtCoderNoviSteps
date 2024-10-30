import { ContestType } from '$lib/types/contest';

// See:
// https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/utils/ContestClassifier.ts
export const classifyContest = (contest_id: string) => {
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

  // HACK: 2024年10月上旬時点では、以下のコンテストが該当。
  // Note: 対象コンテストが増えた場合は、判定条件を見直す必要がある。
  if (contest_id === 'tenka1-2018') {
    return ContestType.ARC_LIKE;
  }

  // ・CODE FESTIVAL 2017 qual
  // ・CODE FESTIVAL 2017 Final
  const prefixForAgcLike = ['code-festival-2017-qual', 'cf17-final'];

  if (prefixForAgcLike.some((prefix) => contest_id.startsWith(prefix))) {
    return ContestType.AGC_LIKE;
  }

  // ・Chokudai SpeedRun
  // ・CODE FESTIVAL 2014 決勝
  // ・Donutsプロコンチャレンジ
  // ・MUJIN Programming Challenge 2016
  // ・COLOCON
  // ・GigaCode
  const prefixForOthers = [
    'chokudai_S',
    'code-festival-2014-final',
    'donuts',
    'mujin-pc-2016',
    'colopl',
    'gigacode',
  ];

  if (prefixForOthers.some((prefix) => contest_id.startsWith(prefix))) {
    return ContestType.OTHERS;
  }

  const prefixForAojCourses = getPrefixForAojCourses();

  if (prefixForAojCourses.some((prefix) => contest_id.startsWith(prefix))) {
    return ContestType.AOJ_COURSES;
  }

  if (/^PCK(Prelim|Final)\d*$/.exec(contest_id)) {
    return ContestType.AOJ_PCK;
  }

  return null;
};

// AIZU ONLINE JUDGE AOJ Courses
//
// ・プログラミング入門: ITP1
// ・アルゴリズムとデータ構造入門: ALDS1
// ・プログラミング応用: ITP2
// ・組み合わせ最適化: DPL
export function getPrefixForAojCourses() {
  return ['ITP1', 'ALDS1', 'ITP2', 'DPL'];
}

// priority: 0 (High) - 18 (Low)
// HACK: ARC、AGC、AOJ_COURSES、AOJ_PCKの優先順位は暫定版
//
// See:
// https://jsprimer.net/basic/map-and-set/
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
  [ContestType.OTHERS, 16], // AtCoder (その他)
  [ContestType.AOJ_COURSES, 17],
  [ContestType.AOJ_PCK, 18],
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

  const prefixForAojCourses = getPrefixForAojCourses();

  if (prefixForAojCourses.includes(contest_id)) {
    return 'AOJ Courses';
  }

  if (contest_id.startsWith('PCK')) {
    const aojPckLabel = getAojPckLabel(contest_id);

    return aojPckLabel;
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
