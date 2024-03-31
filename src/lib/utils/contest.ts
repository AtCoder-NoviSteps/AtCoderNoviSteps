import { ContestType } from '$lib/types/contest';

// See:
// https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/utils/ContestClassifier.ts
export const classifyContest = (contest_id: string) => {
  if (/^abc\d{3}$/.exec(contest_id)) {
    return ContestType.ABC;
  }

  if (contest_id === 'APG4b') {
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

  return null;
};

// priority: 0 (High) - 10 (Low)
// See:
// https://jsprimer.net/basic/map-and-set/
export const contestTypePriorities: Map<ContestType, number> = new Map([
  [ContestType.ABC, 0],
  [ContestType.APG4B, 1],
  [ContestType.ABS, 2],
  [ContestType.TYPICAL90, 3],
  [ContestType.EDPC, 4],
  [ContestType.TDPC, 5],
  [ContestType.PAST, 6],
  [ContestType.ACL_PRACTICE, 7],
  [ContestType.JOI, 8],
  [ContestType.TESSOKU_BOOK, 9],
  [ContestType.MATH_AND_ALGORITHM, 10],
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
  if (contest_id === 'APG4b') {
    return 'APG4b';
  }

  if (contest_id === 'practice2') {
    return 'ACL Practice';
  }

  if (contest_id === 'dp') {
    return 'EDPC';
  }

  return contest_id.toUpperCase();
};
