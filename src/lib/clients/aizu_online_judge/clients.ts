import { type TasksApiClient, HttpRequestClient } from '$lib/clients/http_client';
import { ContestTaskCache } from '$lib/clients/cache_strategy';
import { Cache, type ApiClientConfig } from '$lib/clients/cache';

import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

import { AOJ_API_BASE_URL } from '$lib/constants/urls';

import type {
  AOJCourseAPI,
  Course,
  AOJTaskAPIs,
  AOJTaskAPI,
  AOJChallengeContestAPI,
  ChallengeContest,
  ChallengeParams,
  ChallengeContestType,
  ChallengeRoundMap,
} from './types';
import { buildEndpoint, mapToContest, mapToTask, getCourseName } from './utils';

/**
 * AojApiClient is a client for interacting with the Aizu Online Judge (AOJ) API.
 * It implements TasksApiClient and provides methods to fetch contests and tasks
 * from the AOJ platform.
 *
 * @class AojApiClient
 * @implements {TasksApiClient<void>}
 */
export class AojApiClient implements TasksApiClient<void> {
  private readonly coursesApiClient: AojCoursesApiClient;
  private readonly challengesApiClient: AojChallengesApiClient;

  /**
   * Array of API clients configured for Aizu Online Judge.
   *
   * @private
   * @readonly
   */
  private readonly apiClients: {
    label: string;
    client: TasksApiClient<undefined | ChallengeParams>;
    params?: ChallengeParams;
  }[];

  /**
   * Constructs an instance of the Aizu Online Judge client.
   *
   * @param {ApiClientConfig} [config] - Optional configuration object for the API client.
   */
  constructor(config?: ApiClientConfig) {
    const contestCache = new Cache<ContestsForImport>(
      config?.contestCache?.timeToLive,
      config?.contestCache?.maxSize,
    );
    const taskCache = new Cache<TasksForImport>(
      config?.taskCache?.timeToLive,
      config?.taskCache?.maxSize,
    );

    const caches = new ContestTaskCache(contestCache, taskCache);
    const httpClient = new HttpRequestClient(AOJ_API_BASE_URL);

    this.coursesApiClient = new AojCoursesApiClient(httpClient, caches);
    this.challengesApiClient = new AojChallengesApiClient(httpClient, caches);

    this.apiClients = [
      {
        label: 'course',
        client: this.coursesApiClient,
      },
      {
        label: 'pck-prelim',
        client: this.challengesApiClient,
        params: { contestType: 'PCK', round: 'PRELIM' },
      },
      {
        label: 'pck-final',
        client: this.challengesApiClient,
        params: { contestType: 'PCK', round: 'FINAL' },
      },
      {
        label: 'jag-prelim',
        client: this.challengesApiClient,
        params: { contestType: 'JAG', round: 'PRELIM' },
      },
      {
        label: 'jag-regional',
        client: this.challengesApiClient,
        params: { contestType: 'JAG', round: 'REGIONAL' },
      },
    ];
  }

  /**
   * Fetches and combines contests from different sources.
   *
   * @returns {Promise<ContestsForImport>} A promise that resolves to an array of contests.
   */
  async getContests(): Promise<ContestsForImport> {
    return (await this.fetchAllData<ContestsForImport>('getContests')).flat();
  }

  /**
   * Fetches tasks from various sources and combines them into a single list.
   *
   * @returns {Promise<TasksForImport>} A promise that resolves to an array of tasks.
   */
  async getTasks(): Promise<TasksForImport> {
    return (await this.fetchAllData<TasksForImport>('getTasks')).flat();
  }

