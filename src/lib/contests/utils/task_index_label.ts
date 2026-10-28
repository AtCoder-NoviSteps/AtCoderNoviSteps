import { regexForJag, regexForAojUniversity, aojCoursePrefixes } from './prefixes';
import { getContestNameLabel } from './labels/index';
import { isNoJudgeTask } from './no_judge';

export const addContestNameToTaskIndex = (
  contestId: string,
  taskTableIndex: string,
  taskId: string,
): string => {
  const label = `${getContestNameLabel(contestId)} - ${taskTableIndex}`;

  // No Judge tasks share AOJ contest ids but have no judge, so check the task id first.
  if (isNoJudgeTask(taskId)) {
    return `${label}（No Judge）`;
  }

  return isAojContest(contestId) ? `${label}（AOJ）` : label;
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
