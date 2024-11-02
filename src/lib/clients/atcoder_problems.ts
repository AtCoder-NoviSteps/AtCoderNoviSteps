import { ContestSiteApiClient } from '$lib/clients/common';
import { ATCODER_PROBLEMS_API_BASE_URL } from '$lib/constants/urls';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

export class AtCoderProblemsApiClient extends ContestSiteApiClient {
  /**
   * Fetches the list of contests from the AtCoder Problems API.
   *
   * @returns {Promise<ContestsForImport>} A promise that resolves to the list of contests.
   * @throws Will throw an error if the fetch operation fails or if the response is invalid.
   */
  async getContests(): Promise<ContestsForImport> {
    const contests = await this.fetchApiWithConfig<ContestsForImport>({
      baseApiUrl: ATCODER_PROBLEMS_API_BASE_URL,
      endpoint: 'contests.json',
      errorMessage: 'Failed to fetch contests from AtCoder Problems API',
      validateResponse: (data) => Array.isArray(data) && data.length > 0,
    });

    console.log(`Found AtCoder: ${contests.length} contests.`);

    return contests;
  }

  /**
   * Fetches tasks from the AtCoder Problems API.
   *
   * @returns {Promise<TasksForImport>} A promise that resolves to an array of tasks for import.
   * @throws Will throw an error if the fetch operation fails or if the response validation fails.
   */
  async getTasks(): Promise<TasksForImport> {
    const tasks = await this.fetchApiWithConfig<TasksForImport>({
      baseApiUrl: ATCODER_PROBLEMS_API_BASE_URL,
      endpoint: 'problems.json',
      errorMessage: 'Failed to fetch tasks from AtCoder Problems API',
      validateResponse: (data) => Array.isArray(data) && data.length > 0,
    });

    console.log(`Found AtCoder: ${tasks.length} tasks.`);

    return tasks;
  }
}
