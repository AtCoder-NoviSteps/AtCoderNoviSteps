import type { ContestsForImport, ContestForImport } from '$lib/types/contest';
import type { TasksForImport, TaskForImport } from '$lib/types/task';

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

export async function getContests(): Promise<ContestsForImport> {
  try {
    const [atcoder, aoj] = await Promise.all([
      atCoderProblemsApiClient.getContests().catch((error) => {
        console.error('Failed to fetch from AtCoder contests', error);
        return [];
      }),
      aojApiClient.getContests().catch((error) => {
        console.error('Failed to fetch from AOJ contests', error);
        return [];
      }),
    ]);

    const contestsMap = new Map<string, ContestForImport>();

    [...atcoder, ...aoj].forEach((contest) => {
      contestsMap.set(contest.id, contest);
    });

    return Array.from(contestsMap.values());
  } catch (error) {
    console.error('Failed to fetch contests', error);
    throw error;
  }
}

export async function getTasks(): Promise<TasksForImport> {
  try {
    const [atcoder, aoj] = await Promise.all([
      atCoderProblemsApiClient.getTasks().catch((error) => {
        console.error('Failed to fetch from AtCoder tasks', error);
        return [];
      }),
      aojApiClient.getTasks().catch((error) => {
        console.error('Failed to fetch from AOJ tasks', error);
        return [];
      }),
    ]);

    const tasksMap = new Map<string, TaskForImport>();

    [...atcoder, ...aoj].forEach((task) => {
      tasksMap.set(task.id, task);
    });

    return Array.from(tasksMap.values());
  } catch (error) {
    console.error('Failed to fetch tasks', error);
    throw error;
  }
}
