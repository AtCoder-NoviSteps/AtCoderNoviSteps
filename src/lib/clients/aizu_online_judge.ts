import { ContestSiteApiClient } from '$lib/clients/common';
import { AOJ_API_BASE_URL } from '$lib/constants/urls';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

type AOJCourseAPI = {
  filter: string;
  courses: Courses;
};

type Course = {
  id: number;
  serial: number;
  shortName: string;
  name: string;
  type: string;
  userScore: number;
  maxScore: number;
  progress: number;
  image: string;
  numberOfTopics: number;
  topics: string;
  description: string;
};

type Courses = Course[];

type AOJChallengeContestAPI = {
  largeCl: object;
  contests: ChallengeContests;
};

type ChallengeContest = {
  abbr: string;
  largeCl: string;
  middleCl: string;
  year: number;
  progress: number;
  numberOfProblems: number;
  numberOfSolved: number;
  days: { title: string; problems: AOJTaskAPI[] }[];
};

type ChallengeContests = ChallengeContest[];

type AOJTaskAPI = {
  id: string;
  available: number;
  doctype: number;
  name: string;
  problemTimeLimit: number;
  problemMemoryLimit: number;
  maxScore: number;
  solvedUser: number;
  submissions: number;
  recommendations: number;
  isSolved: boolean;
  bookmark: boolean;
  recommend: boolean;
  successRate: number;
  score: number;
  userScore: number;
};

type AOJTaskAPIs = AOJTaskAPI[];

const PRELIM = 'prelim';
const FINAL = 'final';
type PckRound = typeof PRELIM | typeof FINAL;

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
  /**
   * Fetches and combines contests from different sources.
   *
   * This method concurrently fetches course contests, preliminary PCK contests,
   * and final PCK contests, then combines them into a single array.
   *
   * @returns {Promise<ContestsForImport>} A promise that resolves to an array of contests.
   */
  async getContests(): Promise<ContestsForImport> {
    const [courses, pckPrelims, pckFinals] = await Promise.all([
      this.fetchCourseContests(),
      this.fetchPckContests(PRELIM),
      this.fetchPckContests(FINAL),
    ]);

    const contests = courses.concat(pckPrelims, pckFinals);
    console.log(`Found AOJ: ${contests.length} contests.`);

    return contests;
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
        const courseForContest = {
          id: course.shortName,
          start_epoch_second: PENDING, // Data not available
          duration_second: PENDING, // Same as above
          title: course.name,
          rate_change: '', // Same as above
        };

        return courseForContest;
      });

      console.log(`Found AOJ course: ${coursesForContest.length} contests.`);

      return coursesForContest;
    } catch (error) {
      console.error(`Failed to fetch from AOJ course contests`, error);
      return [];
    }
  }

  /**
   * Fetches PCK contests from the AOJ API for a given round.
   *
   * @param {PckRound} round - The round identifier for which to fetch contests.
   * @returns {Promise<ContestsForImport>} A promise that resolves to an array of contests for import.
   *
   * @throws Will throw an error if the API request fails or the response validation fails.
   *
   * @example
   * const round = 'PRELIM';
   * const contests = await fetchPckContests(round);
   * console.log(contests);
   */
  private async fetchPckContests(round: PckRound): Promise<ContestsForImport> {
    try {
      const results = await this.fetchApiWithConfig<AOJChallengeContestAPI>({
        baseApiUrl: AOJ_API_BASE_URL,
        endpoint: `challenges/cl/pck/${round}`,
        errorMessage: `Failed to fetch ${round} contests from AOJ API`,
        validateResponse: (data) =>
          'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
      });

      const contests = results.contests.reduce(
        (importContests: ContestsForImport, contest: ChallengeContest) => {
          const titles = contest.days.map((day) => day.title);
          titles.forEach((title: string) => {
            importContests.push({
              id: contest.abbr,
              start_epoch_second: PENDING, // Data not available
              duration_second: PENDING, // Same as above
              title: title,
              rate_change: '', // Same as above
            });
          });

          return importContests;
        },
        [] as ContestsForImport,
      );

      console.log(`Found AOJ PCK ${round}: ${contests.length} contests.`);

      return contests;
    } catch (error) {
      console.error(`Failed to fetch from AOJ PCK ${round} contests`, error);
      return [];
    }
  }

  /**
   * Fetches tasks from various sources and combines them into a single list.
   *
   * This method concurrently fetches tasks from three different sources:
   * - Course tasks
   * - PCK Prelim tasks
   * - PCK Final tasks
   *
   * The fetched tasks are then concatenated into a single array and returned.
   *
   * @returns {Promise<TasksForImport>} A promise that resolves to an array of tasks.
   */
  async getTasks(): Promise<TasksForImport> {
    const [courses, pckPrelims, pckFinals] = await Promise.all([
      this.fetchCourseTasks(),
      this.fetchPckTasks(PRELIM),
      this.fetchPckTasks(FINAL),
    ]);
    const tasks = courses.concat(pckPrelims, pckFinals);
    console.log(`Found AOJ: ${tasks.length} tasks.`);

    return tasks;
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
          const taskId = task.id;

          const courseTask = {
            id: taskId,
            contest_id: this.getCourseName(taskId),
            problem_index: taskId, // problem_index 相当の値がないため task.id で代用。AtCoder Problems APIにおいても、JOIの古い問題で同様の処理が行われている。
            task_id: taskId, // 同上
            title: task.name,
          };

          return courseTask;
        });

      console.log(`Found AOJ course: ${courseTasks.length} tasks.`);

      return courseTasks;
    } catch (error) {
      console.error(`Failed to fetch from AOJ course tasks`, error);
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
    const splittedTaskId = taskId.split('_');

    return splittedTaskId.length == 3 ? splittedTaskId[0] : '';
  };

  /**
   * Fetches tasks for a specified PCK round from the AOJ API.
   *
   * @param {string} round - The round identifier for which to fetch tasks.
   * @returns {Promise<TasksForImport>} A promise that resolves to an object containing tasks for import.
   * @throws Will throw an error if the API request fails or the response is invalid.
   *
   * The function performs the following steps:
   * 1. Fetches contest data from the AOJ API for the specified PCK round.
   * 2. Validates the response to ensure it contains contest data.
   * 3. Maps the contest data to a list of tasks, extracting relevant information such as task ID, contest ID, and title.
   * 4. Logs the number of tasks found for the specified round.
   */
  private async fetchPckTasks(round: string): Promise<TasksForImport> {
    try {
      const allPckContests = await this.fetchApiWithConfig<AOJChallengeContestAPI>({
        baseApiUrl: AOJ_API_BASE_URL,
        endpoint: `challenges/cl/pck/${round}`,
        errorMessage: `Failed to fetch PCK ${round} tasks from AOJ API`,
        validateResponse: (data) =>
          'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
      });

      const tasks: TasksForImport = allPckContests.contests.flatMap((contest: ChallengeContest) =>
        contest.days.flatMap((day) =>
          day.problems.map((problem) => {
            const taskId = problem.id;

            return {
              id: taskId,
              contest_id: contest.abbr,
              problem_index: taskId, // problem_index 相当の値がないため problem.id で代用。AtCoder Problems APIにおいても、JOIの古い問題で同様の処理が行われている。
              task_id: taskId, // 同上
              title: problem.name,
            };
          }),
        ),
      );
      console.log(`Found PCK ${round}: ${tasks.length} tasks.`);

      return tasks;
    } catch (error) {
      console.error(`Failed to fetch from PCK ${round} tasks`, error);
      return [];
    }
  }
}
