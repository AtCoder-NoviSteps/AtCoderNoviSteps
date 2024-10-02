import { ContestType } from '$lib/types/contest';
import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';

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

  if (contest_id.startsWith('code-festival-2017-qual')) {
    return ContestType.AGC_LIKE;
  }

  // ・Chokudai SpeedRun
  // ・CODE FESTIVAL 2014 決勝
  // ・Donutsプロコンチャレンジ
  // ・COLOCON
  // ・GigaCode
  const prefixes = ['chokudai_S', 'code-festival-2014-final', 'donuts', 'colopl', 'gigacode'];

  if (prefixes.some((prefix) => contest_id.startsWith(prefix))) {
    return ContestType.OTHERS;
  }

  return null;
};

// priority: 0 (High) - 16 (Low)
// HACK: ARC、AGCの優先順位は暫定版
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
  [ContestType.OTHERS, 16],
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

export const getContestUrl = (contestId: string): string => {
  return `${ATCODER_BASE_CONTEST_URL}/${contestId}`;
};

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

  return contest_id.toUpperCase();
};

export const addContestNameToTaskIndex = (contestId: string, taskTableIndex: string): string => {
  const contestName = getContestNameLabel(contestId);

  return `${contestName} - ${taskTableIndex}`;
};
