//See https://tech-blog.rakus.co.jp/entry/20230209/sveltekit#%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E6%8A%95%E7%A8%BF%E7%94%BB%E9%9D%A2

import * as userService from '$lib/services/users';
import * as taskResultService from '$lib/services/task_results';
import { getLoggedInUser } from '$features/auth/services/session_guards';

import type { Roles } from '$lib/types/user';
import type { TaskResult } from '$lib/types/task';

export async function load({ locals, params, url }) {
  const loggedInUser = await getLoggedInUser(locals, url);

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
      userId: user.id,
      username: user.username,
      atcoder_username: user.atCoderAccount?.handle ?? '',
      role: user.role as Roles,
      isLoggedIn: loggedInUser?.id === user.id,
      taskResults: taskResults,
    };
  } catch (e) {
    console.error('Failed to load user or taskResults: ', loggedInUser?.name);
    console.error(e);
    //500を投げたい
    //throw redirect(302, '/login');
  }
}
