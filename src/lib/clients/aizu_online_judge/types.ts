/**
 * Represents the response structure from AOJ Course API
 */
export type AOJCourseAPI = {
  filter: string;
  courses: Courses;
};

/** Represents a course in the AOJ */
export type Course = {
  readonly id: number;
  readonly serial: number;
  readonly shortName: string;
  readonly name: string;
  readonly type: string;
};

export type Courses = Course[];

/**
 * Parameters for configuring a challenge contest in the AOJ.
 * @property {ChallengeContestType} contestType - The type of contest for the challenge.
 * @property {ChallengeRoundMap[ChallengeContestType]} round - The round of the contest.
 */
export type ChallengeParams = {
  contestType: ChallengeContestType;
  round: ChallengeRoundMap[ChallengeContestType];
};

/** Represents the types of challenge contests available. */
export type ChallengeContestType = 'PCK' | 'JAG';

/**
 * A map that associates each type of challenge contest with its corresponding round type.
 */
export type ChallengeRoundMap = {
  PCK: PckRound;
  JAG: JagRound;
};

/** Represents PCK contest rounds */
export type PckRound = 'PRELIM' | 'FINAL';

/** Represents JAG contest rounds */
export type JagRound = 'PRELIM' | 'REGIONAL';

export type AOJChallengeContestAPI = {
  readonly largeCl: Record<string, unknown>;
  readonly contests: ChallengeContests;
};

/** Represents a challenge contest in the AOJ */
export type ChallengeContest = {
  readonly abbr: string;
  readonly largeCl: string;
  readonly middleCl: string;
  readonly year: number;
  readonly progress: number;
  readonly numberOfProblems: number;
  readonly numberOfSolved: number;
  readonly days: { title: string; problems: AOJTaskAPI[] }[];
};

export type ChallengeContests = ChallengeContest[];

/**
 * Represents a task in the AOJ API response
 * @property {string} id - Unique identifier for the task
 * @property {string} name - Task name
 */
export type AOJTaskAPI = {
  readonly id: string;
  readonly available: number;
  readonly doctype: number;
  readonly name: string;
  readonly problemTimeLimit: number;
  readonly problemMemoryLimit: number;
  readonly maxScore: number;
  readonly solvedUser: number;
  readonly submissions: number;
  readonly recommendations: number;
  readonly isSolved: boolean;
  readonly bookmark: boolean;
  readonly recommend: boolean;
  readonly successRate: number;
  readonly score: number;
  readonly userScore: number;
};

export type AOJTaskAPIs = AOJTaskAPI[];

/**
 * Constant used as a placeholder for missing timestamp data in AOJ contests.
 * Value: -1
 */
export const PENDING = -1;
