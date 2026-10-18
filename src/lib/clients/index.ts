import { HttpRequestClient } from '#lib/clients/http_client.js';
import { ContestTaskCache } from '#lib/clients/cache_strategy.js';
import { Cache } from '#lib/clients/cache.js';

import { AtCoderProblemsApiClient } from '#lib/clients/atcoder/atcoder_problems.js';
import {
  AojCoursesApiClient,
  AojChallengesApiClient,
} from '#lib/clients/aizu_online_judge/clients.js';

import type { ContestsForImport } from '#lib/contests/types/contest.js';
import type { TasksForImport } from '#lib/types/task.js';
import type { ChallengeParams } from '#lib/clients/aizu_online_judge/types.js';

import { AOJ_API_BASE_URL } from '#lib/constants/urls.js';

// Supported contest data sources for task import.
export type ContestTaskImportSource =
  | 'atcoder'
  | 'aoj_courses'
  | 'aoj_pck_prelim'
  | 'aoj_pck_final'
  | 'aoj_jag_prelim'
  | 'aoj_jag_regional'
  | 'aoj_icpc_prelim'
  | 'aoj_icpc_regional';

type ContestTaskImportSourceConfig = {
  label: string;
  contests: () => Promise<ContestsForImport>;
  tasks: () => Promise<TasksForImport>;
};

// AtCoder
const atCoderClient = new AtCoderProblemsApiClient();

// Aizu Online Judge (AOJ)
const aojHttpClient = new HttpRequestClient(AOJ_API_BASE_URL);
const aojCache = new ContestTaskCache(new Cache<ContestsForImport>(), new Cache<TasksForImport>());

const aojCoursesClient = new AojCoursesApiClient(aojHttpClient, aojCache);
const aojChallengesClient = new AojChallengesApiClient(aojHttpClient, aojCache);

const importSources: Record<ContestTaskImportSource, ContestTaskImportSourceConfig> = {
  atcoder: {
    label: 'AtCoder',
    contests: () => atCoderClient.getContests(),
    tasks: () => atCoderClient.getTasks(),
  },
  aoj_courses: {
    label: 'AOJ - コース',
    contests: () => aojCoursesClient.getContests(),
    tasks: () => aojCoursesClient.getTasks(),
  },
  aoj_pck_prelim: buildAojChallengeConfig(
    { contestType: 'PCK', round: 'PRELIM' },
    'AOJ - パソコン甲子園 予選',
  ),
  aoj_pck_final: buildAojChallengeConfig(
    { contestType: 'PCK', round: 'FINAL' },
    'AOJ - パソコン甲子園 本選',
  ),
  aoj_jag_prelim: buildAojChallengeConfig(
    { contestType: 'JAG', round: 'PRELIM' },
    'AOJ - JAG 模擬国内',
  ),
  aoj_jag_regional: buildAojChallengeConfig(
    { contestType: 'JAG', round: 'REGIONAL' },
    'AOJ - JAG 模擬地区',
  ),
  aoj_icpc_prelim: buildAojChallengeConfig(
    { contestType: 'ICPC', round: 'PRELIM' },
    'AOJ - ICPC 国内予選',
  ),
  aoj_icpc_regional: buildAojChallengeConfig(
    { contestType: 'ICPC', round: 'REGIONAL' },
    'AOJ - ICPC アジア地区',
  ),
};

function buildAojChallengeConfig(
  params: ChallengeParams,
  label: string,
): ContestTaskImportSourceConfig {
  return {
    label,
    contests: () => aojChallengesClient.getContests(params),
    tasks: () => aojChallengesClient.getTasks(params),
  };
}

export const fetchContests = async (
  source: ContestTaskImportSource,
): Promise<ContestsForImport> => {
  const start = performance.now();
  const result = await importSources[source].contests();

  console.info('API metrics:', {
    source,
    type: 'contests',
    itemCount: result.length,
    apiTime: `${(performance.now() - start).toFixed(0)}ms`,
  });

  return result;
};

export const fetchTasks = async (source: ContestTaskImportSource): Promise<TasksForImport> => {
  const start = performance.now();
  const result = await importSources[source].tasks();

  console.info('API metrics:', {
    source,
    type: 'tasks',
    itemCount: result.length,
    apiTime: `${(performance.now() - start).toFixed(0)}ms`,
  });

  return result;
};

export const getImportSourceLabel = (source: ContestTaskImportSource): string =>
  importSources[source].label;

export const importSourceEntries = Object.entries(importSources) as [
  ContestTaskImportSource,
  ContestTaskImportSourceConfig,
][];

export function isContestTaskImportSource(value: unknown): value is ContestTaskImportSource {
  return typeof value === 'string' && Object.hasOwn(importSources, value);
}
