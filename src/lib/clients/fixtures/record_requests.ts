import path from 'path';
import fs from 'fs';

import { AtCoderProblemsApiClient } from '$lib/clients/atcoder/atcoder_problems';
import { HttpRequestClient } from '$lib/clients/http_client';

import type {
  AOJCourseAPI,
  AOJTaskAPIs,
  AOJChallengeContestAPI,
} from '$lib/clients/aizu_online_judge/types';

import { AOJ_API_BASE_URL } from '$lib/constants/urls';

// Run the main function if you add a contest site.
// Usage:
// pnpm dlx vite-node ./src/lib/clients/fixtures/record_requests.ts
// Saves raw API responses (no transformation) so nock can replay them in tests.
async function main(): Promise<void> {
  try {
    await saveAtCoder();

    // AOJ courses API has separate endpoints for contests and tasks, so we save them separately.
    await saveAojCourseContests();
    await saveAojCourseTasks();

    for (const { contestType, round, dir } of challengeConfigs) {
      await saveAojChallenge(contestType, round, dir);
    }
  } catch (error) {
    console.error('Failed to record requests: ', error);
    throw error;
  }
}

const atCoderClient = new AtCoderProblemsApiClient();
const aojHttpClient = new HttpRequestClient(AOJ_API_BASE_URL);

const challengeConfigs = [
  { contestType: 'PCK', round: 'PRELIM', dir: 'pck_prelim' },
  { contestType: 'PCK', round: 'FINAL', dir: 'pck_final' },
  { contestType: 'JAG', round: 'PRELIM', dir: 'jag_prelim' },
  { contestType: 'JAG', round: 'REGIONAL', dir: 'jag_regional' },
] as const;

export const TEST_DATA_BASE_DIR = path.join('src', 'lib', 'clients', 'fixtures');

// AtCoder Problems API returns data in ContestsForImport format directly (no transformation).
async function saveAtCoder(): Promise<void> {
  const contests = await atCoderClient.getContests();
  const tasks = await atCoderClient.getTasks();

  const sampledContests = [...contests].sort((a, b) => a.id.localeCompare(b.id)).slice(0, 100);
  const sampledContestIds = new Set(sampledContests.map((contest) => contest.id));
  const sampledTasks = tasks
    .filter((task) => sampledContestIds.has(task.contest_id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 100);

  await toJson(path.join(TEST_DATA_BASE_DIR, 'atcoder_problems', 'contests.json'), sampledContests);
  await toJson(path.join(TEST_DATA_BASE_DIR, 'atcoder_problems', 'tasks.json'), sampledTasks);
}

async function saveAojCourseContests(): Promise<void> {
  const raw = await aojHttpClient.fetchApiWithConfig<AOJCourseAPI>({
    endpoint: 'courses',
    errorMessage: 'Failed to fetch AOJ courses',
  });
  await toJson(path.join(TEST_DATA_BASE_DIR, 'aizu_online_judge', 'courses', 'contests.json'), raw);
}

async function saveAojCourseTasks(): Promise<void> {
  const raw = await aojHttpClient.fetchApiWithConfig<AOJTaskAPIs>({
    endpoint: 'problems?size=10000',
    errorMessage: 'Failed to fetch AOJ course tasks',
  });
  const sampled = [...raw].sort((a, b) => a.id.localeCompare(b.id)).slice(0, 100);

  await toJson(
    path.join(TEST_DATA_BASE_DIR, 'aizu_online_judge', 'courses', 'tasks.json'),
    sampled,
  );
}

async function saveAojChallenge(
  contestType: 'PCK' | 'JAG',
  round: 'PRELIM' | 'FINAL' | 'REGIONAL',
  dir: string,
): Promise<void> {
  const raw = await aojHttpClient.fetchApiWithConfig<AOJChallengeContestAPI>({
    endpoint: `challenges/cl/${contestType}/${round}`,
    errorMessage: `Failed to fetch AOJ ${contestType} ${round}`,
  });
  const sampled = {
    ...raw,
    contests: [...raw.contests].sort((a, b) => a.abbr.localeCompare(b.abbr)).slice(0, 100),
  };

  await toJson(
    path.join(TEST_DATA_BASE_DIR, 'aizu_online_judge', 'challenges', dir, 'contests.json'),
    sampled,
  );
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function toJson<T>(filePath: string, data: T): Promise<void> {
  ensureDirectoryExists(path.dirname(filePath));

  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved to ${filePath}`);
}

main();
