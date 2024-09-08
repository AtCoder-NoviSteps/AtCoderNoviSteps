// Import original enum as type.
import type { ContestType as ContestTypeOrigin } from '@prisma/client';

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
  OTHERS: 'OTHERS',
} as const;

// Re-exporting the original type with the original name.
export type ContestType = ContestTypeOrigin;
