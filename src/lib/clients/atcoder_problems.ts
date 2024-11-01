import { fetchAPI } from '$lib/clients/common';
import { ATCODER_PROBLEMS_API_BASE_URL } from '$lib/constants/urls';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

type FetchAPIConfig<T> = {
  endpoint: string;
  errorMessage: string;
  validateResponse?: (data: T) => boolean;
};

async function fetchAPIWithConfig<T>({
  endpoint,
  errorMessage,
  validateResponse,
}: FetchAPIConfig<T>): Promise<T> {
  const url = new URL(endpoint, ATCODER_PROBLEMS_API_BASE_URL).toString();
  const data = await fetchAPI<T>(url, errorMessage);

  if (validateResponse && !validateResponse(data)) {
    throw new Error(`${errorMessage}`);
  }

  return data;
}

export async function getContests(): Promise<ContestsForImport> {
  const contests = await fetchAPIWithConfig<ContestsForImport>({
    endpoint: 'contests.json',
    errorMessage: 'Failed to fetch contests from AtCoder Problems API',
    validateResponse: (data) => Array.isArray(data) && data.length > 0,
  });

  console.log(`Found AtCoder: ${contests.length} contests.`);

  return contests;
}

export async function getTasks(): Promise<TasksForImport> {
  const tasks = await fetchAPIWithConfig<TasksForImport>({
    endpoint: 'problems.json',
    errorMessage: 'Failed to fetch tasks from AtCoder Problems API',
    validateResponse: (data) => Array.isArray(data) && data.length > 0,
  });

  console.log(`Found AtCoder: ${tasks.length} tasks.`);

  return tasks;
}
