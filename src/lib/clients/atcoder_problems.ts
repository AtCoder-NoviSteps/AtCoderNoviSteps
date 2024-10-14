import { fetchAPI } from '$lib/clients/common';
import type { ImportContest, ImportContests } from '$lib/types/contest';
import type { ImportTask, ImportTasks } from '$lib/types/task';

export async function getContests(): Promise<ImportContests> {
  const allContestsUrl = 'https://kenkoooo.com/atcoder/resources/contests.json';
  const contests = await fetchAPI<ImportContest>(
    allContestsUrl,
    'Failed to fetch contests from AtCoder Problems API',
  );

  return contests;
}

export async function getTasks(): Promise<ImportTasks> {
  const allProblemsUrl = 'https://kenkoooo.com/atcoder/resources/problems.json';
  const tasks = await fetchAPI<ImportTask>(
    allProblemsUrl,
    'Failed to fetch tasks from AtCoder Problems API',
  );

  return tasks;
}
