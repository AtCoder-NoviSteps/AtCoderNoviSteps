import { ContestType } from '#lib/contests/types/contest.js';
import { getContestNameLabel } from '#lib/contests/index.js';

import type { AtCoderChampionshipEntries } from './atcoder_championship_provider';

// Newest year first; the days of one event run Day1, Day2, ... (maintainer's rule for every table).
// Listed explicitly because the contest ids do not share one format (wtf19-open, wtf22-day2, awtf2026algo).
const WORLD_TOUR_FINALS_CONTEST_IDS = [
  'awtf2026algo',
  'awtf2025algo-open',
  'awtf2024-open',
  'wtf22-day1-open',
  'wtf22-day2',
  'wtf19-open',
];

export const ATCODER_WORLD_TOUR_FINALS_ENTRIES: Readonly<AtCoderChampionshipEntries> =
  WORLD_TOUR_FINALS_CONTEST_IDS.map((contestId) => ({
    contestId,
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: getContestNameLabel(contestId),
  }));
