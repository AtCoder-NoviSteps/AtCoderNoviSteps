import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import nock from 'nock';

vi.mock('#lib/utils/time.js', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

import { HttpRequestClient } from '#lib/clients/http_client.js';
import { ContestTaskCache } from '#lib/clients/cache_strategy.js';
import { Cache } from '#lib/clients/cache.js';
import { AOJ_API_BASE_URL } from '#lib/constants/urls.js';

import { AojCoursesApiClient, AojChallengesApiClient } from './clients';

import type { ContestsForImport } from '#lib/contests/types/contest.js';
import type { TasksForImport } from '#lib/types/task.js';
import type { AOJCourseAPI, AOJChallengeContestAPI, AOJTaskAPIs } from './types';

import { loadMockData } from '../fixtures/helpers';

// Literal on purpose: a wrong AOJ_API_BASE_URL (e.g. no trailing slash) misses the interceptors.
const AOJ_API_ORIGIN = 'https://onlinejudge.u-aizu.ac.jp';

// Keep CI off the real AOJ API: a request without a matching interceptor fails.
beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

function buildCache(): ContestTaskCache {
  return new ContestTaskCache(new Cache<ContestsForImport>(), new Cache<TasksForImport>());
}

function buildCoursesClient(): AojCoursesApiClient {
  const httpClient = new HttpRequestClient(AOJ_API_BASE_URL);
  return new AojCoursesApiClient(httpClient, buildCache());
}

function buildChallengesClient(): AojChallengesApiClient {
  const httpClient = new HttpRequestClient(AOJ_API_BASE_URL);
  return new AojChallengesApiClient(httpClient, buildCache());
}

// task_id -> problem_index for the tasks of one contest.
function getProblemIndicesByTaskId(
  tasks: TasksForImport,
  contestId: string,
): Record<string, string> {
  return Object.fromEntries(
    tasks
      .filter((task) => task.contest_id === contestId)
      .map((task) => [task.task_id, task.problem_index]),
  );
}

const FIXTURE_PATHS = {
  courses: {
    contests: './src/lib/clients/fixtures/aizu_online_judge/courses/contests.json',
    tasks: './src/lib/clients/fixtures/aizu_online_judge/courses/tasks.json',
  },
  // challenges: the AOJChallengeContestAPI response is a single endpoint that embeds tasks
  // (days[].problems) inside the contest structure. The essential data is the problem list;
  // contests and tasks both derive from this one fixture.
  pckPrelim: {
    contests: './src/lib/clients/fixtures/aizu_online_judge/challenges/pck_prelim/contests.json',
  },
  pckFinal: {
    contests: './src/lib/clients/fixtures/aizu_online_judge/challenges/pck_final/contests.json',
  },
  jagPrelim: {
    contests: './src/lib/clients/fixtures/aizu_online_judge/challenges/jag_prelim/contests.json',
  },
  jagRegional: {
    contests: './src/lib/clients/fixtures/aizu_online_judge/challenges/jag_regional/contests.json',
  },
  icpcPrelim: {
    contests: './src/lib/clients/fixtures/aizu_online_judge/challenges/icpc_prelim/contests.json',
  },
  icpcRegional: {
    contests: './src/lib/clients/fixtures/aizu_online_judge/challenges/icpc_regional/contests.json',
  },
};

describe('AojCoursesApiClient', () => {
  const courseContestsMock = loadMockData<AOJCourseAPI>(FIXTURE_PATHS.courses.contests);
  const courseTasksMock = loadMockData<AOJTaskAPIs>(FIXTURE_PATHS.courses.tasks);

  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getContests', () => {
    test('fetches and transforms course contests', async () => {
      nock(AOJ_API_ORIGIN).get('/api/courses').reply(200, courseContestsMock);
      const client = buildCoursesClient();
      const contests = await client.getContests();

      expect(contests.length).toBe(courseContestsMock.courses.length);
    });

    test('each contest has id and title', async () => {
      nock(AOJ_API_ORIGIN).get('/api/courses').reply(200, courseContestsMock);
      const client = buildCoursesClient();
      const contests = await client.getContests();

      contests.forEach((contest) => {
        expect(contest.id).toBeDefined();
        expect(contest.title).toBeDefined();
      });
    });

    test('contest id matches course shortName', async () => {
      nock(AOJ_API_ORIGIN).get('/api/courses').reply(200, courseContestsMock);
      const client = buildCoursesClient();
      const contests = await client.getContests();

      const shortNames = courseContestsMock.courses.map((contest) => contest.shortName);
      contests.forEach((contest) => {
        expect(shortNames).toContain(contest.id);
      });
    });
  });

  describe('getTasks', () => {
    test('fetches and transforms course tasks (only course-format ids)', async () => {
      nock(AOJ_API_ORIGIN)
        .get('/api/problems')
        .query({ size: '10000' })
        .reply(200, courseTasksMock);
      const client = buildCoursesClient();
      const tasks = await client.getTasks();

      // Only tasks whose id matches courseName_taskId_index format are returned
      const expectedCount = courseTasksMock.filter(
        (task) => task.id.split('_').length === 3,
      ).length;
      expect(tasks.length).toBe(expectedCount);
    });

    test('each task has id, contest_id, problem_index, and title', async () => {
      nock(AOJ_API_ORIGIN)
        .get('/api/problems')
        .query({ size: '10000' })
        .reply(200, courseTasksMock);
      const client = buildCoursesClient();
      const tasks = await client.getTasks();

      tasks.forEach((task) => {
        expect(task.id).toBeDefined();
        expect(task.contest_id).toBeDefined();
        expect(task.problem_index).toBeDefined();
        expect(task.title).toBeDefined();
      });
    });

    test('task contest_id is derived from task id prefix', async () => {
      nock(AOJ_API_ORIGIN)
        .get('/api/problems')
        .query({ size: '10000' })
        .reply(200, courseTasksMock);
      const client = buildCoursesClient();
      const tasks = await client.getTasks();

      tasks.forEach((task) => {
        const expectedContestId = task.id.split('_')[0];
        expect(task.contest_id).toBe(expectedContestId);
      });
    });
  });
});

