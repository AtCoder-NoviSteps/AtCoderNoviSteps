import { describe, test, expect } from 'vitest';
import fs from 'fs';

import { ContestSiteApiClient } from '$lib/clients/common';
import { AtCoderProblemsApiClient } from '$lib/clients/atcoder_problems';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

describe('AtCoder Problems API client', () => {
  let client: ContestSiteApiClient;
  let contestsMock: ContestsForImport;
  let tasksMock: TasksForImport;

  beforeAll(() => {
    client = new AtCoderProblemsApiClient();
    contestsMock = JSON.parse(
      fs.readFileSync('./src/test/lib/clients/test_data/atcoder_problems/contests.json', 'utf8'),
    );

    tasksMock = JSON.parse(
      fs.readFileSync('./src/test/lib/clients/test_data/atcoder_problems/tasks.json', 'utf8'),
    );
  });

  describe('getContests', () => {
    test('expects to fetch contests', async () => {
      // Use mock data instead of making a request.
      client.getContests = async () => contestsMock;
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
  });
});
