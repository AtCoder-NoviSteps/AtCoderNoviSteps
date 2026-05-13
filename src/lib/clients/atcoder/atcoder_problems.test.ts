import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import nock from 'nock';

vi.mock('$lib/utils/time', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

import { AtCoderProblemsApiClient } from '$lib/clients/atcoder/atcoder_problems';

import { loadMockData } from '../fixtures/helpers';

const API_BASE = 'https://kenkoooo.com';
const API_PATH = '/atcoder/resources/';

describe('AtCoder Problems API client', () => {
  let client: AtCoderProblemsApiClient;
  let contestsMock: ContestsForImport;
  let tasksMock: TasksForImport;

  beforeAll(() => {
    client = new AtCoderProblemsApiClient();

    const MOCK_DATA_PATHS = {
      contests: './src/lib/clients/fixtures/atcoder_problems/contests.json',
      tasks: './src/lib/clients/fixtures/atcoder_problems/tasks.json',
    };

    try {
      contestsMock = loadMockData<ContestsForImport>(MOCK_DATA_PATHS.contests);
      tasksMock = loadMockData<TasksForImport>(MOCK_DATA_PATHS.tasks);
    } catch (error) {
      throw new Error(
        `Failed to load mock data: ${error}\nFile: ${
          error instanceof Error && 'fileName' in error ? error.fileName : 'unknown'
        }`,
      );
    }
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getContests', () => {
    test('expects to fetch contests', async () => {
      nock(API_BASE).get(`${API_PATH}contests.json`).reply(200, contestsMock);
      const contests = await client.getContests();

      expect(contests.length).toBe(contestsMock.length);
    });

    // See:
    // https://vitest.dev/api/expect.html#tobedefined
    test('each contest expects to have id and title', async () => {
      contestsMock.forEach((contest) => {
        expect(contest.id).toBeDefined();
        expect(contest.title).toBeDefined();
      });
    });

    test('returns empty array when API response is empty', async () => {
      nock(API_BASE).get(`${API_PATH}contests.json`).reply(200, []);
      const contests = await client.getContests();
      expect(contests).toHaveLength(0);
    });

    test('validates contest properties format', async () => {
      contestsMock.forEach((contest) => {
        expect(typeof contest.id).toBe('string');
        expect(contest.id).toMatch(/^[a-zA-Z0-9_-]+$/);
        expect(typeof contest.title).toBe('string');
        expect(contest.title.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getTasks', () => {
    test('expects to fetch tasks', async () => {
      nock(API_BASE).get(`${API_PATH}problems.json`).reply(200, tasksMock);
      const tasks = await client.getTasks();

      expect(tasks.length).toEqual(tasksMock.length);
    });

    test('each task expects to have id, contest_id, problem_index and title', async () => {
      tasksMock.forEach((task) => {
        expect(task.id).toBeDefined();
        expect(task.contest_id).toBeDefined();
        expect(task.problem_index).toBeDefined();
        expect(task.title).toBeDefined();
      });
    });

    test('returns empty array when API response is empty', async () => {
      nock(API_BASE).get(`${API_PATH}problems.json`).reply(200, []);
      const tasks = await client.getTasks();
      expect(tasks).toHaveLength(0);
    });

    test('validates task properties format', async () => {
      tasksMock.forEach((task) => {
        expect(typeof task.id).toBe('string');
        expect(typeof task.contest_id).toBe('string');
        expect(typeof task.problem_index).toBe('string');
        expect(task.problem_index).toMatch(/^[A-Z]*[a-z]*[0-9]*$/);
        expect(typeof task.title).toBe('string');
        expect(task.title.length).toBeGreaterThan(0);
      });
    });
  });
});
