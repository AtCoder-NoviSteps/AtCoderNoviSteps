import { regexForJag, regexForAojUniversity, aojCoursePrefixes } from './prefixes';
import { getContestNameLabel } from './labels/index';

export {
  regexForJag,
  regexForAojUniversity,
  getContestPrefixes,
  getPrefixForAojCourses,
  AOJ_COURSES,
} from './prefixes';
export { classifyContest, isWorldTourFinals, getWorldTourFinalsLabel } from './classification';
export { contestTypePriorities, getContestPriority } from './priority';
export { getContestNameLabel } from './labels/index';
export { getPastContestLabel, PAST_TRANSLATIONS } from './labels/past';
export { getJoiContestLabel } from './labels/joi';
export { getAtCoderUniversityContestLabel } from './labels/universities';
export { getAojContestLabel } from './labels/aoj';

export const addContestNameToTaskIndex = (contestId: string, taskTableIndex: string): string => {
  const contestName = getContestNameLabel(contestId);

  if (isAojContest(contestId)) {
    return `AOJ ${taskTableIndex}${contestName}`;
  }

  return `${contestName} - ${taskTableIndex}`;
};

function isAojContest(contestId: string): boolean {
  return (
    aojCoursePrefixes.has(contestId) ||
    contestId.startsWith('PCK') ||
    regexForJag.test(contestId) ||
    contestId.startsWith('ICPC') ||
    regexForAojUniversity.test(contestId)
  );
}
