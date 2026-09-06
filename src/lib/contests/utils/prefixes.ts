import type { ContestPrefix } from '$lib/contests/types/contest';

export const regexForJag = /^JAG(Prelim|Regional|Summer|Winter|Spring)\d{4}(-day\d+)?[A-Z]?$/;
export const regexForAojUniversity = /^AOJ-[A-Z]+PC\d{4}/;

// HACK: As of December 2025, the following contests are applicable.
// Note: The classification logic may need to be revised when new contests are added.
export const ABC_LIKE: ContestPrefix = {
  'tenka1-2017-beginner': 'Tenka1 Programmer Beginner Contest 2017',
  abl: 'ACL Beginner Contest',
  caddi2018b: 'CADDi 2018 for Beginners',
  'soundhound2018-summer-qual': 'SoundHound Inc. Programming Contest 2018 -Masters Tournament-',
  'tenka1-2018-beginner': 'Tenka1 Programmer Beginner Contest 2018',
  aising2019: 'エイシング プログラミング コンテスト 2019',
  sumitrust2019: '三井住友信託銀行プログラミングコンテスト2019',
  'tenka1-2019-beginner': 'Tenka1 Programmer Beginner Contest 2019',
  aising2020: 'エイシング プログラミング コンテスト 2020',
  hhkb2020: 'HHKB プログラミングコンテスト 2020',
  'm-solutions2020': 'M-SOLUTIONS プロコンオープン 2020',
  panasonic2020: 'パナソニックプログラミングコンテスト 2020',
  jsc2021: '第二回日本最強プログラマー学生選手権',
  zone2021: 'ZONeエナジー プログラミングコンテスト "HELLO SPACE"',
  'jsc2025advance-final': '日本最強プログラマー学生選手権～Advance～',
} as const;

export const ARC_LIKE: ContestPrefix = {
  'tenka1-2017': 'Tenka1 Programmer Contest 2017',
  'tenka1-2018': 'Tenka1 Programmer Contest 2018',
  'tenka1-2019': 'Tenka1 Programmer Contest 2019',
  caddi2018: 'CADDi 2018',
  'dwacon5th-prelims': '第5回 ドワンゴからの挑戦状 予選',
  'dwacon6th-prelims': '第6回 ドワンゴからの挑戦状 予選',
  diverta2019: 'diverta 2019 Programming Contest',
  keyence2019: 'キーエンス プログラミング コンテスト 2019',
  keyence2020: 'キーエンス プログラミング コンテスト 2020',
  keyence2021: 'キーエンス プログラミング コンテスト 2021',
  'jsc2019-qual': '第一回日本最強プログラマー学生選手権-予選-',
  'nikkei2019-qual': '全国統一プログラミング王決定戦予選',
  acl1: 'ACL Contest 1',
} as const;

export const AGC_LIKE: ContestPrefix = {
  'code-festival-2016-qual': 'CODE FESTIVAL 2016 qual',
  'code-festival-2017-qual': 'CODE FESTIVAL 2017 qual',
  'cf16-final': 'CODE FESTIVAL 2016 final',
  'cf17-final': 'CODE FESTIVAL 2017 final',
} as const;

// HACK: As of September 2025, KUPC, QUPC, UTPC, TTPC and TUPC are included.
// More university contests may be added in the future.
export const ATCODER_UNIVERSITIES: ContestPrefix = {
  kupc: 'KUPC',
  qupc: 'QUPC',
  utpc: 'UTPC',
  ttpc: 'TTPC',
  tupc: 'TUPC',
  wupc: 'WUPC',
} as const;

