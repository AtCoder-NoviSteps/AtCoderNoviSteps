import path from 'path';

// See:
// https://github.com/nock/nock
import nock from 'nock';
import fs from 'fs';

import type { ContestSiteApiClient } from '$lib/clients/common';
import { AtCoderProblemsApiClient } from '$lib/clients/atcoder_problems';
import { AojApiClient } from '$lib/clients/aizu_online_judge';

// Run the main function if you add a contest site.
// Usage:
// pnpm dlx vite-node ./src/test/lib/clients/record_requests.ts
async function main(): Promise<void> {
  try {
    startRecordRequests();

    await Promise.all(
      clients.map(async (client) => {
        try {
          await saveContests(client.source, client.name, 100);
          await saveTasks(client.source, client.name, 100);
        } catch (error) {
          console.error(`Failed to save data for ${client.name}: `, error);
        }
      }),
    );
  } catch (error) {
    console.error('Failed to record requests: ', error);
    throw error;
  } finally {
    stopRecordRequests();
  }
}

/**
 * An array of client objects, each containing a name and an instance of an API client.
 *
 * @constant
 * @type {Array<{ name: string, source: ContestSiteApiClient }>}
 * @property {string} name - The name of the client.
 * @property {ContestSiteApiClient} source - An instance of the API client.
 */
const clients = [
  { name: 'atcoder_problems', source: new AtCoderProblemsApiClient() },
  { name: 'aizu_online_judge', source: new AojApiClient() },
];

export const TEST_DATA_BASE_DIR = path.join('src', 'test', 'lib', 'clients', 'test_data');

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Saves a specified number of contests from a contest site to a JSON file.
 *
 * @param client - An instance of `ContestSiteApiClient` used to fetch contests.
 * @param contestSite - The name of the contest site.
 * @param count - The number of contests to save. Defaults to 100.
 * @returns A promise that resolves when the contests have been saved.
 */
async function saveContests(
  client: ContestSiteApiClient,
  contestSite: string,
  count: number = 100,
): Promise<void> {
  validateContestSiteApi(client, contestSite);

  const contests = await client.getContests();
  const selectedContests = getRandomElementsFromArray(contests, count);

  const filePath = path.join(TEST_DATA_BASE_DIR, contestSite, 'contests.json');
  await toJson(filePath, selectedContests);
}

/**
 * Saves a specified number of tasks from a contest site to a JSON file.
 *
 * @param client - An instance of `ContestSiteApiClient` used to fetch tasks.
 * @param contestSite - The identifier for the contest site.
 * @param count - The number of tasks to save. Defaults to 100.
 *
 * @returns A promise that resolves when the tasks have been saved.
 */
async function saveTasks(
  client: ContestSiteApiClient,
  contestSite: string,
  count: number = 100,
): Promise<void> {
  validateContestSiteApi(client, contestSite);

  const tasks = await client.getTasks();
  const selectedTasks = getRandomElementsFromArray(tasks, count);

  const filePath = path.join(TEST_DATA_BASE_DIR, contestSite, 'tasks.json');
  await toJson(filePath, selectedTasks);
}

function startRecordRequests(): void {
  nock.recorder.rec({
    output_objects: true,
    dont_print: true,
  });
}

function stopRecordRequests(): void {
  nock.recorder.play();
}

function validateContestSiteApi(client: ContestSiteApiClient, contestSite: string): void {
  if (!client) {
    throw new Error('Client is required');
  }
  if (!contestSite || contestSite.trim() === '') {
    throw new Error('Contest site identifier is required');
  }
}

function getRandomElementsFromArray<T>(array: T[], count: number): T[] {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  if (count < 0) {
    throw new Error('Count must be non-negative');
  }

  count = Math.min(count, array.length);
  const results = [];
  const selectedIndices = new Set<number>();

  while (results.length < count) {
    const index = Math.floor(Math.random() * array.length);

    if (selectedIndices.has(index)) {
      continue;
    }

    selectedIndices.add(index);
    results.push(array[index]);
  }

  return results;
}

async function toJson<T>(filePath: string, data: T[]): Promise<void> {
  if (!filePath || filePath.trim() === '') {
    throw new Error('File path is required');
  }
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }

  ensureDirectoryExists(path.dirname(filePath));

  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved to ${filePath}`);
}

main();
