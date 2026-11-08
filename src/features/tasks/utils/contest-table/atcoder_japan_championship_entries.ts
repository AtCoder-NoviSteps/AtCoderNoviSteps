import { ContestType } from '#lib/contests/types/contest.js';

export type AtCoderJapanChampionshipEntry = {
  contestId: string;
  // Builds the provider key (e.g. ARC::arc232); cell keys depend on it only for ABC, which no entry uses.
  contestType: ContestType;
  title: string;
};

export type AtCoderJapanChampionshipEntries = AtCoderJapanChampionshipEntry[];

// Newest first, following the maintainer's spreadsheet; qualifiers held as ARC rounds sit between finals, so contest ids cannot give this order.
export const ATCODER_JAPAN_CHAMPIONSHIP_ENTRIES: Readonly<AtCoderJapanChampionshipEntries> = [
  {
    contestId: 'arc232',
    contestType: ContestType.ARC,
    title: '第三回 AtCoder Japan Open -予選-（ARC 232）',
  },
  {
    contestId: 'ajo2025-final-open',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第二回 AtCoder Japan Open -決勝-',
  },
  {
    contestId: 'arc207',
    contestType: ContestType.ARC,
    title: '第二回 AtCoder Japan Open -予選-（ARC 207）',
  },
  {
    contestId: 'ajo2024-final',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第一回 AtCoder Japan Open -決勝-',
  },
  {
    contestId: 'arc186',
    contestType: ContestType.ARC,
    title: 'AtCoder Japan Open -予選-（ARC 186）',
  },
  {
    contestId: 'nikkei2019-2-final',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '第二回全国統一プログラミング王決定戦本戦',
  },
  {
    contestId: 'nikkei2019-2-qual',
    contestType: ContestType.ARC_LIKE,
    title: '第二回全国統一プログラミング王決定戦予選（ARC-like）',
  },
  {
    contestId: 'nikkei2019-ex',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '全国統一プログラミング王決定戦 エキシビジョン',
  },
  {
    contestId: 'nikkei2019-final',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '全国統一プログラミング王決定戦本戦',
  },
  {
    contestId: 'nikkei2019-qual',
    contestType: ContestType.ARC_LIKE,
    title: '全国統一プログラミング王決定戦予選（ARC-like）',
  },
];
