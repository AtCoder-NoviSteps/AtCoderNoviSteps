import { ContestType } from '$lib/contests/types/contest';
import {
  regexForJag,
  regexForAojUniversity,
  abcLikePrefixes,
  arcLikePrefixes,
  agcLikePrefixes,
  atCoderUniversityPrefixes,
  atCoderOthersPrefixes,
  aojCoursePrefixes,
} from './prefixes';

// See:
// https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/utils/ContestClassifier.ts

// Exact-match table: O(1) lookup for contest IDs that map to a single type.
const CONTEST_TYPES_BY_ID: ReadonlyMap<string, ContestType> = new Map([
  ['abs', ContestType.ABS],
  ['typical90', ContestType.TYPICAL90],
  ['dp', ContestType.EDPC],
  ['tdpc', ContestType.TDPC],
  ['ndpc', ContestType.NDPC],
  ['practice2', ContestType.ACL_PRACTICE],
  ['tessoku-book', ContestType.TESSOKU_BOOK],
  ['math-and-algorithm', ContestType.MATH_AND_ALGORITHM],
  ['fps-24', ContestType.FPS_24],
]);

type ClassificationRule = {
  matches: (contestId: string) => boolean;
  type: ContestType;
};

// Ordered rules: first match wins. Regex and prefix-based checks.
const CLASSIFICATION_RULES: readonly ClassificationRule[] = [
  // AtCoder numbered contests
  { matches: (id) => /^abc\d{3}$/.test(id), type: ContestType.ABC },
  { matches: (id) => /^arc\d{3}$/.test(id), type: ContestType.ARC },
  { matches: (id) => /^agc\d{3}$/.test(id), type: ContestType.AGC },
  { matches: (id) => /^awc\d{4}$/.test(id), type: ContestType.AWC },
  { matches: (id) => id.startsWith('APG4b'), type: ContestType.APG4B },
  { matches: (id) => id.startsWith('past'), type: ContestType.PAST },
  { matches: (id) => id.startsWith('joi'), type: ContestType.JOI },
  { matches: (id) => isWorldTourFinals(id), type: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE },
  // Set-based exact matches
  { matches: (id) => abcLikePrefixes.has(id), type: ContestType.ABC_LIKE },
  { matches: (id) => arcLikePrefixes.has(id), type: ContestType.ARC_LIKE },
  // Prefix-based matches
  { matches: (id) => agcLikePrefixes.some((p) => id.startsWith(p)), type: ContestType.AGC_LIKE },
  {
    matches: (id) => atCoderUniversityPrefixes.some((p) => id.startsWith(p)),
    type: ContestType.UNIVERSITY,
  },
  {
    matches: (id) => atCoderOthersPrefixes.some((p) => id.startsWith(p)),
    type: ContestType.OTHERS,
  },
  // AOJ
  { matches: (id) => aojCoursePrefixes.has(id), type: ContestType.AOJ_COURSES },
  { matches: (id) => /^PCK(Prelim|Final)\d*$/.test(id), type: ContestType.AOJ_PCK },
  { matches: (id) => /^ICPC(Prelim|Regional)\d*$/.test(id), type: ContestType.AOJ_ICPC },
  { matches: (id) => regexForJag.test(id), type: ContestType.AOJ_JAG },
  { matches: (id) => regexForAojUniversity.test(id), type: ContestType.AOJ_UNIVERSITY },
];

export const classifyContest = (contestId: string): ContestType | null => {
  const exactMatch = CONTEST_TYPES_BY_ID.get(contestId);
  if (exactMatch) return exactMatch;

  const matchedRule = CLASSIFICATION_RULES.find((rule) => rule.matches(contestId));
  return matchedRule?.type ?? null;
};

// World Tour Finals (AtCoder official onsite finals), Algorithm division only.
//
// Seeded contest_id values carry a trailing "-open" (e.g. wtf19-open), except
// wtf22-day2 which AtCoder Problems records without it; strip it before matching
// so both forms work and it never leaks into the display label.
//
// From 2025 the id gains an "algo" infix (awtf2025algo-open) to disambiguate
// from the new Heuristic division (awtf2025heuristic), which stays out of scope.
const regexForWorldTourFinals = /^(wtf19|wtf22-day[12]|awtf2024|awtf20\d{2}algo)$/;

export const isWorldTourFinals = (contestId: string): boolean =>
  regexForWorldTourFinals.test(stripOpenSuffix(contestId));

export const getWorldTourFinalsLabel = (contestId: string): string => {
  const base = 'World Tour Finals';
  const id = stripOpenSuffix(contestId);

  if (id === 'wtf19') {
    return `${base} 2019`;
  }

  const dayMatch = /^wtf22-day([12])$/.exec(id);

  if (dayMatch) {
    return `${base} 2022 Day${dayMatch[1]}`;
  }

  if (id === 'awtf2024') {
    return `${base} 2024`;
  }

  const algoMatch = /^awtf(20\d{2})algo$/.exec(id);

  if (algoMatch) {
    // "Algorithm" distinguishes from the Heuristic division, introduced in 2025.
    return `${base} ${algoMatch[1]} Algorithm`;
  }

  return contestId.toUpperCase();
};

export const stripOpenSuffix = (contestId: string): string =>
  contestId.endsWith('-open') ? contestId.slice(0, -'-open'.length) : contestId;
