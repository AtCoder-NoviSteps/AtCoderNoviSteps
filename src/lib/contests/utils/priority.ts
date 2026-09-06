import { ContestType } from '$lib/contests/types/contest';
import { classifyContest } from './classification';

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

/** Priority given to a contest_id that no classification rule matches, so it sorts last. */
export const UNCLASSIFIED_CONTEST_PRIORITY = 10 ** 3;

export function getContestPriority(contestId: string): number {
  const contestType = classifyContest(contestId);

  if (contestType === null || contestType === undefined) {
    return UNCLASSIFIED_CONTEST_PRIORITY;
  } else {
    return contestTypePriorities.get(contestType) as number;
  }
}
