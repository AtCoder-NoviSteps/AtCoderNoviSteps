import { ContestSiteApiClient } from '$lib/clients/common';
import { AOJ_API_BASE_URL } from '$lib/constants/urls';
import type { ContestForImport, ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

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

type AOJChallengeContestAPI = {
  readonly largeCl: Record<string, unknown>;
  readonly contests: ChallengeContests;
};

/**
 * Represents the types of challenge contests available.
 */
type ChallengeContestType = 'PCK' | 'JAG';

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
 * Represents PCK contest rounds
 */
type PckRound = 'PRELIM' | 'FINAL';

/**
 * Represents JAG contest rounds
 */
type JagRound = 'PRELIM' | 'REGIONAL';

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
 * Constant used as a placeholder for missing timestamp data in AOJ contests
 * Value: -1
 */
const PENDING = -1;

/**
 * The time-to-live (TTL) for the cache, specified in milliseconds.
 * This value represents 1 hour.
 */
const DEFAULT_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_MAX_CACHE_SIZE = 50;

/**
 * Configuration options for caching.
 *
 * @property {number} [timeToLive] - The duration (in milliseconds) for which a cache entry should remain valid.
 * @property {number} [maxSize] - The maximum number of entries that the cache can hold.
 */
interface CacheConfig {
  timeToLive?: number;
  maxSize?: number;
}

/**
 * Represents a cache entry with data and a timestamp.
 *
 * @template T - The type of the cached data.
 * @property {T} data - The cached data.
 * @property {number} timestamp - The timestamp when the data was cached.
 */
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

/**
 * A generic cache class that stores data with a timestamp and provides methods to set, get, and delete cache entries.
 * The cache automatically removes the oldest entry when the maximum cache size is reached.
 * Entries are also automatically invalidated and removed if they exceed a specified time-to-live (TTL).
 *
 * @template T - The type of data to be stored in the cache.
 */
class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  /**
   * Constructs an instance of the class with the specified cache time-to-live (TTL) and maximum cache size.
   *
   * @param timeToLive - The time-to-live for the cache entries, in milliseconds. Defaults to `CACHE_TTL`.
   * @param maxSize - The maximum number of entries the cache can hold. Defaults to `MAX_CACHE_SIZE`.
   */
  constructor(
    private readonly timeToLive: number = DEFAULT_CACHE_TTL,
    private readonly maxSize: number = DEFAULT_MAX_CACHE_SIZE,
  ) {
    if (timeToLive <= 0) {
      throw new Error('TTL must be positive');
    }
    if (maxSize <= 0) {
      throw new Error('Max size must be positive');
    }

    this.cleanupInterval = setInterval(() => this.cleanup(), timeToLive);
  }

  /**
   * Gets the size of the cache.
   *
   * @returns {number} The number of items in the cache.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Retrieves the health status of the cache.
   *
   * @returns An object containing the size of the cache and the timestamp of the oldest entry.
   * @property {number} size - The number of entries in the cache.
   * @property {number} oldestEntry - The timestamp of the oldest entry in the cache.
   */
  get health(): { size: number; oldestEntry: number } {
    const oldestEntry = Math.min(
      ...Array.from(this.cache.values()).map((entry) => entry.timestamp),
    );
    return { size: this.cache.size, oldestEntry };
  }

  /**
   * Sets a new entry in the cache with the specified key and data.
   * If the cache size exceeds the maximum limit, the oldest entry is removed.
   *
   * @param key - The key associated with the data to be cached.
   * @param data - The data to be cached.
   */
  set(key: string, data: T): void {
    if (!key || typeof key !== 'string' || key.length > 255) {
      throw new Error('Invalid cache key');
    }

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldestEntry();

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Retrieves an entry from the cache.
   *
   * @param key - The key associated with the cache entry.
   * @returns The cached data if it exists and is not expired, otherwise `undefined`.
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > this.timeToLive) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Disposes of resources used by the Aizu Online Judge client.
   *
   * This method clears the interval used for cleanup and clears the cache.
   * It should be called when the client is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Deletes an entry from the cache.
   *
   * @param key - The key of the entry to delete.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.timeToLive) {
        this.cache.delete(key);
      }
    }
  }

  private findOldestEntry(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }
}

