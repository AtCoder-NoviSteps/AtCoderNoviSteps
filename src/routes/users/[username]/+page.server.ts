//See https://tech-blog.rakus.co.jp/entry/20230209/sveltekit#%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E6%8A%95%E7%A8%BF%E7%94%BB%E9%9D%A2

import { redirect } from '@sveltejs/kit';

import * as userService from '$lib/services/users';
import * as taskResultService from '$lib/services/task_results';

import type { Roles } from '$lib/types/user';
import type { TaskResult } from '$lib/types/task';

import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

export async function load({ locals, params }) {
  const session = await locals.auth.validate();
  if (!session) {
    redirect(TEMPORARY_REDIRECT, '/login');
  }

  try {
    const user = await userService.getUser(params.username as string);

    if (!user) {
      return {
        userId: params.username as string,
        username: '' as string,
        atcoder_username: '' as string,
        role: '' as string,
        isLoggedIn: false as boolean,
        taskResults: null,
      };
    }

    const taskResultsMap = await taskResultService.getTaskResultsOnlyResultExists(
      user?.id as string,
    );
    const taskResults = Array.from(taskResultsMap.values()).sort(
      (firstTaskResult: TaskResult, secondTaskResult: TaskResult) =>
        firstTaskResult.updated_at > secondTaskResult.updated_at ? -1 : 1,
    );

    return {
      userId: user?.id as string,
      username: user?.username as string,
      atcoder_username: user?.atcoder_username as string,
      role: user?.role as Roles,
      isLoggedIn: (session?.user.userId === user?.id) as boolean,
      taskResults: taskResults,
    };
  } catch (e) {
    console.error('Failed to load user or taskResults: ', session?.user.username);
    console.error(e);
    //500を投げたい
    //throw redirect(302, '/login');
  }
}
