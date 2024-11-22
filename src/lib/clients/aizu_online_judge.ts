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
 * Enum representing the types of challenge contests available.
 */
enum ChallengeContestType {
  PCK = 'pck',
  JAG = 'jag',
}

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
 * Enum representing PCK contest rounds
 */
enum PckRound {
  PRELIM = 'prelim',
  FINAL = 'final',
}

/**
 * Enum representing JAG contest rounds
 */
enum JagRound {
  PRELIM = 'prelim',
  REGIONAL = 'regional',
}

/**
 * A map that associates each type of challenge contest with its corresponding round type.
 *
 * @typedef {Object} ChallengeRoundMap
 * @property {PckRound} ChallengeContestType.PCK - The round type for PCK contests.
 * @property {JagRound} ChallengeContestType.JAG - The round type for JAG contests.
 */
type ChallengeRoundMap = {
  [ChallengeContestType.PCK]: PckRound;
  [ChallengeContestType.JAG]: JagRound;
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
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

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
 * Retrieves a cache entry from the provided cache map.
 *
 * @template T - The type of the data stored in the cache entry.
 * @param {Map<string, CacheEntry<T>>} cache - The cache map containing the entries.
 * @param {string} key - The key of the cache entry to retrieve.
 * @returns {T | undefined} - The data of the cache entry if it exists and is valid, otherwise undefined.
 */
function getCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = cache.get(key);

  if (!entry) {
    return undefined;
  }

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return undefined;
  }

  return entry.data;
}

/**
 * Sets a cache entry with the specified key and data.
 *
 * @template T - The type of the data to be cached.
 * @param {Map<string, CacheEntry<T>>} cache - The cache map where the entry will be stored.
 * @param {string} key - The key under which the data will be stored.
 * @param {T} data - The data to be cached.
 */
function setCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
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
   * A cache to store contests for import, keyed by contest ID.
   * This cache is used to avoid redundant API calls to the Aizu Online Judge.
   *
   * @type {Map<string, CacheEntry<ContestsForImport>>}
   */
  private readonly contestCache: Map<string, CacheEntry<ContestsForImport>> = new Map();

  /**
   * A cache to store tasks for import, keyed by a string identifier.
   *
   * This cache is implemented as a Map where the key is a string and the value is of type `TasksForImport`.
   * It is used to temporarily hold tasks to avoid redundant imports and improve performance.
   *
   * @type {Map<string, CacheEntry<TasksForImport>>}
   */
  private readonly taskCache: Map<string, CacheEntry<TasksForImport>> = new Map();

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
      const [courses, pckPrelims, pckFinals, jagPrelims, jagRegionals] = await Promise.all([
        this.fetchCourseContests(),
        this.fetchChallengeContests(ChallengeContestType.PCK, PckRound.PRELIM),
        this.fetchChallengeContests(ChallengeContestType.PCK, PckRound.FINAL),
        this.fetchChallengeContests(ChallengeContestType.JAG, JagRound.PRELIM),
        this.fetchChallengeContests(ChallengeContestType.JAG, JagRound.REGIONAL),
      ]);

      const contests = courses.concat(pckPrelims, pckFinals, jagPrelims, jagRegionals);
      console.log(
        `Found AOJ contests - Total: ${contests.length} ` +
          `(Courses: ${courses.length}, PCK: ${pckPrelims.length + pckFinals.length}, ` +
          `JAG: ${jagPrelims.length + jagRegionals.length})`,
      );

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
    const cacheKey = `${contestType}_${round}`;
    const cachedContests = getCacheEntry(this.contestCache, cacheKey);

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

      setCacheEntry(this.contestCache, cacheKey, contests);

      return contests;
    } catch (error) {
      console.error(`Failed to fetch from AOJ ${contestTypeLabel} ${round} contests:`, error);
      return [];
    }
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
      const [courses, pckPrelims, pckFinals, jagPrelims, jagRegionals] = await Promise.all([
        this.fetchCourseTasks(),
        this.fetchChallengeTasks(ChallengeContestType.PCK, PckRound.PRELIM),
        this.fetchChallengeTasks(ChallengeContestType.PCK, PckRound.FINAL),
        this.fetchChallengeTasks(ChallengeContestType.JAG, JagRound.PRELIM),
        this.fetchChallengeTasks(ChallengeContestType.JAG, JagRound.REGIONAL),
      ]);
      const tasks = courses.concat(pckPrelims, pckFinals, jagPrelims, jagRegionals);
      console.log(
        `Found AOJ tasks - Total: ${tasks.length} ` +
          `(Courses: ${courses.length}, PCK: ${pckPrelims.length + pckFinals.length}, ` +
          `JAG: ${jagPrelims.length + jagRegionals.length})`,
      );

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
    const cacheKey = `${contestType}_${round}`;
    const cachedTasks = getCacheEntry(this.taskCache, cacheKey);

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

      setCacheEntry(this.taskCache, cacheKey, tasks);

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
