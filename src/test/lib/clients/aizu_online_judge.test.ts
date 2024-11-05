import { describe, test, expect } from 'vitest';

import { loadMockData } from '../common/test_helpers';

import { ContestSiteApiClient } from '$lib/clients/common';
import { AojApiClient } from '$lib/clients/aizu_online_judge';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

describe('AIZU ONLINE JUDGE API client', () => {
  let client: ContestSiteApiClient;
  let contestsMock: ContestsForImport;
  let tasksMock: TasksForImport;

  beforeAll(() => {
    client = new AojApiClient();

    const MOCK_DATA_PATHS = {
      contests: './src/test/lib/clients/test_data/aizu_online_judge/contests.json',
      tasks: './src/test/lib/clients/test_data/aizu_online_judge/tasks.json',
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

  describe('getContests', () => {
    test('expects to fetch contests', async () => {
      // Use mock data instead of making a request.
      client.getContests = async () => contestsMock;
      const contests = await client.getContests();

      expect(contests.length).toEqual(contestsMock.length);
    });

    // See:
    // https://vitest.dev/api/expect.html#tobedefined
    test('each contest expects to have id and title', async () => {
      contestsMock.forEach((contest) => {
        expect(contest.id).toBeDefined();
        expect(contest.title).toBeDefined();
      });
    });

    test('handles empty contests list', async () => {
      client.getContests = async () => [];
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
      // Use mock data instead of making a request.
      client.getTasks = async () => tasksMock;
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

    test('handles empty tasks list', async () => {
      client.getTasks = async () => [];
      const tasks = await client.getTasks();
      expect(tasks).toHaveLength(0);
    });

    test('validates task properties format', async () => {
      tasksMock.forEach((task) => {
        expect(typeof task.id).toBe('string');
        expect(typeof task.contest_id).toBe('string');
        expect(typeof task.problem_index).toBe('string');
        expect(typeof task.title).toBe('string');
        expect(task.title.length).toBeGreaterThan(0);
      });
    });
  });
});
