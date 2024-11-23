import { AtCoderProblemsApiClient } from '$lib/clients/atcoder_problems';
import { AojApiClient } from '$lib/clients/aizu_online_judge';

import type { ContestForImport, ContestsForImport } from '$lib/types/contest';
import type { TaskForImport, TasksForImport } from '$lib/types/task';

// Fetches and aggregates contest and problem information from various contest sites via their APIs.
//
// @remarks
// Supported Contest Sites (as of 2024-11):
//
// 1. AtCoder: AtCoder Problems API
//   {@link https://github.com/kenkoooo/AtCoderProblems/blob/master/doc/api.md}
//
// 2. AIZU ONLINE JUDGE (AOJ)
//   ・Courses
//   ・Challenges
//     ・PCK (All-Japan High School Programming Contest)
//     ・JAG (ACM-ICPC Japan Alumni Group Contest)

/**
 * Creates and returns an object containing instances of various API clients.
 *
 * @returns An object with the following properties:
 * - `atCoder`: An instance of `AtCoderProblemsApiClient`.
 * - `aoj`: An instance of `AojApiClient`.
 */
function createClients() {
  return {
    atCoder: new AtCoderProblemsApiClient(),
    aoj: new AojApiClient(),
  };
}

const { atCoder: atCoderProblemsApiClient, aoj: aojApiClient } = createClients();

/**
 * Fetches and aggregates contest information from all supported platforms.
 * @returns {Promise<ContestsForImport>} A promise that resolves to an array of unique contests.
 */
export const getContests = (): Promise<ContestsForImport> => {
  const contests = mergeDataFromAPIs<ContestForImport>([
    { source: () => atCoderProblemsApiClient.getContests(), name: 'AtCoder contests' },
    { source: () => aojApiClient.getContests(), name: 'AOJ contests' },
  ]);

  return contests;
};

/**
 * Fetches and aggregates task information from all supported platforms.
 * @returns {Promise<TasksForImport>} A promise that resolves to an array of unique tasks.
 */
export const getTasks = (): Promise<TasksForImport> => {
  const tasks = mergeDataFromAPIs<TaskForImport>([
    { source: () => atCoderProblemsApiClient.getTasks(), name: 'AtCoder tasks' },
    { source: () => aojApiClient.getTasks(), name: 'AOJ tasks' },
  ]);

  return tasks;
};

/**
 * Merges data from multiple API sources, ensuring unique entries based on the `id` property.
 *
 * @template T - The type of the data objects, which must include an `id` property of type `string`.
 * @param {Array<{ source: () => Promise<T[]>; name: string }>} sources - An array of objects containing a `source` function that returns a promise resolving to an array of data objects, and a `name` string for identifying the source.
 * @returns {Promise<T[]>} A promise that resolves to an array of unique data objects.
 * @throws Will throw an error if the data fetching process fails.
 */
async function mergeDataFromAPIs<T extends { id: string }>(
  sources: Array<{ source: () => Promise<T[]>; name: string }>,
): Promise<T[]> {
  const metrics = {
    apiTime: 0,
    totalTime: 0,
    itemCount: 0,
    errors: [] as Array<{ source: string; error: Error }>,
  };
  const startTime = performance.now();

  try {
    const rawData = await Promise.all(
      sources.map(({ source, name }) =>
        source().catch((error) => {
          metrics.errors.push({ source: name, error });
          return [];
        }),
      ),
    );

    metrics.apiTime = performance.now() - startTime;

    const uniqueDataMap = new Map<string, T>();
    rawData.flat().forEach((data) => {
      uniqueDataMap.set(data.id, data);
    });

    metrics.totalTime = performance.now() - startTime;
    metrics.itemCount = uniqueDataMap.size;

    console.info('API metrics:', {
      ...metrics,
      apiTime: `${metrics.apiTime.toFixed(0)}ms`,
      totalTime: `${metrics.totalTime.toFixed(0)}ms`,
      errorCount: metrics.errors.length,
    });

    if (metrics.errors.length >= 1) {
      console.error('API errors:', metrics.errors);
    }

    return Array.from(uniqueDataMap.values());
  } catch (error) {
    const finalError = new Error('Failed to fetch data from API(s)', { cause: error });

    console.error('Critical API error:', {
      error: finalError,
      metrics,
    });

    throw finalError;
  }
}
