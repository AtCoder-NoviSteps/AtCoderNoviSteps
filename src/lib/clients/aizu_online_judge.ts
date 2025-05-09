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
    try {
      const results = await Promise.allSettled([
        this.coursesApiClient.getContests(),
        this.challengesApiClient.getContests({ contestType: 'PCK', round: 'PRELIM' }),
        this.challengesApiClient.getContests({ contestType: 'PCK', round: 'FINAL' }),
        this.challengesApiClient.getContests({ contestType: 'JAG', round: 'PRELIM' }),
        this.challengesApiClient.getContests({ contestType: 'JAG', round: 'REGIONAL' }),
      ]);

      const [courses, pckPrelims, pckFinals, jagPrelims, jagRegionals] = results.map((result) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch contests from AOJ API:`, result.reason);
          return [];
        }

        return result.value;
      });
      const contests = courses.concat(pckPrelims, pckFinals, jagPrelims, jagRegionals);

      return contests;
    } catch (error) {
      console.error(`Failed to fetch contests from AOJ API:`, error);
      return [];
    }
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
    try {
      const results = await Promise.allSettled([
        this.coursesApiClient.getTasks(),
        this.challengesApiClient.getTasks({ contestType: 'PCK', round: 'PRELIM' }),
        this.challengesApiClient.getTasks({ contestType: 'PCK', round: 'FINAL' }),
        this.challengesApiClient.getTasks({ contestType: 'JAG', round: 'PRELIM' }),
        this.challengesApiClient.getTasks({ contestType: 'JAG', round: 'REGIONAL' }),
      ]);

      const [courses, pckPrelims, pckFinals, jagPrelims, jagRegionals] = results.map((result) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch tasks from AOJ API:`, result.reason);
          return [];
        }

        return result.value;
      });
      const tasks = courses.concat(pckPrelims, pckFinals, jagPrelims, jagRegionals);

      return tasks;
    } catch (error) {
      console.error(`Failed to fetch tasks from AOJ API:`, error);
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
    const contests = await this.cache.getCachedOrFetchContests('aoj_courses', async () => {
      const results = await this.httpClient.fetchApiWithConfig<AOJCourseAPI>({
        endpoint: 'courses',
        errorMessage: 'Failed to fetch course contests from AOJ API',
        validateResponse: (data) =>
          'courses' in data && Array.isArray(data.courses) && data.courses.length > 0,
      });

      const coursesForContest = results.courses.map((course: Course) => {
        const courseForContest: ContestForImport = this.mapToContest(course.shortName, course.name);

        return courseForContest;
      });
      console.debug(`Found AOJ course: ${coursesForContest.length} contests.`);

      return coursesForContest;
    });

    return contests;
  }

  async getTasks(): Promise<TasksForImport> {
    const tasks = await this.cache.getCachedOrFetchTasks('aoj_courses', async () => {
      const size = 10 ** 4;
      const allTasks = await this.httpClient.fetchApiWithConfig<AOJTaskAPIs>({
        endpoint: `problems?size=${size}`,
        errorMessage: 'Failed to fetch course tasks from AOJ API',
        validateResponse: (data) => Array.isArray(data) && data.length > 0,
      });

      const courseTasks: TasksForImport = allTasks
        .filter((task: AOJTaskAPI) => this.getCourseName(task.id) !== '')
        .map((task: AOJTaskAPI) => {
          return this.mapToTask(task, this.getCourseName(task.id));
        });
      console.debug(`Found AOJ course: ${courseTasks.length} tasks.`);

      return courseTasks;
    });

    return tasks;
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
    const cacheKey = this.getCacheKey(contestType, round);

    const contests = await this.cache.getCachedOrFetchContests(cacheKey, async () => {
      const contestTypeLabel = this.getContestTypeLabel(contestType);

      const results = await this.httpClient.fetchApiWithConfig<AOJChallengeContestAPI>({
        endpoint: this.buildEndpoint(['challenges', 'cl', contestType, round]),
        errorMessage: `Failed to fetch ${contestTypeLabel} ${round} contests from AOJ API`,
        validateResponse: (data) =>
          'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
      });

      const contestsForChallenges = results.contests.reduce(
        (importContests: ContestsForImport, contest: ChallengeContest) => {
          const titles = contest.days.map((day) => day.title);
          titles.forEach((title: string) => {
            importContests.push(this.mapToContest(contest.abbr, title));
          });

          return importContests;
        },
        [] as ContestsForImport,
      );
      console.debug(
        `Found AOJ ${contestTypeLabel} ${round}: ${contestsForChallenges.length} contests.`,
      );

      return contestsForChallenges;
    });

    return contests;
  }

  async getTasks(params: ChallengeParams): Promise<TasksForImport> {
    const { contestType, round } = params;
    const cacheKey = this.getCacheKey(contestType, round);

    const tasks = await this.cache.getCachedOrFetchTasks(cacheKey, async () => {
      const contestTypeLabel = this.getContestTypeLabel(contestType);

      const allChallengeContests = await this.httpClient.fetchApiWithConfig<AOJChallengeContestAPI>(
        {
          endpoint: this.buildEndpoint(['challenges', 'cl', contestType, round]),
          errorMessage: `Failed to fetch ${contestTypeLabel} ${round} tasks from AOJ API`,
          validateResponse: (data) =>
            'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
        },
      );

      const tasksForChallenges: TasksForImport = allChallengeContests.contests.reduce(
        (tasksForImport: TasksForImport, contest) => {
          contest.days.forEach((day) => {
            const contestTasks = day.problems.map((problem) =>
              this.mapToTask(problem, contest.abbr),
            );

            tasksForImport.push(...contestTasks);
          });

          return tasksForImport;
        },
        [],
      );
      console.debug(`Found ${contestTypeLabel} ${round}: ${tasksForChallenges.length} tasks.`);

      return tasksForChallenges;
    });

    return tasks;
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
