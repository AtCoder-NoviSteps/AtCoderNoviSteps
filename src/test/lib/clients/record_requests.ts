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
  startRecordRequests();

  clients.forEach(async (client) => {
    await saveContests(client.source, client.name, 100);
    await saveTasks(client.source, client.name, 100);
  });
}

/**
 * An array of client objects, each containing a name and an instance of an API client.
 *
 * @constant
 * @type {Array<{ name: string, client: object }>}
 * @property {string} name - The name of the client.
 * @property {ContestSiteApiClient} source - An instance of the API client.
 */
const clients = [
  { name: 'atcoder_problems', source: new AtCoderProblemsApiClient() },
  { name: 'aizu_online_judge', source: new AojApiClient() },
];

export const TEST_DATA_BASE_DIR = 'src/test/lib/clients/test_data/';

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
  const contests = await client.getContests();
  const selectedContests = getRandomElementsFromArray(contests, count);

  stopRecordRequests();
  toJson(TEST_DATA_BASE_DIR + contestSite + '/contests.json', selectedContests);
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
  const tasks = await client.getTasks();
  const selectedTasks = getRandomElementsFromArray(tasks, count);

  stopRecordRequests();
  toJson(TEST_DATA_BASE_DIR + contestSite + '/tasks.json', selectedTasks);
}

function startRecordRequests() {
  nock.recorder.rec({
    output_objects: true,
    dont_print: true,
  });
}

function stopRecordRequests(): void {
  nock.recorder.play();
}

function getRandomElementsFromArray<T>(array: T[], count: number): T[] {
  if (count > array.length) {
    count = array.length;
  }

  const shuffled = array.slice(); // Copy the original array

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }

  return shuffled.slice(0, count);
}

function toJson<T>(filePath: string, data: T[]): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved to ${filePath}`);
}

main();
