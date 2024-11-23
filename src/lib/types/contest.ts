import type { TasksForImport } from '$lib/types/task';

export interface Contest {
  id: string;
  start_epoch_second: number;
  duration_second: number;
  title: string;
  tasks: TasksForImport;
}

export type Contests = Contest[];

export interface ContestForImport {
  id: string;
  start_epoch_second: number;
  duration_second: number;
  title: string;
  rate_change: string;
}

export type ContestsForImport = ContestForImport[];

// Import original enum as type.
import type { ContestType as ContestTypeOrigin } from '@prisma/client';

/**
 * An object representing various types of programming contests.
 * Each key is a contest type identifier, and the value is the same identifier as a string.
 */
export const ContestType: { [key in ContestTypeOrigin]: key } = {
  ABC: 'ABC', // AtCoder Beginner Contest
  APG4B: 'APG4B', // C++入門 AtCoder Programming Guide for beginners
  ABS: 'ABS', // AtCoder Beginners Selection
  ACL_PRACTICE: 'ACL_PRACTICE', // AtCoder Library Practice Contest
  PAST: 'PAST', // Practical Algorithm Skill Test (アルゴリズム実技検定)
  EDPC: 'EDPC', // Educational DP Contest / DP まとめコンテスト
  TDPC: 'TDPC', // Typical DP Contest
  JOI: 'JOI', // Japanese Olympiad in Informatics
  TYPICAL90: 'TYPICAL90', // 競プロ典型 90 問
  TESSOKU_BOOK: 'TESSOKU_BOOK', // 競技プログラミングの鉄則
  MATH_AND_ALGORITHM: 'MATH_AND_ALGORITHM', // アルゴリズムと数学
  ARC: 'ARC', // AtCoder Regular Contest
  AGC: 'AGC', // AtCoder Grand Contest
  ABC_LIKE: 'ABC_LIKE', // AtCoder Beginner Contest (ABC) 相当のコンテスト
  ARC_LIKE: 'ARC_LIKE', // AtCoder Regular Contest (ARC) 相当のコンテスト
  AGC_LIKE: 'AGC_LIKE', // AtCoder Grand Contest (AGC) 相当のコンテスト
  UNIVERSITY: 'UNIVERSITY', // University Programming Contests in AtCoder (e.g., UTPC)
  OTHERS: 'OTHERS', // AtCoder (その他)
  AOJ_COURSES: 'AOJ_COURSES', // AIZU ONLINE JUDGE Courses
  AOJ_PCK: 'AOJ_PCK', // All-Japan High School Programming Contest (PCK)
  AOJ_JAG: 'AOJ_JAG', // ACM-ICPC Japan Alumni Group Contest (JAG)
} as const;

// Re-exporting the original type with the original name.
export type ContestType = ContestTypeOrigin;

/**
 * Represents a mapping of contest IDs to contest names.
 *
 * @interface ContestPrefix
 * @property {string} [key] - The contest ID.
 * @property {string} [key: string] - The contest name associated with the contest ID.
 * @example
 * {
 *   "abc001": "AtCoder Beginner Contest 001",
 *   "arc123": "AtCoder Regular Contest 123",
 *   "utpc2023": "University of Tokyo Programming Contest 2023"
 * }
 */
export interface ContestPrefix {
  [key: string]: string;
}

/**
 * Represents a collection of translations for contest labels.
 * The keys are language codes or identifiers, and the values are the translated strings.
 *
 * @property {string} [key] - The abbr contest type in English.
 * @property {string} [key: string] - The contest name in Japanese.
 */
export type ContestLabelTranslations = {
  [key: string]: string;
};