export const ATCODER_OTHERS: ContestPrefix = {
  chokudai_S: 'Chokudai SpeedRun',
  atc001: 'AtCoder Typical Contest 001',
  geocon2013: '幾何コンテスト2013',
  's8pc-3': 'square869120Contest #3',
  's8pc-4': 'square869120Contest #4',
  'maximum-cup-2013': 'Maximum-Cup 2013',
  'maximum-cup-2018': 'Maximum-Cup 2018',
  'code-festival-2014-quala': 'Code Festival 2014 予選 A',
  'code-festival-2014-qualb': 'Code Festival 2014 予選 B',
  'code-festival-2014-final': 'Code Festival 2014 決勝',
  'code-festival-2014-china-open': 'Code Festival 2014 上海',
  'code-festival-2015-qualb': 'Code Festival 2015 予選 B',
  'code-festival-2015-morning-middle': 'CODE FESTIVAL 2015 あさぷろ Middle',
  'code-festival-2015-exhibition': 'CODE FESTIVAL 2015 エキシビション',
  'code-thanks-festival': 'CODE THANKS FESTIVAL',
  donuts: 'Donutsプロコンチャレンジ',
  indeednow: 'Indeedなう',
  'tkppc4-2': '技術室奥プログラミングコンテスト#4 Day2',
  'dwango2016-prelims': '第2回 ドワンゴからの挑戦状 予選',
  'dwacon2017-prelims': '第3回 ドワンゴからの挑戦状 予選',
  'mujin-pc-2016': 'Mujin Programming Challenge 2016',
  'mujin-pc-2018': 'Mujin Programming Challenge 2018',
  'bitflyer2018-qual': 'codeFlyer （bitFlyer Programming Contest）',
  soundhound2018: 'SoundHound Inc. Programming Contest 2018 (春)',
  'pakencamp-2018-day3': 'パ研合宿コンペティション 3日目',
  'pakencamp-2024-day1': 'パ研合宿2024 第1日「SpeedRun」',
  'tenka1-2012-qualB': '天下一プログラマーコンテスト2012予選B',
  'tenka1-2015-quala': '天下一プログラマーコンテスト2015予選A',
  'tenka1-2015-qualb': '天下一プログラマーコンテスト2015予選B',
  'tenka1-2016-final': '天下一プログラマーコンテスト2016本戦',
  discovery2016: 'DISCO presents ディスカバリーチャンネル プログラミングコンテスト2016',
  colopl: 'COLOCON',
  gigacode: 'GigaCode',
  cpsco2019: 'CPSCO 2019',
  'iroha2019-day4': 'いろはちゃんコンテスト Day4',
  'nikkei2019-final': '全国統一プログラミング王決定戦本戦',
  'jsc2019-final': '第一回日本最強プログラマー学生選手権決勝',
  'jsc2025-final': '第六回日本最強プログラマー学生選手権 -決勝-',
  DEGwer2023: 'DEGwer さんの D 論応援コンテスト',
  xmascon19: 'Xmas Contest 2019',
} as const;

// AIZU ONLINE JUDGE AOJ Courses
export const AOJ_COURSES: ContestPrefix = {
  ITP1: 'プログラミング入門',
  ALDS1: 'アルゴリズムとデータ構造入門',
  ITP2: 'プログラミング応用',
  DPL: '組み合わせ最適化',
  GRL: 'グラフ',
  DSL: 'データ構造',
  CGL: '計算幾何学',
  NTL: '整数論',
} as const;

export function getPrefixForAojCourses() {
  return getContestPrefixes(AOJ_COURSES);
}

/**
 * Extracts contest prefixes (keys) from a contest prefix object.
 * @param contestPrefixes - Object mapping contest IDs to their display names
 * @returns Array of contest prefix strings
 */
export function getContestPrefixes(contestPrefixes: Record<string, string>) {
  return Object.keys(contestPrefixes);
}

// Pre-computed prefix sets/arrays for classification lookups
export const abcLikePrefixes = new Set(getContestPrefixes(ABC_LIKE));
export const arcLikePrefixes = new Set(getContestPrefixes(ARC_LIKE));
export const agcLikePrefixes = getContestPrefixes(AGC_LIKE);
export const atCoderUniversityPrefixes = getContestPrefixes(ATCODER_UNIVERSITIES);
export const atCoderOthersPrefixes = getContestPrefixes(ATCODER_OTHERS);
export const aojCoursePrefixes = new Set(getPrefixForAojCourses());
