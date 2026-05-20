import { HttpRequestClient } from '$lib/clients/http_client';

import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

import { ATCODER_PROBLEMS_API_BASE_URL } from '$lib/constants/urls';

/**
 * The `AtCoderProblemsApiClient` class provides methods to interact with the AtCoder Problems API.
 * Uses `HttpRequestClient` for HTTP requests.
 *
 * @class
 */
export class AtCoderProblemsApiClient {
  constructor(private readonly http = new HttpRequestClient(ATCODER_PROBLEMS_API_BASE_URL)) {}

  /**
   * Fetches the list of contests from the AtCoder Problems API.
   *
   * @returns {Promise<ContestsForImport>} A promise that resolves to the list of contests.
   */
  async getContests(): Promise<ContestsForImport> {
    try {
      const contests = await this.http.fetchApiWithConfig<ContestsForImport>({
        endpoint: 'contests.json',
        errorMessage: 'Failed to fetch contests from AtCoder Problems API',
        validateResponse: (data) => Array.isArray(data) && data.length > 0,
      });

      console.log(`Found AtCoder: ${contests.length} contests.`);

      return contests.map((contest) => ({ ...contest, title: contest.title.trim() }));
    } catch (error) {
      console.error(`Failed to fetch from AtCoder contests`, error);
      return [];
    }
  }

  /**
   * Fetches tasks from the AtCoder Problems API.
   *
   * @returns {Promise<TasksForImport>} A promise that resolves to an array of tasks for import.
   */
  async getTasks(): Promise<TasksForImport> {
    try {
      const tasks = await this.http.fetchApiWithConfig<TasksForImport>({
        endpoint: 'problems.json',
        errorMessage: 'Failed to fetch tasks from AtCoder Problems API',
        validateResponse: (data) => Array.isArray(data) && data.length > 0,
      });

      console.log(`Found AtCoder: ${tasks.length} tasks.`);

      return tasks.map((task) => ({ ...task, title: task.title.trim() }));
    } catch (error) {
      console.error(`Failed to fetch from AtCoder tasks`, error);
      return [];
    }
  }
}
