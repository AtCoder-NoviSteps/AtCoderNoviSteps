import { ContestSiteApiClient } from '$lib/clients/http_client';
import { type TasksApiClient, HttpRequestClient } from '$lib/clients/http_client';
import { ContestTaskCache } from '$lib/clients/cache_strategy';
import { Cache, type ApiClientConfig } from '$lib/clients/cache';

import type { ContestForImport, ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

import { AOJ_API_BASE_URL } from '$lib/constants/urls';

/**
 * Represents the response structure from AOJ Course API
 * @typedef {Object} AOJCourseAPI
 */
type AOJCourseAPI = {
  filter: string;
  courses: Courses;
};

/**
 * Represents a course in the AOJ
 */
type Course = {
  readonly id: number;
  readonly serial: number;
  readonly shortName: string;
  readonly name: string;
  readonly type: string;
};

type Courses = Course[];

/**
 * Parameters for configuring a challenge contest in the AOJ.
 * @typedef {Object} ChallengeParams
 * @property {ChallengeContestType} contestType - The type of contest for the challenge.
 * @property {ChallengeRoundMap[ChallengeContestType]} round - The round of the contest, which depends on the contest type.
 */
type ChallengeParams = {
  contestType: ChallengeContestType;
  round: ChallengeRoundMap[ChallengeContestType];
};

/**
 * Represents the types of challenge contests available.
 */
type ChallengeContestType = 'PCK' | 'JAG';

/**
 * A map that associates each type of challenge contest with its corresponding round type.
 *
 * @typedef {Object} ChallengeRoundMap
 * @property {PckRound} PCK - The round type for PCK contests.
 * @property {JagRound} JAG - The round type for JAG contests.
 */
type ChallengeRoundMap = {
  PCK: PckRound;
  JAG: JagRound;
};

/**
 * Represents PCK contest rounds
 */
type PckRound = 'PRELIM' | 'FINAL';

/**
 * Represents JAG contest rounds
 */
type JagRound = 'PRELIM' | 'REGIONAL';

type AOJChallengeContestAPI = {
  readonly largeCl: Record<string, unknown>;
  readonly contests: ChallengeContests;
};

/**
 * Represents a challenge contest in the AOJ
 */
type ChallengeContest = {
  readonly abbr: string;
  readonly largeCl: string;
  readonly middleCl: string;
  readonly year: number;
  readonly progress: number;
  readonly numberOfProblems: number;
  readonly numberOfSolved: number;
  readonly days: { title: string; problems: AOJTaskAPI[] }[];
};

type ChallengeContests = ChallengeContest[];

/**
 * Represents a task in the AOJ API response
 * @property {string} id - Unique identifier for the task
 * @property {string} name - Task name
 */
type AOJTaskAPI = {
  readonly id: string;
  readonly available: number;
  readonly doctype: number;
  readonly name: string;
  readonly problemTimeLimit: number;
  readonly problemMemoryLimit: number;
  readonly maxScore: number;
  readonly solvedUser: number;
  readonly submissions: number;
  readonly recommendations: number;
  readonly isSolved: boolean;
  readonly bookmark: boolean;
  readonly recommend: boolean;
  readonly successRate: number;
  readonly score: number;
  readonly userScore: number;
};

type AOJTaskAPIs = AOJTaskAPI[];

/**
 * Constant used as a placeholder for missing timestamp data in AOJ contests
 * Value: -1
 */
const PENDING = -1;

/**
 * AojApiClient is a client for interacting with the Aizu Online Judge (AOJ) API.
 * It extends the ContestSiteApiClient and provides methods to fetch contests and tasks
 * from the AOJ platform.
 *
 * @class AojApiClient
 * @extends {ContestSiteApiClient}
 */
export class AojApiClient extends ContestSiteApiClient {
  private readonly coursesApiClient: AojCoursesApiClient;
  private readonly challengesApiClient: AojChallengesApiClient;

  /**
   * Array of API clients configured for Aizu Online Judge.
   *
   * @private
   * @readonly
   * @property {Object[]} apiClients - Collection of tasks API clients
   * @property {string} apiClients[].label - Identifier for the API client
   * @property {TasksApiClient<undefined | ChallengeParams>} apiClients[].client - API client instance
   * @property {ChallengeParams} [apiClients[].params] - Optional challenge parameters for the API client
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
   * @param {CacheConfig} [config.contestCache] - Configuration for the contest cache.
   * @param {CacheConfig} [config.taskCache] - Configuration for the task cache.
   */
  constructor(config?: ApiClientConfig) {
    super();

    // Setup caches with default values.
    const contestCache = new Cache<ContestsForImport>(
      config?.contestCache?.timeToLive,
      config?.contestCache?.maxSize,
    );
    const taskCache = new Cache<TasksForImport>(
      config?.taskCache?.timeToLive,
      config?.taskCache?.maxSize,
    );

    // Common dependencies.
    const caches = new ContestTaskCache(contestCache, taskCache);
    const httpClient = new HttpRequestClient(AOJ_API_BASE_URL);

    // Initialize API clients for different contests.
    this.coursesApiClient = new AojCoursesApiClient(httpClient, caches);
    this.challengesApiClient = new AojChallengesApiClient(httpClient, caches);

    // Set up the API clients with their labels and parameters.
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
   * This method concurrently fetches course contests, preliminary and final PCK contests,
   * and prelim and regional JAG contests, then combines them into a single array.
   *
   * @returns {Promise<ContestsForImport>} A promise that resolves to an array of contests.
   */
  async getContests(): Promise<ContestsForImport> {
    return (await this.fetchAllData<ContestsForImport>('getContests')).flat();
  }

  /**
   * Fetches tasks from various sources and combines them into a single list.
   *
   * This method concurrently fetches tasks from five different sources:
   * - Course tasks
   * - PCK Prelim tasks
   * - PCK Final tasks
   * - JAG Prelim tasks
   * - JAG Regional tasks
   *
   * The fetched tasks are then concatenated into a single array and returned.
   *
   * @returns {Promise<TasksForImport>} A promise that resolves to an array of tasks.
   *
   * @throws Will throw an error if the API request fails or the response validation fails.
   */
  async getTasks(): Promise<TasksForImport> {
    return (await this.fetchAllData<TasksForImport>('getTasks')).flat();
  }

  /**
   * Fetches data from all configured API clients using the specified method.
   *
   * @private
   * @template T The type of data to be returned from the API
   * @param {('getContests' | 'getTasks')} methodName - The API method to call on each client
   * @returns {Promise<T[]>} A promise that resolves to an array of results from all API clients
   *
   * @remarks
   * This method will attempt to fetch data from all configured API clients in parallel.
   * If any individual request fails, it will log the error and include an empty array in that position.
   * If the entire operation fails, it will log the error and return an empty array.
   */
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
 * Abstract base class for Aizu Online Judge (AOJ) API clients that retrieve contest and task data.
 *
 * This class provides common functionality for AOJ API clients, including URL endpoint construction
 * and data mapping utilities. Specific implementations must provide concrete implementations
 * for fetching contests and tasks.
 *
 * @template TParams - The type of parameters accepted by the API methods. Use `void` if no parameters are needed.
 *
 * @example
 * ```typescript
 * class AojTasksClient extends AojTasksApiClientBase<SearchParams> {
 *   async getContests(params?: SearchParams): Promise<ContestsForImport> {
 *     // Implementation
 *   }
 *
 *   async getTasks(params?: SearchParams): Promise<TasksForImport> {
 *     // Implementation
 *   }
 * }
 * ```
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
   * @template T - The type of the raw API response
   * @param {Object} options - The options for fetching contests
   * @param {string} options.cacheKey - The key used to store/retrieve data in the cache
   * @param {string} options.endpoint - The API endpoint to fetch data from
   * @param {string} options.errorMessage - The error message to use if the API request fails
   * @param {(data: T) => boolean} options.validateResponse - Function to validate the API response
   * @param {(data: T) => ContestsForImport} options.transformer - Function to transform API data to ContestsForImport format
   * @param {string} options.label - Label used for logging the fetch result
   * @returns {Promise<ContestsForImport>} A promise that resolves to the contests data
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
   * @template T - The type of data returned by the API
   * @param options - Object containing fetch and cache configuration
   * @param options.cacheKey - Unique key used to store and retrieve data from cache
   * @param options.endpoint - API endpoint to fetch tasks from
   * @param options.errorMessage - Message to display if the API request fails
   * @param options.validateResponse - Function to validate the API response data
   * @param options.transformer - Function to convert API response into TasksForImport format
   * @param options.label - Identifier used in logging statements
   * @returns Promise resolving to transformed tasks ready for import
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

  /**
   * Constructs an endpoint URL by encoding each segment and joining them with a '/'.
   *
   * @param segments - An array of strings representing the segments of the URL.
   * @returns The constructed endpoint URL as a string.
   */
  protected buildEndpoint(segments: string[]): string {
    if (!segments?.length) {
      throw new Error('Endpoint segments array cannot be empty');
    }

    // Allow alphanumeric characters, hyphens, and underscores
    const MAX_SEGMENT_LENGTH = 100;
    const validateSegment = (segment: string): boolean => {
      return (
        segment.length <= MAX_SEGMENT_LENGTH &&
        /^[a-zA-Z](?:[a-zA-Z0-9]|[-_](?=[a-zA-Z0-9])){0,98}[a-zA-Z0-9]$/.test(segment) &&
        !segment.includes('..')
      );
    };

    for (const segment of segments) {
      if (!validateSegment(segment)) {
        throw new Error(
          `Invalid segment: ${segment}. Segments must be alphanumeric with hyphens and underscores, max length ${MAX_SEGMENT_LENGTH}`,
        );
      }
    }

    return segments.map((segment) => encodeURIComponent(segment)).join('/');
  }

  /**
   * Maps the given contest details to a `ContestForImport` object.
   *
   * @param contestId - The unique identifier for the contest.
   * @param title - The title of the contest.
   * @returns A `ContestForImport` object with the provided contest details.
   *
   * @remarks
   * The `start_epoch_second` and `duration_second` fields are currently set to `PENDING`
   * as the data is not available. The `rate_change` field is also set to an empty string
   * for the same reason.
   */
  protected mapToContest(contestId: string, title: string): ContestForImport {
    return {
      id: contestId,
      start_epoch_second: PENDING, // Data not available
      duration_second: PENDING, // Same as above
      title: title,
      rate_change: '', // Same as above
    };
  }

  /**
   * Maps the AOJTaskAPI problem object to a task object.
   *
   * @param problem - The problem object from AOJTaskAPI.
   * @param contestId - The ID of the contest.
   * @returns An object representing the task with properties id, contest_id, problem_index, task_id, and title.
   */
  protected mapToTask(problem: AOJTaskAPI, contestId: string) {
    return {
      id: problem.id,
      contest_id: contestId,
      problem_index: problem.id, // Using task.id as a substitute since there's no equivalent to problem_index. Similar approach is used in AtCoder Problems API for old JOI problems.
      task_id: problem.id, // Same as above
      title: problem.name,
    };
  }
}

/**
 * Client for interacting with the Aizu Online Judge (AOJ) Courses API.
 *
 * This class extends the AojTasksApiClientBase and provides methods to fetch contests and tasks
 * specifically from the AOJ Courses section. It handles the conversion of AOJ API responses
 * to the internal data structure used by the application, and uses caching to optimize API calls.
 *
 * The class offers methods to:
 * - Fetch and cache course contests
 * - Fetch and cache course tasks
 * - Extract course names from task IDs
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
      return this.mapToContest(course.shortName, course.name);
    });
  }

  private transformCourseTasks(data: AOJTaskAPIs): TasksForImport {
    return data
      .filter((task: AOJTaskAPI) => this.getCourseName(task.id) !== '')
      .map((task: AOJTaskAPI) => {
        return this.mapToTask(task, this.getCourseName(task.id));
      });
  }

  /**
   * Extracts the course name from a given task ID.
   *
   * The task ID is expected to be in the format of `courseName_taskId_otherInfo` in courses (ex: ITP1_1_A, ..., INFO1_01_E, ...) and `taskNumber` in challenges (ex: 0001, ..., 0703, ..., 3000).
   * If the task ID does not follow this format, an empty string is returned.
   *
   * @param taskId - The task ID string from which to extract the course name.
   * @returns The extracted course name or an empty string if the format is incorrect.
   */
  private getCourseName = (taskId: string) => {
    if (!taskId || typeof taskId !== 'string') {
      return '';
    }

    const splittedTaskId = taskId.split('_');

    return splittedTaskId.length == 3 ? splittedTaskId[0] : '';
  };
}

/**
 * Client for interfacing with the Aizu Online Judge (AOJ) API to fetch challenge contests and tasks.
 *
 * This class extends the base AOJ client specifically for handling challenge-type competitions.
 * It provides methods to retrieve both contests and associated tasks with built-in caching
 * to minimize redundant API calls.
 *
 * @extends AojTasksApiClientBase<ChallengeParams>
 * @example
 * const client = new AojChallengesApiClient();
 * const contests = await client.getContests({ contestType: "PCK", round: "PRELIM" });
 * const tasks = await client.getTasks({ contestType: "PCK", round: "PRELIM" });
 */
export class AojChallengesApiClient extends AojTasksApiClientBase<ChallengeParams> {
  async getContests(params: ChallengeParams): Promise<ContestsForImport> {
    const { contestType, round } = params;

    return this.getCachedOrFetchContests<AOJChallengeContestAPI>({
      cacheKey: this.getCacheKey(contestType, round),
      endpoint: this.buildEndpoint(['challenges', 'cl', contestType, round]),
      errorMessage: `Failed to fetch ${this.getContestTypeLabel(contestType)} ${round} contests from AOJ API`,
      validateResponse: (data) =>
        'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
      transformer: (data) => this.transformToContests(data),
      label: `${this.getContestTypeLabel(contestType)} ${round}`,
    });
  }

  async getTasks(params: ChallengeParams): Promise<TasksForImport> {
    const { contestType, round } = params;

    return this.getCachedOrFetchTasks<AOJChallengeContestAPI>({
      cacheKey: this.getCacheKey(contestType, round),
      endpoint: this.buildEndpoint(['challenges', 'cl', contestType, round]),
      errorMessage: `Failed to fetch ${this.getContestTypeLabel(contestType)} ${round} tasks from AOJ API`,
      validateResponse: (data) =>
        'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
      transformer: (data) => this.transformToTasks(data),
      label: `${this.getContestTypeLabel(contestType)} ${round}`,
    });
  }

  /**
   * Generates a unique cache key for Aizu Online Judge contest data.
   *
   * @param contestType - The type of the contest
   * @param round - The round of the contest, specific to the contest type
   * @returns A string in the format "aoj_[contestType]_[round]" with lowercase values
   * @private
   */
  private getCacheKey(
    contestType: ChallengeContestType,
    round: ChallengeRoundMap[ChallengeContestType],
  ): string {
    return `aoj_${contestType.toLowerCase()}_${round.toLowerCase()}`;
  }

  private transformToContests(data: AOJChallengeContestAPI): ContestsForImport {
    return data.contests.flatMap((contest: ChallengeContest) =>
      contest.days
        .map((day) => day.title)
        .map((title: string) => {
          return this.mapToContest(contest.abbr, title);
        }),
    );
  }

  private transformToTasks(data: AOJChallengeContestAPI): TasksForImport {
    return data.contests.flatMap((contest: ChallengeContest) =>
      contest.days.flatMap((day) =>
        day.problems.map((problem) => {
          return this.mapToTask(problem, contest.abbr);
        }),
      ),
    );
  }

  /**
   * Converts the contest type to an uppercase string representation.
   *
   * @param contestType - The type of contest to convert
   * @returns The uppercase string representation of the contest type
   * @private
   */
  private getContestTypeLabel(contestType: ChallengeContestType): string {
    return contestType.toUpperCase();
  }
}
