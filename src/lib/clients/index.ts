import type { ImportContests } from '$lib/types/contest';
import type { ImportTasks } from '$lib/types/task';

import * as atCoderProblemsApiClient from '$lib/clients/atcoder_problems';
import * as aojApiClient from '$lib/clients/aizu_online_judge';

// 各コンテストサイトのコンテスト情報・問題情報をAPIから取得・集約する
//
// 対応コンテストサイト (2024年10月現在)
// ・AtCoder: AtCoder Problems API
//   https://github.com/kenkoooo/AtCoderProblems/blob/master/doc/api.md
//
// ・AIZU ONLINE JUDGE (AOJ)
//   ・Courses
//   ・Challenges
//     ・PCK (All-Japan High School Programming Contest)

export async function getContests(): Promise<ImportContests> {
  const [atcoder, aoj] = await Promise.all([
    atCoderProblemsApiClient.getContests(),
    aojApiClient.getContests(),
  ]);
  const contests = atcoder.concat(aoj);

  return contests;
}

export async function getTasks(): Promise<ImportTasks> {
  const [atcoder, aoj] = await Promise.all([
    atCoderProblemsApiClient.getTasks(),
    aojApiClient.getTasks(),
  ]);
  const tasks = atcoder.concat(aoj);

  return tasks;
}
