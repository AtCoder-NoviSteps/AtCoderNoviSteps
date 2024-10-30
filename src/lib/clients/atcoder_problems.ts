import { fetchAPI } from '$lib/clients/common';
import { ATCODER_PROBLEMS_API_BASE_URL } from '$lib/constants/urls';
import type { ImportContests } from '$lib/types/contest';
import type { ImportTasks } from '$lib/types/task';

export async function getContests(): Promise<ImportContests> {
  const allContestsUrl = `${ATCODER_PROBLEMS_API_BASE_URL}/contests.json`;
  const contests = await fetchAPI<ImportContests>(
    allContestsUrl,
    'Failed to fetch contests from AtCoder Problems API',
  );

  console.log(`Found AtCoder: ${contests.length} contests.`);

  return contests;
}

export async function getTasks(): Promise<ImportTasks> {
  const allProblemsUrl = `${ATCODER_PROBLEMS_API_BASE_URL}/problems.json`;
  const tasks = await fetchAPI<ImportTasks>(
    allProblemsUrl,
    'Failed to fetch tasks from AtCoder Problems API',
  );

  console.log(`Found AtCoder: ${tasks.length} tasks.`);

  return tasks;
}
