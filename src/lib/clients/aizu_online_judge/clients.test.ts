import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import nock from 'nock';

vi.mock('$lib/utils/time', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

import { HttpRequestClient } from '$lib/clients/http_client';
import { ContestTaskCache } from '$lib/clients/cache_strategy';
import { Cache } from '$lib/clients/cache';

import { AojCoursesApiClient, AojChallengesApiClient } from './clients';

import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';
import type { AOJCourseAPI, AOJChallengeContestAPI, AOJTaskAPIs } from './types';

import { loadMockData } from '../fixtures/helpers';

const AOJ_API_BASE = 'https://judgeapi.u-aizu.ac.jp';

function buildCache(): ContestTaskCache {
  return new ContestTaskCache(new Cache<ContestsForImport>(), new Cache<TasksForImport>());
}

function buildCoursesClient(): AojCoursesApiClient {
  const httpClient = new HttpRequestClient(`${AOJ_API_BASE}/`);
  return new AojCoursesApiClient(httpClient, buildCache());
}

function buildChallengesClient(): AojChallengesApiClient {
  const httpClient = new HttpRequestClient(`${AOJ_API_BASE}/`);
  return new AojChallengesApiClient(httpClient, buildCache());
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
      nock(AOJ_API_BASE).get('/courses').reply(200, courseContestsMock);
      const client = buildCoursesClient();
      const contests = await client.getContests();

      expect(contests.length).toBe(courseContestsMock.courses.length);
    });

    test('each contest has id and title', async () => {
      nock(AOJ_API_BASE).get('/courses').reply(200, courseContestsMock);
      const client = buildCoursesClient();
      const contests = await client.getContests();

      contests.forEach((contest) => {
        expect(contest.id).toBeDefined();
        expect(contest.title).toBeDefined();
      });
    });

    test('contest id matches course shortName', async () => {
      nock(AOJ_API_BASE).get('/courses').reply(200, courseContestsMock);
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
      nock(AOJ_API_BASE).get('/problems').query({ size: '10000' }).reply(200, courseTasksMock);
      const client = buildCoursesClient();
      const tasks = await client.getTasks();

      // Only tasks whose id matches courseName_taskId_index format are returned
      const expectedCount = courseTasksMock.filter(
        (task) => task.id.split('_').length === 3,
      ).length;
      expect(tasks.length).toBe(expectedCount);
    });

    test('each task has id, contest_id, problem_index, and title', async () => {
      nock(AOJ_API_BASE).get('/problems').query({ size: '10000' }).reply(200, courseTasksMock);
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
      nock(AOJ_API_BASE).get('/problems').query({ size: '10000' }).reply(200, courseTasksMock);
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
      nock(AOJ_API_BASE).get('/challenges/cl/PCK/PRELIM').reply(200, contestsMock);
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
      nock(AOJ_API_BASE).get('/challenges/cl/PCK/FINAL').reply(200, contestsMock);
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
      nock(AOJ_API_BASE).get('/challenges/cl/JAG/PRELIM').reply(200, contestsMock);
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
  });

  describe('JAG REGIONAL', () => {
    const contestsMock = loadMockData<AOJChallengeContestAPI>(FIXTURE_PATHS.jagRegional.contests);
    let client: AojChallengesApiClient;

    beforeEach(() => {
      nock(AOJ_API_BASE).get('/challenges/cl/JAG/REGIONAL').reply(200, contestsMock);
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
  });

  describe('ICPC PRELIM', () => {
    const contestsMock = loadMockData<AOJChallengeContestAPI>(FIXTURE_PATHS.icpcPrelim.contests);
    let client: AojChallengesApiClient;

    beforeEach(() => {
      nock(AOJ_API_BASE).get('/challenges/cl/ICPC/PRELIM').reply(200, contestsMock);
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
  });

  describe('ICPC REGIONAL', () => {
    const contestsMock = loadMockData<AOJChallengeContestAPI>(FIXTURE_PATHS.icpcRegional.contests);
    let client: AojChallengesApiClient;

    beforeEach(() => {
      nock(AOJ_API_BASE).get('/challenges/cl/ICPC/REGIONAL').reply(200, contestsMock);
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
