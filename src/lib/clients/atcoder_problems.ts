import { ContestSiteApiClient } from '$lib/clients/common';
import { ATCODER_PROBLEMS_API_BASE_URL } from '$lib/constants/urls';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

/**
 * The `AtCoderProblemsApiClient` class provides methods to interact with the AtCoder Problems API.
 * It extends the `ContestSiteApiClient` class and includes methods to fetch contests and tasks.
 *
 * @class
 * @extends {ContestSiteApiClient}
 *
 * @method getContests
 * Fetches the list of contests from the AtCoder Problems API.
 * @returns {Promise<ContestsForImport>} A promise that resolves to the list of contests.
 * @throws Will throw an error if the fetch operation fails or if the response is invalid.
 *
 * @method getTasks
 * Fetches tasks from the AtCoder Problems API.
 * @returns {Promise<TasksForImport>} A promise that resolves to an array of tasks for import.
 * @throws Will throw an error if the fetch operation fails or if the response validation fails.
 */
export class AtCoderProblemsApiClient extends ContestSiteApiClient {
  /**
   * Fetches the list of contests from the AtCoder Problems API.
   *
   * @returns {Promise<ContestsForImport>} A promise that resolves to the list of contests.
   * @throws Will throw an error if the fetch operation fails or if the response is invalid.
   */
  async getContests(): Promise<ContestsForImport> {
    try {
      const contests = await this.fetchApiWithConfig<ContestsForImport>({
        baseApiUrl: ATCODER_PROBLEMS_API_BASE_URL,
        endpoint: 'contests.json',
        errorMessage: 'Failed to fetch contests from AtCoder Problems API',
        validateResponse: (data) => Array.isArray(data) && data.length > 0,
      });

      console.log(`Found AtCoder: ${contests.length} contests.`);

      return contests;
    } catch (error) {
      console.error(`Failed to fetch from AtCoder contests`, error);
      return [];
    }
  }

  /**
   * Fetches tasks from the AtCoder Problems API.
   *
   * @returns {Promise<TasksForImport>} A promise that resolves to an array of tasks for import.
   * @throws Will throw an error if the fetch operation fails or if the response validation fails.
   */
  async getTasks(): Promise<TasksForImport> {
    try {
      const tasks = await this.fetchApiWithConfig<TasksForImport>({
        baseApiUrl: ATCODER_PROBLEMS_API_BASE_URL,
        endpoint: 'problems.json',
        errorMessage: 'Failed to fetch tasks from AtCoder Problems API',
        validateResponse: (data) => Array.isArray(data) && data.length > 0,
      });

      console.log(`Found AtCoder: ${tasks.length} tasks.`);

      return tasks;
    } catch (error) {
      console.error(`Failed to fetch from AtCoder tasks`, error);
      return [];
    }
  }
}
