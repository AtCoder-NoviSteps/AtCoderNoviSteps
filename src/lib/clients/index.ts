import { AtCoderProblemsApiClient } from '$lib/clients/atcoder_problems';
import { AojApiClient } from '$lib/clients/aizu_online_judge';

import type { ContestForImport } from '$lib/types/contest';
import type { TaskForImport } from '$lib/types/task';

// 各コンテストサイトのコンテスト情報・問題情報をAPIから取得・集約する
// Fetch and aggregate contest and problem information from various contest sites via their APIs
//
// 対応コンテストサイト (2024年10月現在)
// Supported Contest Sites (as of October 2024):
//
// ・AtCoder: AtCoder Problems API
//   https://github.com/kenkoooo/AtCoderProblems/blob/master/doc/api.md
//
// ・AIZU ONLINE JUDGE (AOJ)
//   ・Courses
//   ・Challenges
//     ・PCK (All-Japan High School Programming Contest)

const atCoderProblemsApiClient = new AtCoderProblemsApiClient();
const aojApiClient = new AojApiClient();

export const getContests = () => {
  const contests = mergeDataFromAPIs<ContestForImport>([
    { source: () => atCoderProblemsApiClient.getContests(), name: 'AtCoder contests' },
    { source: () => aojApiClient.getContests(), name: 'AOJ contests' },
  ]);

  return contests;
};

export const getTasks = () => {
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
  const startTime = performance.now();

  try {
    const rawData = await Promise.all(
      sources.map(({ source, name }) =>
        source().catch((error) => {
          console.error(`Failed to fetch from ${name}`, error);
          return [];
        }),
      ),
    );

    const apiTime = performance.now() - startTime;

    const uniqueDataMap = new Map<string, T>();
    rawData.flat().forEach((data) => {
      uniqueDataMap.set(data.id, data);
    });

    const totalTime = performance.now() - startTime;
    console.info(
      `API metrics: ${apiTime.toFixed(0)} ms (API), ${totalTime.toFixed(0)} ms (Total), ${uniqueDataMap.size} items`,
    );

    return Array.from(uniqueDataMap.values());
  } catch (error) {
    console.error('Failed to fetch data from API(s)', error);
    throw error;
  }
}
