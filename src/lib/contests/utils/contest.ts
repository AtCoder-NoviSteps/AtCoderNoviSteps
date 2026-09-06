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
export { addContestNameToTaskIndex } from './task_index_label';
