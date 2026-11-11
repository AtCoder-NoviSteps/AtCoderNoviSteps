import { ContestType } from '#lib/contests/types/contest.js';

import type { AtCoderChampionshipEntries } from './atcoder_championship_provider';

// Newest first, following the maintainer's spreadsheet;
// qualifiers held as ABC rounds sit between finals, so contest ids cannot give this order.
export const CODE_QUEEN_ENTRIES: Readonly<AtCoderChampionshipEntries> = [
  {
    contestId: 'codequeen2026-final-Public',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: 'CodeQUEEN 2026 決勝',
  },
  {
    contestId: 'abc462',
    contestType: ContestType.ABC,
    title: 'CodeQUEEN 2026 予選（ABC 462）',
  },
  {
    contestId: 'codequeen2025-final-Public',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: 'CodeQUEEN 2025 決勝',
  },
  {
    contestId: 'abc410',
    contestType: ContestType.ABC,
    title: 'CodeQUEEN 2025 予選（ABC 410）',
  },
  {
    contestId: 'codequeen2024-final-N9tn8QqD',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: 'CodeQUEEN 2024 決勝',
  },
  {
    contestId: 'abc358',
    contestType: ContestType.ABC,
    title: 'CodeQUEEN 2024 予選（ABC 358）',
  },
  {
    contestId: 'codequeen2023-final-open',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: 'CodeQUEEN 2023 決勝',
  },
  {
    contestId: 'abc308',
    contestType: ContestType.ABC,
    title: 'CodeQUEEN 2023 予選（ABC 308）',
  },
];
