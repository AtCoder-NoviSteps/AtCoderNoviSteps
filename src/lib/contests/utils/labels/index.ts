import { ContestType } from '$lib/contests/types/contest';

import { classifyContest } from '../classification';
import { AOJ_COURSES } from '../prefixes';
import { generateAxcLabel, generateAwcLabel } from './axc';
import { getAtCoderUniversityContestLabel } from './universities';
import { getWorldTourFinalsLabel } from './world_tour_finals';
import { generateOthersLabel } from './atcoder_others';
import { getJoiContestLabel } from './joi';
import { getPastContestLabel, PAST_TRANSLATIONS } from './past';
import {
  getAojContestLabel,
  getAojUniversityContestLabel,
  PCK_TRANSLATIONS,
  JAG_TRANSLATIONS,
  ICPC_TRANSLATIONS,
} from './aoj';

type LabelGenerator = (contestId: string) => string | null;

export const LABEL_GENERATORS: ReadonlyMap<ContestType, LabelGenerator> = new Map([
  [ContestType.ABC, generateAxcLabel],
  [ContestType.ARC, generateAxcLabel],
  [ContestType.AGC, generateAxcLabel],
  [ContestType.AWC, generateAwcLabel],
  [ContestType.APG4B, (id) => id],
  [ContestType.TYPICAL90, () => '競プロ典型 90 問'],
  [ContestType.EDPC, () => 'EDPC'],
  [ContestType.TDPC, () => 'TDPC'],
  [ContestType.NDPC, () => 'NDPC'],
  [ContestType.PAST, (id) => getPastContestLabel(PAST_TRANSLATIONS, id)],
  [ContestType.ACL_PRACTICE, () => 'ACL Practice'],
  [ContestType.JOI, (id) => getJoiContestLabel(id)],
  [ContestType.TESSOKU_BOOK, () => '競技プログラミングの鉄則'],
  [ContestType.MATH_AND_ALGORITHM, () => 'アルゴリズムと数学'],
  [ContestType.FPS_24, () => 'FPS 24 題'],
  [ContestType.ATCODER_MAIN_OFFICIAL_ONSITE, (id) => getWorldTourFinalsLabel(id)],
  [ContestType.UNIVERSITY, (id) => getAtCoderUniversityContestLabel(id)],
  [ContestType.OTHERS, generateOthersLabel],
  [ContestType.AOJ_COURSES, (id) => getAojContestLabel(AOJ_COURSES, id)],
  [ContestType.AOJ_PCK, (id) => getAojContestLabel(PCK_TRANSLATIONS, id)],
  [ContestType.AOJ_ICPC, (id) => getAojContestLabel(ICPC_TRANSLATIONS, id)],
  [ContestType.AOJ_JAG, (id) => getAojContestLabel(JAG_TRANSLATIONS, id)],
  [ContestType.AOJ_UNIVERSITY, (id) => getAojUniversityContestLabel(id)],
]);

export const getContestNameLabel = (contestId: string): string => {
  const contestType = classifyContest(contestId);

  if (!contestType) {
    return contestId.toUpperCase();
  }

  const generator = LABEL_GENERATORS.get(contestType);

  if (!generator) {
    return contestId.toUpperCase();
  }

  return generator(contestId) ?? contestId.toUpperCase();
};
