import type { HttpRequestClient } from '$lib/clients/http_client';
import type { ContestTaskCache } from '$lib/clients/cache_strategy';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

type FetchContestsConfig<T> = {
  cacheKey: string;
  endpoint: string;
  errorMessage: string;
  validateResponse: (data: T) => boolean;
  transformer: (data: T) => ContestsForImport;
  label: string;
};

type FetchTasksConfig<T> = {
  cacheKey: string;
  endpoint: string;
  errorMessage: string;
  validateResponse: (data: T) => boolean;
  transformer: (data: T) => TasksForImport;
  label: string;
};

export async function getCachedOrFetchContests<T>(
  httpClient: HttpRequestClient,
  cache: ContestTaskCache,
  config: FetchContestsConfig<T>,
): Promise<ContestsForImport> {
  return cache.getCachedOrFetchContests(config.cacheKey, async () => {
    const apiResponse = await httpClient.fetchApiWithConfig<T>({
      endpoint: config.endpoint,
      errorMessage: config.errorMessage,
      validateResponse: config.validateResponse,
    });

    const contests = config.transformer(apiResponse);
    console.debug(`Found ${config.label}: ${contests.length} contests`);

    return contests;
  });
}

export async function getCachedOrFetchTasks<T>(
  httpClient: HttpRequestClient,
  cache: ContestTaskCache,
  config: FetchTasksConfig<T>,
): Promise<TasksForImport> {
  return cache.getCachedOrFetchTasks(config.cacheKey, async () => {
    const apiResponse = await httpClient.fetchApiWithConfig<T>({
      endpoint: config.endpoint,
      errorMessage: config.errorMessage,
      validateResponse: config.validateResponse,
    });

    const tasks = config.transformer(apiResponse);
    console.debug(`Found ${config.label}: ${tasks.length} tasks`);

    return tasks;
  });
}
