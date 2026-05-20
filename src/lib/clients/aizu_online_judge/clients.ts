import { HttpRequestClient } from '$lib/clients/http_client';
import { ContestTaskCache } from '$lib/clients/cache_strategy';
import { getCachedOrFetchContests, getCachedOrFetchTasks } from '$lib/clients/contest_task_fetcher';

import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

import type {
  AOJCourseAPI,
  Course,
  AOJTaskAPIs,
  AOJTaskAPI,
  AOJChallengeContestAPI,
  ChallengeContest,
  ChallengeParams,
} from './types';
import { buildEndpoint, mapToContest, mapToTask, getCourseName } from './utils';

export class AojCoursesApiClient {
  constructor(
    private readonly httpClient: HttpRequestClient,
    private readonly cache: ContestTaskCache,
  ) {}

  async getContests(): Promise<ContestsForImport> {
    return getCachedOrFetchContests<AOJCourseAPI>(this.httpClient, this.cache, {
      cacheKey: 'aoj_courses',
      endpoint: 'courses',
      errorMessage: 'Failed to fetch course contests from AOJ API',
      validateResponse: (data) =>
        'courses' in data && Array.isArray(data.courses) && data.courses.length > 0,
      transformer: (data) =>
        data.courses.map((course: Course) => mapToContest(course.shortName, course.name)),
      label: 'AOJ course',
    });
  }

  async getTasks(): Promise<TasksForImport> {
    const size = 10 ** 4;

    return getCachedOrFetchTasks<AOJTaskAPIs>(this.httpClient, this.cache, {
      cacheKey: 'aoj_courses',
      endpoint: `problems?size=${size}`,
      errorMessage: 'Failed to fetch course tasks from AOJ API',
      validateResponse: (data) => Array.isArray(data) && data.length > 0,
      transformer: (data) =>
        data
          .filter((task: AOJTaskAPI) => getCourseName(task.id) !== '')
          .map((task: AOJTaskAPI) => mapToTask(task, getCourseName(task.id))),
      label: 'AOJ course',
    });
  }
}

// AOJ challenges API returns contests and their tasks in a single endpoint
// (days[].problems). getContests() and getTasks() both call the same URL;
// there is no separate tasks endpoint unlike AojCoursesApiClient.
export class AojChallengesApiClient {
  constructor(
    private readonly httpClient: HttpRequestClient,
    private readonly cache: ContestTaskCache,
  ) {}

  async getContests(params: ChallengeParams): Promise<ContestsForImport> {
    const { contestType, round } = params;

    return getCachedOrFetchContests<AOJChallengeContestAPI>(this.httpClient, this.cache, {
      cacheKey: this.getCacheKey(params),
      endpoint: buildEndpoint(['challenges', 'cl', contestType, round]),
      errorMessage: `Failed to fetch ${contestType} ${round} contests from AOJ API`,
      validateResponse: (data) =>
        'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
      transformer: (data) =>
        data.contests.flatMap((contest: ChallengeContest) =>
          contest.days
            .map((day) => day.title)
            .map((title: string) => mapToContest(contest.abbr, title)),
        ),
      label: `AOJ ${contestType} ${round}`,
    });
  }

  async getTasks(params: ChallengeParams): Promise<TasksForImport> {
    const { contestType, round } = params;

    return getCachedOrFetchTasks<AOJChallengeContestAPI>(this.httpClient, this.cache, {
      cacheKey: this.getCacheKey(params),
      endpoint: buildEndpoint(['challenges', 'cl', contestType, round]),
      errorMessage: `Failed to fetch ${contestType} ${round} tasks from AOJ API`,
      validateResponse: (data) =>
        'contests' in data && Array.isArray(data.contests) && data.contests.length > 0,
      transformer: (data) =>
        data.contests.flatMap((contest: ChallengeContest) =>
          contest.days.flatMap((day) =>
            day.problems.map((problem) => mapToTask(problem, contest.abbr)),
          ),
        ),
      label: `AOJ ${contestType} ${round}`,
    });
  }

  private getCacheKey({ contestType, round }: ChallengeParams): string {
    return `aoj_${contestType.toLowerCase()}_${round.toLowerCase()}`;
  }
}
