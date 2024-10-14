// HACK: 名称をより明確なものにリネームする。
// 理由: これからインポートするというニュアンスだが、インポート済みと勘違いしやすいため。
export interface ImportContest {
  id: string;
  start_epoch_second: string;
  duration_second: string;
  title: string;
  rate_change: string;
}

export type ImportContests = ImportContest[];

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
  AGC: 'AGC', // AtCoder Grand Contest
  ABC_LIKE: 'ABC_LIKE', // AtCoder Beginner Contest (ABC) 相当のコンテスト
  ARC_LIKE: 'ARC_LIKE', // AtCoder Regular Contest (ARC) 相当のコンテスト
  AGC_LIKE: 'AGC_LIKE', // AtCoder Grand Contest (AGC) 相当のコンテスト
  OTHERS: 'OTHERS',
} as const;

// Re-exporting the original type with the original name.
export type ContestType = ContestTypeOrigin;
