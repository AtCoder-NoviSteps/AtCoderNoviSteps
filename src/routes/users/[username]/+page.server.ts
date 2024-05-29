//See https://tech-blog.rakus.co.jp/entry/20230209/sveltekit#%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E6%8A%95%E7%A8%BF%E7%94%BB%E9%9D%A2

import type { Roles } from '$lib/types/user';
import type { TaskResult } from '$lib/types/task';
import * as userService from '$lib/services/users';
import * as taskResultService from '$lib/services/task_results';

import { redirect } from '@sveltejs/kit';

export async function load({ locals, params }) {
  const session = await locals.auth.validate();
  if (!session) {
    redirect(302, '/login');
  }

  try {
    const user = await userService.getUser(params.username as string);
    console.log(user?.id);

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

    const taskResults = await taskResultService.getTaskResultsOnlyResultExists(user?.id as string);
    taskResults.sort((firstObject: TaskResult, secondObject: TaskResult) =>
      firstObject.updated_at > secondObject.updated_at ? -1 : 1,
    );
    console.log('taskResults:', taskResults);

    return {
      userId: user?.id as string,
      username: user?.username as string,
      atcoder_username: user?.atcoder_username as string,
      role: user?.role as Roles,
      isLoggedIn: (session?.user.userId === user?.id) as boolean,
      taskResults: taskResults,
    };
  } catch (e) {
    console.log('fail to load user or taskResults:', session?.user.username);
    console.log(e);
    //500を投げたい
    //throw redirect(302, '/login');
  }
}
