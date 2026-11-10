import { ContestType } from '#lib/contests/types/contest.js';

import type { AtCoderChampionshipEntries } from './atcoder_championship_provider';

// Newest first, following the maintainer's spreadsheet (jsc2025advance-final placed by the maintainer);
// qualifiers held as ABC / ARC rounds sit between finals, so contest ids cannot give this order.
export const JAPANESE_STUDENT_CHAMPIONSHIP_ENTRIES: Readonly<AtCoderChampionshipEntries> = [
  {
    contestId: 'jsc2026-final',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第七回日本最強プログラマー学生選手権 -決勝-',
  },
  {
    contestId: 'arc222',
    contestType: ContestType.ARC,
    title: '第七回日本最強プログラマー学生選手権 -予選-（ARC 222）',
  },
  {
    contestId: 'jsc2025advance-final',
    contestType: ContestType.ABC_LIKE,
    title: '日本最強プログラマー学生選手権～Advance～',
  },
  {
    contestId: 'jsc2025-final',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第六回日本最強プログラマー学生選手権 -決勝-',
  },
  {
    contestId: 'arc201',
    contestType: ContestType.ARC,
    title: '第六回日本最強プログラマー学生選手権 -予選-（ARC 201）',
  },
  {
    contestId: 'jsc2024-final',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第五回日本最強プログラマー学生選手権 -決勝-',
  },
  {
    contestId: 'arc180',
    contestType: ContestType.ARC,
    title: '第五回日本最強プログラマー学生選手権 -予選-（ARC 180）',
  },
  {
    contestId: 'jsc2023-final',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第四回日本最強プログラマー学生選手権 -決勝-',
  },
  {
    contestId: 'abc313',
    contestType: ContestType.ABC,
    title: '第四回日本最強プログラマー学生選手権 -予選-（ABC 313）',
  },
  {
    contestId: 'jsc2022-final-open',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第三回日本最強プログラマー学生選手権 -決勝-',
  },
  {
    contestId: 'abc262',
    contestType: ContestType.ABC,
    title: '第三回日本最強プログラマー学生選手権 -予選-（ABC 262）',
  },
  {
    contestId: 'jsc2021ex',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第二回日本最強プログラマー学生選手権 エキシビジョン',
  },
  {
    contestId: 'jsc2021',
    contestType: ContestType.ABC_LIKE,
    title: '第二回日本最強プログラマー学生選手権（ABC-like）',
  },
  {
    contestId: 'jsc2019-final',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第一回日本最強プログラマー学生選手権決勝',
  },
  {
    contestId: 'jsc2019-qual',
    contestType: ContestType.ARC_LIKE,
    title: '第一回日本最強プログラマー学生選手権-予選-（ARC-like）',
  },
];