interface ApiClientConfig {
  contestCache: CacheConfig;
  taskCache: CacheConfig;
}

/**
 * AojApiClient is a client for interacting with the Aizu Online Judge (AOJ) API.
 * It extends the ContestSiteApiClient and provides methods to fetch contests and tasks
 * from the AOJ platform.
 *
 * @class AojApiClient
 * @extends {ContestSiteApiClient}
 */
export class AojApiClient extends ContestSiteApiClient {
  /**
   * A cache for storing contests to be imported.
   * This cache is used to temporarily hold contest data to improve performance
   * and reduce the number of requests to the Aizu Online Judge API.
   *
   * @private
   * @readonly
   * @type {Cache<ContestsForImport>}
   */
  private readonly contestCache = new Cache<ContestsForImport>();

  /**
   * A cache for storing tasks to be imported.
   * This cache helps in reducing the number of requests to the external source
   * by storing previously fetched tasks.
   *
   * @private
   * @readonly
   * @type {Cache<TasksForImport>}
   */
  private readonly taskCache = new Cache<TasksForImport>();

  /**
   * Constructs an instance of the Aizu Online Judge client.
   *
   * @param {ApiClientConfig} [config] - Optional configuration object for the API client.
   * @param {Cache<ContestsForImport>} [config.contestCache] - Configuration for the contest cache.
   * @param {number} [config.contestCache.timeToLive] - Time to live for contest cache entries.
   * @param {number} [config.contestCache.maxSize] - Maximum size of the contest cache.
   * @param {Cache<TasksForImport>} [config.taskCache] - Configuration for the task cache.
   * @param {number} [config.taskCache.timeToLive] - Time to live for task cache entries.
   * @param {number} [config.taskCache.maxSize] - Maximum size of the task cache.
   */
  constructor(config?: ApiClientConfig) {
    super();

    this.contestCache = new Cache<ContestsForImport>(
      config?.contestCache?.timeToLive,
      config?.contestCache?.maxSize,
    );
    this.taskCache = new Cache<TasksForImport>(
      config?.taskCache?.timeToLive,
      config?.taskCache?.maxSize,
    );
  }