describe('AojChallengesApiClient', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('PCK PRELIM', () => {
    const contestsMock = loadMockData<AOJChallengeContestAPI>(FIXTURE_PATHS.pckPrelim.contests);
    let client: AojChallengesApiClient;

    beforeEach(() => {
      nock(AOJ_API_ORIGIN).get('/api/challenges/cl/PCK/PRELIM').reply(200, contestsMock);
      client = buildChallengesClient();
    });

    test('fetches and transforms PCK PRELIM contests', async () => {
      const contests = await client.getContests({ contestType: 'PCK', round: 'PRELIM' });
      const expectedCount = contestsMock.contests.flatMap((contest) => contest.days).length;
      expect(contests.length).toBe(expectedCount);
    });

    test('fetches and transforms PCK PRELIM tasks', async () => {
      const tasks = await client.getTasks({ contestType: 'PCK', round: 'PRELIM' });
      const expectedCount = contestsMock.contests
        .flatMap((contest) => contest.days)
        .flatMap((day) => day.problems).length;
      expect(tasks.length).toBe(expectedCount);
    });

    test('keeps the problem id as problem_index for PCK PRELIM tasks', async () => {
      const tasks = await client.getTasks({ contestType: 'PCK', round: 'PRELIM' });

      expect(tasks.every((task) => task.problem_index === task.task_id)).toBe(true);
    });

    test('each PCK PRELIM task has required fields', async () => {
      const tasks = await client.getTasks({ contestType: 'PCK', round: 'PRELIM' });
      tasks.forEach((task) => {
        expect(task.id).toBeDefined();
        expect(task.contest_id).toBeDefined();
        expect(task.title).toBeDefined();
      });
    });
  });

  describe('PCK FINAL', () => {
    const contestsMock = loadMockData<AOJChallengeContestAPI>(FIXTURE_PATHS.pckFinal.contests);
    let client: AojChallengesApiClient;

    beforeEach(() => {
      nock(AOJ_API_ORIGIN).get('/api/challenges/cl/PCK/FINAL').reply(200, contestsMock);
      client = buildChallengesClient();
    });

    test('fetches and transforms PCK FINAL contests', async () => {
      const contests = await client.getContests({ contestType: 'PCK', round: 'FINAL' });
      const expectedCount = contestsMock.contests.flatMap((contest) => contest.days).length;
      expect(contests.length).toBe(expectedCount);
    });

    test('fetches and transforms PCK FINAL tasks', async () => {
      const tasks = await client.getTasks({ contestType: 'PCK', round: 'FINAL' });
      const expectedCount = contestsMock.contests
        .flatMap((contest) => contest.days)
        .flatMap((day) => day.problems).length;
      expect(tasks.length).toBe(expectedCount);
    });
  });

  describe('JAG PRELIM', () => {
    const contestsMock = loadMockData<AOJChallengeContestAPI>(FIXTURE_PATHS.jagPrelim.contests);
    let client: AojChallengesApiClient;

    beforeEach(() => {
      nock(AOJ_API_ORIGIN).get('/api/challenges/cl/JAG/PRELIM').reply(200, contestsMock);
      client = buildChallengesClient();
    });

    test('fetches and transforms JAG PRELIM contests', async () => {
      const contests = await client.getContests({ contestType: 'JAG', round: 'PRELIM' });
      const expectedCount = contestsMock.contests.flatMap((contest) => contest.days).length;
      expect(contests.length).toBe(expectedCount);
    });

    test('fetches and transforms JAG PRELIM tasks', async () => {
      const tasks = await client.getTasks({ contestType: 'JAG', round: 'PRELIM' });
      const expectedCount = contestsMock.contests
        .flatMap((contest) => contest.days)
        .flatMap((day) => day.problems).length;
      expect(tasks.length).toBe(expectedCount);
    });

    test('assigns problem letters per contest in ascending problem id order', async () => {
      const tasks = await client.getTasks({ contestType: 'JAG', round: 'PRELIM' });

      expect(getProblemIndicesByTaskId(tasks, 'JAGPrelim2023')).toEqual({
        '3358': 'A',
        '3359': 'B',
        '3360': 'C',
        '3361': 'D',
        '3362': 'E',
        '3363': 'F',
        '3364': 'G',
        '3365': 'H',
      });
    });

    // contest_id comes from contest.abbr, so letters must be unique across all days of a contest.
    test('assigns letters across all days of a multi-day contest', async () => {
      const tasks = await client.getTasks({ contestType: 'JAG', round: 'PRELIM' });
      const indices = getProblemIndicesByTaskId(tasks, 'JAGPrelim20162');

      expect(indices['2738']).toBe('A');
      expect(indices['2744']).toBe('G');
      expect(indices['2745']).toBe('H');
      expect(indices['2751']).toBe('N');
    });
  });

  describe('JAG REGIONAL', () => {
    const contestsMock = loadMockData<AOJChallengeContestAPI>(FIXTURE_PATHS.jagRegional.contests);
    let client: AojChallengesApiClient;

    beforeEach(() => {
      nock(AOJ_API_ORIGIN).get('/api/challenges/cl/JAG/REGIONAL').reply(200, contestsMock);
      client = buildChallengesClient();
    });

    test('fetches and transforms JAG REGIONAL contests', async () => {
      const contests = await client.getContests({ contestType: 'JAG', round: 'REGIONAL' });
      const expectedCount = contestsMock.contests.flatMap((contest) => contest.days).length;
      expect(contests.length).toBe(expectedCount);
    });

    test('fetches and transforms JAG REGIONAL tasks', async () => {
      const tasks = await client.getTasks({ contestType: 'JAG', round: 'REGIONAL' });
      const expectedCount = contestsMock.contests
        .flatMap((contest) => contest.days)
        .flatMap((day) => day.problems).length;
      expect(tasks.length).toBe(expectedCount);
    });

    test('keeps the problem id as problem_index for JAG REGIONAL tasks', async () => {
      const tasks = await client.getTasks({ contestType: 'JAG', round: 'REGIONAL' });

      expect(getProblemIndicesByTaskId(tasks, 'JAGRegional2005')).toEqual({
        '2024': '2024',
        '2025': '2025',
        '2026': '2026',
        '2027': '2027',
        '2028': '2028',
        '2029': '2029',
      });
    });
  });

  describe('ICPC PRELIM', () => {
    const contestsMock = loadMockData<AOJChallengeContestAPI>(FIXTURE_PATHS.icpcPrelim.contests);
    let client: AojChallengesApiClient;

    beforeEach(() => {
      nock(AOJ_API_ORIGIN).get('/api/challenges/cl/ICPC/PRELIM').reply(200, contestsMock);
      client = buildChallengesClient();
    });

    test('fetches and transforms ICPC PRELIM contests', async () => {
      const contests = await client.getContests({ contestType: 'ICPC', round: 'PRELIM' });
      const expectedCount = contestsMock.contests.flatMap((contest) => contest.days).length;
      expect(contests.length).toBe(expectedCount);
    });

    test('fetches and transforms ICPC PRELIM tasks', async () => {
      const tasks = await client.getTasks({ contestType: 'ICPC', round: 'PRELIM' });
      const expectedCount = contestsMock.contests
        .flatMap((contest) => contest.days)
        .flatMap((day) => day.problems).length;
      expect(tasks.length).toBe(expectedCount);
    });

    test('assigns problem letters per contest in ascending problem id order', async () => {
      const tasks = await client.getTasks({ contestType: 'ICPC', round: 'PRELIM' });

      expect(getProblemIndicesByTaskId(tasks, 'ICPCPrelim1998')).toEqual({
        '1100': 'A',
        '1101': 'B',
        '1102': 'C',
        '1103': 'D',
      });
      expect(getProblemIndicesByTaskId(tasks, 'ICPCPrelim2025')).toEqual({
        '1681': 'A',
        '1682': 'B',
        '1683': 'C',
        '1684': 'D',
        '1685': 'E',
        '1686': 'F',
        '1687': 'G',
        '1688': 'H',
        '1689': 'I',
      });
    });
  });

  describe('ICPC REGIONAL', () => {
    const contestsMock = loadMockData<AOJChallengeContestAPI>(FIXTURE_PATHS.icpcRegional.contests);
    let client: AojChallengesApiClient;

    beforeEach(() => {
      nock(AOJ_API_ORIGIN).get('/api/challenges/cl/ICPC/REGIONAL').reply(200, contestsMock);
      client = buildChallengesClient();
    });

    test('fetches and transforms ICPC REGIONAL contests', async () => {
      const contests = await client.getContests({ contestType: 'ICPC', round: 'REGIONAL' });
      const expectedCount = contestsMock.contests.flatMap((contest) => contest.days).length;
      expect(contests.length).toBe(expectedCount);
    });

    test('fetches and transforms ICPC REGIONAL tasks', async () => {
      const tasks = await client.getTasks({ contestType: 'ICPC', round: 'REGIONAL' });
      const expectedCount = contestsMock.contests
        .flatMap((contest) => contest.days)
        .flatMap((day) => day.problems).length;
      expect(tasks.length).toBe(expectedCount);
    });

    test('assigns problem letters A through L for ICPC Regional 2024', async () => {
      const tasks = await client.getTasks({ contestType: 'ICPC', round: 'REGIONAL' });
      const indices = getProblemIndicesByTaskId(tasks, 'ICPCRegional2024');

      expect(Object.keys(indices)).toHaveLength(12);
      expect(indices['1455']).toBe('A');
      expect(indices['1460']).toBe('F');
      expect(indices['1466']).toBe('L');
    });

    test('each ICPC REGIONAL task has required fields', async () => {
      const tasks = await client.getTasks({ contestType: 'ICPC', round: 'REGIONAL' });
      tasks.forEach((task) => {
        expect(task.id).toBeDefined();
        expect(task.contest_id).toBeDefined();
        expect(task.title).toBeDefined();
      });
    });
  });
});
