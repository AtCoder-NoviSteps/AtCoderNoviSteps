import type { ImportContests } from '$lib/types/contest';
import type { ImportTasks } from '$lib/types/task';

import * as atCoderProblemsApiClient from '$lib/clients/atcoder_problems';

// 各コンテストサイトのコンテスト情報・問題情報をAPIから取得・集約する
//
// 対応コンテストサイト (2024年10月現在)
// ・AtCoder: AtCoder Problems API
//   https://github.com/kenkoooo/AtCoderProblems/blob/master/doc/api.md

export async function getContests(): Promise<ImportContests> {
  const contests = await atCoderProblemsApiClient.getContests();

  return contests;
}

export async function getTasks(): Promise<ImportTasks> {
  const tasks = await atCoderProblemsApiClient.getTasks();

  return tasks;
}
