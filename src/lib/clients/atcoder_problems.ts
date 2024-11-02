import { ContestSiteApiClient } from '$lib/clients/common';
import { ATCODER_PROBLEMS_API_BASE_URL } from '$lib/constants/urls';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

export class AtCoderProblemsApiClient extends ContestSiteApiClient {
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
