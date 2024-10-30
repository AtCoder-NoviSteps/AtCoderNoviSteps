import { fetchAPI } from '$lib/clients/common';
import { ATCODER_PROBLEMS_API_BASE_URL } from '$lib/constants/urls';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

export async function getContests(): Promise<ContestsForImport> {
  const allContestsUrl = `${ATCODER_PROBLEMS_API_BASE_URL}/contests.json`;
  const contests = await fetchAPI<ContestsForImport>(
    allContestsUrl,
    'Failed to fetch contests from AtCoder Problems API',
  );

  console.log(`Found AtCoder: ${contests.length} contests.`);

  return contests;
}

export async function getTasks(): Promise<TasksForImport> {
  const allProblemsUrl = `${ATCODER_PROBLEMS_API_BASE_URL}/problems.json`;
  const tasks = await fetchAPI<TasksForImport>(
    allProblemsUrl,
    'Failed to fetch tasks from AtCoder Problems API',
  );

  console.log(`Found AtCoder: ${tasks.length} tasks.`);

  return tasks;
}
