import { regexForJag, regexForAojUniversity, aojCoursePrefixes } from './prefixes';
import { getContestNameLabel } from './labels/index';

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
