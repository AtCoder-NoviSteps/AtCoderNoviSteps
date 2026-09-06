// Classification
export { classifyContest } from './utils/classification';
export { isWorldTourFinals, getWorldTourFinalsLabel } from './utils/labels/world_tour_finals';

// Priority
export { getContestPriority, contestTypePriorities } from './utils/priority';

// Labels
export { getContestNameLabel } from './utils/labels/index';
export { getPastContestLabel, PAST_TRANSLATIONS } from './utils/labels/past';
export { getJoiContestLabel } from './utils/labels/joi';
export { getAtCoderUniversityContestLabel } from './utils/labels/universities';
export { getAojContestLabel } from './utils/labels/aoj';

// Task index label
export { addContestNameToTaskIndex } from './utils/task_index_label';

// Constants
export {
  AOJ_COURSES,
  getPrefixForAojCourses,
  getContestPrefixes,
  regexForJag,
  regexForAojUniversity,
} from './utils/prefixes';