  /**
   * Disposes of the resources used by the client.
   * Clears the contest and task caches to free up memory.
   */
  dispose(): void {
    this.contestCache.dispose();
    this.taskCache.dispose();
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
        this.fetchCourseContests(),
        this.fetchChallengeContests('PCK', 'PRELIM'),
        this.fetchChallengeContests('PCK', 'FINAL'),
        this.fetchChallengeContests('JAG', 'PRELIM'),
        this.fetchChallengeContests('JAG', 'REGIONAL'),
      ]);

      const [courses, pckPrelims, pckFinals, jagPrelims, jagRegionals] = results.map((result) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch contests from AOJ API:`, result.reason);
          return [];
        }

        return result.value;
      });
      const contests = courses.concat(pckPrelims, pckFinals, jagPrelims, jagRegionals);

      this.logEntityCount('contests', {
        courses: courses.length,
        pck: pckPrelims.length + pckFinals.length,
        jag: jagPrelims.length + jagRegionals.length,
      });

      return contests;
    } catch (error) {
      console.error(`Failed to fetch contests from AOJ API:`, error);
      return [];
    }
  }

  /**
   * Fetches course contests from the AOJ (Aizu Online Judge) API.
   *
   * @returns {Promise<ContestsForImport>} A promise that resolves to an array of contests for import.
   *
   * @throws Will throw an error if the API request fails or the response is invalid.
   *
   * @example
   * const contests = await fetchCourseContests();
   * console.log(contests);
   */
  private async fetchCourseContests(): Promise<ContestsForImport> {
    try {
      const results = await this.fetchApiWithConfig<AOJCourseAPI>({
        baseApiUrl: AOJ_API_BASE_URL,
        endpoint: 'courses',
        errorMessage: 'Failed to fetch course contests from AOJ API',
        validateResponse: (data) =>
          'courses' in data && Array.isArray(data.courses) && data.courses.length > 0,
      });

      const coursesForContest = results.courses.map((course: Course) => {
        const courseForContest: ContestForImport = this.mapToContest(course.shortName, course.name);

        return courseForContest;
      });

      console.log(`Found AOJ course: ${coursesForContest.length} contests.`);

      return coursesForContest;
    } catch (error) {
      console.error(`Failed to fetch from AOJ course contests:`, error);
      return [];
    }
  }

  /**
   * Fetches challenge contests from the AOJ API for a given round.
   *
   * @param {ChallengeContestType} contestType - The type of challenge contest for which to fetch contests.
   * @param {PckRound | JagRound} round - The round identifier for which to fetch contests.
   * @returns {Promise<ContestsForImport>} A promise that resolves to an array of contests for import.
   *
   * @throws Will throw an error if the API request fails or the response validation fails.
   *
   * @example
   * const contestType = ChallengeContestType.PCK;
   * const round = 'PRELIM';
   * const contests = await fetchChallengeContests(contestType, round);
   * console.log(contests);
   */
  private async fetchChallengeContests<T extends ChallengeContestType>(
    contestType: T,
    round: ChallengeRoundMap[T],
  ): Promise<ContestsForImport> {
    const cacheKey = `${contestType.toLowerCase()}_${round.toLowerCase()}`;
    const cachedContests = this.contestCache.get(cacheKey);

    if (cachedContests) {
      console.log('Using cached contests for', cacheKey);
      return cachedContests;
    }

    const contestTypeLabel = contestType.toUpperCase();

    try {
      const results = await this.fetchApiWithConfig<AOJChallengeContestAPI>({
        baseApiUrl: AOJ_API_BASE_URL,
        endpoint: this.buildEndpoint(['challenges', 'cl', contestType, round]),
        errorMessage: `Failed to fetch ${contestTypeLabel} ${round} contests from AOJ API`,
        validateResponse: (data) =>
          'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
      });

      const contests = results.contests.reduce(
        (importContests: ContestsForImport, contest: ChallengeContest) => {
          const titles = contest.days.map((day) => day.title);
          titles.forEach((title: string) => {
            importContests.push(this.mapToContest(contest.abbr, title));
          });

          return importContests;
        },
        [] as ContestsForImport,
      );

      console.log(`Found AOJ ${contestTypeLabel} ${round}: ${contests.length} contests.`);

      this.contestCache.set(cacheKey, contests);

      return contests;
    } catch (error) {
      console.error(`Failed to fetch from AOJ ${contestTypeLabel} ${round} contests:`, error);
      return [];
    }
  }

  /**
   * Logs the count of AOJ entities (contests or tasks) to the console.
   *
   * @param entity - The type of entity being logged, either 'contests' or 'tasks'.
   * @param counts - An object containing the counts of different categories.
   * @param counts.courses - The count of courses.
   * @param counts.pck - The count of PCK.
   * @param counts.jag - The count of JAG.
   */
  private logEntityCount(
    entity: 'contests' | 'tasks',
    counts: { courses: number; pck: number; jag: number },
  ): void {
    console.info(
      `Found AOJ ${entity} - Total: ${counts.courses + counts.pck + counts.jag} ` +
        `(Courses: ${counts.courses}, PCK: ${counts.pck}, JAG: ${counts.jag})`,
    );
  }

  /**
   * Constructs an endpoint URL by encoding each segment and joining them with a '/'.
   *
   * @param segments - An array of strings representing the segments of the URL.
   * @returns The constructed endpoint URL as a string.
   */
  private buildEndpoint(segments: string[]): string {
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
  private mapToContest(contestId: string, title: string): ContestForImport {
    return {
      id: contestId,
      start_epoch_second: PENDING, // Data not available
      duration_second: PENDING, // Same as above
      title: title,
      rate_change: '', // Same as above
    };
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
        this.fetchCourseTasks(),
        this.fetchChallengeTasks('PCK', 'PRELIM'),
        this.fetchChallengeTasks('PCK', 'FINAL'),
        this.fetchChallengeTasks('JAG', 'PRELIM'),
        this.fetchChallengeTasks('JAG', 'REGIONAL'),
      ]);

      const [courses, pckPrelims, pckFinals, jagPrelims, jagRegionals] = results.map((result) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch tasks from AOJ API:`, result.reason);
          return [];
        }

        return result.value;
      });
      const tasks = courses.concat(pckPrelims, pckFinals, jagPrelims, jagRegionals);

      this.logEntityCount('tasks', {
        courses: courses.length,
        pck: pckPrelims.length + pckFinals.length,
        jag: jagPrelims.length + jagRegionals.length,
      });

      return tasks;
    } catch (error) {
      console.error(`Failed to fetch tasks from AOJ API:`, error);
      return [];
    }
  }

  /**
   * Fetches course tasks from the AOJ (Aizu Online Judge) API.
   *
   * This method retrieves a list of tasks from the AOJ API, filters them based on the course name,
   * and maps them to a format suitable for import. The course name is determined by the task ID.
   *
   * @returns {Promise<TasksForImport>} A promise that resolves to an array of tasks formatted for import.
   *
   * @throws Will throw an error if the API request fails or if the response validation fails.
   */
  private async fetchCourseTasks(): Promise<TasksForImport> {
    try {
      const size = 10 ** 4;
      const allTasks = await this.fetchApiWithConfig<AOJTaskAPIs>({
        baseApiUrl: AOJ_API_BASE_URL,
        endpoint: `problems?size=${size}`,
        errorMessage: 'Failed to fetch course tasks from AOJ API',
        validateResponse: (data) => Array.isArray(data) && data.length > 0,
      });

      const courseTasks: TasksForImport = allTasks
        .filter((task: AOJTaskAPI) => this.getCourseName(task.id) !== '')
        .map((task: AOJTaskAPI) => {
          return this.mapToTask(task, this.getCourseName(task.id));
        });

      console.log(`Found AOJ course: ${courseTasks.length} tasks.`);

      return courseTasks;
    } catch (error) {
      console.error(`Failed to fetch from AOJ course tasks:`, error);
      return [];
    }
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

  /**
   * Fetches tasks for a specified challenge contest round from the AOJ API.
   *
   * @param {ChallengeContestType} contestType - The type of challenge contest for which to fetch tasks.
   * @param {PckRound | JagRound} round - The round identifier for which to fetch tasks.
   * @returns {Promise<TasksForImport>} A promise that resolves to an object containing tasks for import.
   * @throws Will throw an error if the API request fails or the response is invalid.
   *
   * The function performs the following steps:
   * 1. Fetches contest data from the AOJ API for the specified PCK round.
   * 2. Validates the response to ensure it contains contest data.
   * 3. Maps the contest data to a list of tasks, extracting relevant information such as task ID, contest ID, and title.
   * 4. Logs the number of tasks found for the specified round.
   */
  private async fetchChallengeTasks<T extends ChallengeContestType>(
    contestType: T,
    round: ChallengeRoundMap[T],
  ): Promise<TasksForImport> {
    const cacheKey = `${contestType.toLowerCase()}_${round.toLowerCase()}`;
    const cachedTasks = this.taskCache.get(cacheKey);

    if (cachedTasks) {
      console.log('Using cached tasks for', cacheKey);
      return cachedTasks;
    }

    const contestTypeLabel = contestType.toUpperCase();

    try {
      const allPckContests = await this.fetchApiWithConfig<AOJChallengeContestAPI>({
        baseApiUrl: AOJ_API_BASE_URL,
        endpoint: this.buildEndpoint(['challenges', 'cl', contestType, round]),
        errorMessage: `Failed to fetch ${contestTypeLabel} ${round} tasks from AOJ API`,
        validateResponse: (data) =>
          'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
      });

      const tasks: TasksForImport = allPckContests.contests.reduce(
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
      console.log(`Found ${contestTypeLabel} ${round}: ${tasks.length} tasks.`);

      this.taskCache.set(cacheKey, tasks);

      return tasks;
    } catch (error) {
      console.error(`Failed to fetch from ${contestTypeLabel} ${round} tasks:`, error);
      return [];
    }
  }

  /**
   * Maps the AOJTaskAPI problem object to a task object.
   *
   * @param problem - The problem object from AOJTaskAPI.
   * @param contestId - The ID of the contest.
   * @returns An object representing the task with properties id, contest_id, problem_index, task_id, and title.
   */
  private mapToTask(problem: AOJTaskAPI, contestId: string) {
    return {
      id: problem.id,
      contest_id: contestId,
      problem_index: problem.id, // Using task.id as a substitute since there's no equivalent to problem_index. Similar approach is used in AtCoder Problems API for old JOI problems.
      task_id: problem.id, // Same as above
      title: problem.name,
    };
  }
}