  private async fetchAllData<T>(methodName: 'getContests' | 'getTasks'): Promise<T[]> {
    try {
      const requests = this.apiClients.map((apiClient) =>
        apiClient.client[methodName](apiClient.params),
      );

      const responses = await Promise.allSettled(requests);
      let results: T[] = [];

      results = responses.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to fetch from ${this.apiClients[index].label}:`, result.reason);
          return [];
        }
      }) as T[];

      return results;
    } catch (error) {
      console.error(`Failed to fetch data from AOJ API:`, error);
      return [];
    }
  }
}

/**
 * Abstract base class for Aizu Online Judge (AOJ) API clients.
 *
 * @template TParams - The type of parameters accepted by the API methods.
 */
export abstract class AojTasksApiClientBase<TParams = void> implements TasksApiClient<TParams> {
  constructor(
    protected readonly httpClient: HttpRequestClient,
    protected readonly cache: ContestTaskCache,
  ) {}

  abstract getContests(params?: TParams): Promise<ContestsForImport>;

  abstract getTasks(params?: TParams): Promise<TasksForImport>;

  /**
   * Retrieves contest data either from cache or from the Aizu Online Judge API.
   *
   * @protected
   */
  protected async getCachedOrFetchContests<T>({
    cacheKey,
    endpoint,
    errorMessage,
    validateResponse,
    transformer,
    label,
  }: {
    cacheKey: string;
    endpoint: string;
    errorMessage: string;
    validateResponse: (data: T) => boolean;
    transformer: (data: T) => ContestsForImport;
    label: string;
  }): Promise<ContestsForImport> {
    return this.cache.getCachedOrFetchContests(cacheKey, async () => {
      const apiResponse = await this.httpClient.fetchApiWithConfig<T>({
        endpoint,
        errorMessage,
        validateResponse,
      });

      const transformedContests = transformer(apiResponse);
      this.printLogForFetchedResults(label, transformedContests, 'contest');

      return transformedContests;
    });
  }

  /**
   * Retrieves tasks from cache or fetches them from the API if not cached.
   *
   * @protected
   */
  protected async getCachedOrFetchTasks<T>({
    cacheKey,
    endpoint,
    errorMessage,
    validateResponse,
    transformer,
    label,
  }: {
    cacheKey: string;
    endpoint: string;
    errorMessage: string;
    validateResponse: (data: T) => boolean;
    transformer: (data: T) => TasksForImport;
    label: string;
  }): Promise<TasksForImport> {
    return this.cache.getCachedOrFetchTasks(cacheKey, async () => {
      const apiResponse = await this.httpClient.fetchApiWithConfig<T>({
        endpoint,
        errorMessage,
        validateResponse,
      });

      const transformedTasks = transformer(apiResponse);
      this.printLogForFetchedResults(label, transformedTasks, 'task');

      return transformedTasks;
    });
  }

  private printLogForFetchedResults<R>(label: string, data: R, dataType: 'task' | 'contest'): void {
    const countText = Array.isArray(data) ? `${data.length} ${dataType}s` : typeof data;

    console.debug(`Found AOJ ${label}: ${countText}`);
  }
}

/**
 * Client for interacting with the Aizu Online Judge (AOJ) Courses API.
 *
 * @extends AojTasksApiClientBase
 */
export class AojCoursesApiClient extends AojTasksApiClientBase {
  async getContests(): Promise<ContestsForImport> {
    return this.getCachedOrFetchContests<AOJCourseAPI>({
      cacheKey: 'aoj_courses',
      endpoint: 'courses',
      errorMessage: 'Failed to fetch course contests from AOJ API',
      validateResponse: (data) =>
        'courses' in data && Array.isArray(data.courses) && data.courses.length > 0,
      transformer: (data) => this.transformCourseContests(data),
      label: 'course',
    });
  }

  async getTasks(): Promise<TasksForImport> {
    const size = 10 ** 4;

    return this.getCachedOrFetchTasks<AOJTaskAPIs>({
      cacheKey: 'aoj_courses',
      endpoint: `problems?size=${size}`,
      errorMessage: 'Failed to fetch course tasks from AOJ API',
      validateResponse: (data) => Array.isArray(data) && data.length > 0,
      transformer: (data) => this.transformCourseTasks(data),
      label: 'course',
    });
  }

  private transformCourseContests(data: AOJCourseAPI): ContestsForImport {
    return data.courses.map((course: Course) => {
      return mapToContest(course.shortName, course.name);
    });
  }

  private transformCourseTasks(data: AOJTaskAPIs): TasksForImport {
    return data
      .filter((task: AOJTaskAPI) => getCourseName(task.id) !== '')
      .map((task: AOJTaskAPI) => {
        return mapToTask(task, getCourseName(task.id));
      });
  }
}

/**
 * Client for interfacing with the Aizu Online Judge (AOJ) API to fetch challenge contests and tasks.
 *
 * @extends AojTasksApiClientBase<ChallengeParams>
 */
export class AojChallengesApiClient extends AojTasksApiClientBase<ChallengeParams> {
  async getContests(params: ChallengeParams): Promise<ContestsForImport> {
    const { contestType, round } = params;

    return this.getCachedOrFetchContests<AOJChallengeContestAPI>({
      cacheKey: this.getCacheKey(contestType, round),
      endpoint: buildEndpoint(['challenges', 'cl', contestType, round]),
      errorMessage: `Failed to fetch ${this.getContestTypeLabel(contestType)} ${round} contests from AOJ API`,
      validateResponse: (data) => this.validateApiResponse(data),
      transformer: (data) => this.transformToContests(data),
      label: `${this.getContestTypeLabel(contestType)} ${round}`,
    });
  }

  async getTasks(params: ChallengeParams): Promise<TasksForImport> {
    const { contestType, round } = params;

    return this.getCachedOrFetchTasks<AOJChallengeContestAPI>({
      cacheKey: this.getCacheKey(contestType, round),
      endpoint: buildEndpoint(['challenges', 'cl', contestType, round]),
      errorMessage: `Failed to fetch ${this.getContestTypeLabel(contestType)} ${round} tasks from AOJ API`,
      validateResponse: (data) => this.validateApiResponse(data),
      transformer: (data) => this.transformToTasks(data),
      label: `${this.getContestTypeLabel(contestType)} ${round}`,
    });
  }

  private getCacheKey(
    contestType: ChallengeContestType,
    round: ChallengeRoundMap[ChallengeContestType],
  ): string {
    return `aoj_${contestType.toLowerCase()}_${round.toLowerCase()}`;
  }

  private validateApiResponse(data: AOJChallengeContestAPI): boolean {
    return 'contests' in data && Array.isArray(data.contests) && data.contests.length > 0;
  }

  private transformToContests(data: AOJChallengeContestAPI): ContestsForImport {
    return data.contests.flatMap((contest: ChallengeContest) =>
      contest.days
        .map((day) => day.title)
        .map((title: string) => {
          return mapToContest(contest.abbr, title);
        }),
    );
  }

  private transformToTasks(data: AOJChallengeContestAPI): TasksForImport {
    return data.contests.flatMap((contest: ChallengeContest) =>
      contest.days.flatMap((day) =>
        day.problems.map((problem) => {
          return mapToTask(problem, contest.abbr);
        }),
      ),
    );
  }

  private getContestTypeLabel(contestType: ChallengeContestType): string {
    return contestType.toUpperCase();
  }
}
