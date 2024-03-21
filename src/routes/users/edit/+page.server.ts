//See https://tech-blog.rakus.co.jp/entry/20230209/sveltekit#%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E6%8A%95%E7%A8%BF%E7%94%BB%E9%9D%A2

import type { Roles } from '$lib/types/user';
import type { Task } from '$lib/types/task';
import type { TaskAnswer } from '$lib/types/answer';

import * as userService from '$lib/services/users';
import * as validationService from '$lib/services/validateApiService';
import * as taskService from '$lib/services/tasks';
import * as answerService from '$lib/services/answers';
import type { Actions } from './$types';

import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }

  try {
    const user = await userService.getUser(session?.user.username as string);

    return {
      userId: user?.id as string,
      username: user?.username as string,
      role: user?.role as Roles,
      isLoggedIn: (session?.user.userId === user?.id) as boolean,
      atcoder_username: user?.atcoder_username as string,
      atcoder_validationcode: user?.atcoder_validation_code as string,
      is_validated: user?.atcoder_validation_status as boolean,
      message_type: '',
      message: '',
    };
  } catch (e) {
    console.log("Can't find username:", session?.user.username);
    throw redirect(302, '/login');
  }
}

export const actions: Actions = {
  generate: async ({ request }) => {
    console.log('users->actions->generate');
    const formData = await request.formData();
    const username = formData.get('username')?.toString() as string;
    const atcoder_username = formData.get('atcoder_username')?.toString() as string;

    //console.log('ここにvalidationCodeを作成してデータベースに登録するコードを書きます');
    const validationCode = await validationService.generate(username, atcoder_username);

    return {
      success: true,
      username: username,
      atcoder_username: atcoder_username,
      atcoder_validationcode: validationCode,
      is_tab_atcoder: true,
    };
  },

  validate: async ({ request }) => {
    console.log('users->actions->validate');
    const formData = await request.formData();
    const username = formData.get('username')?.toString() as string;
    const atcoder_username = formData.get('atcoder_username')?.toString() as string;
    const atcoder_validationcode = formData.get('atcoder_validationcode')?.toString() as string;

    //console.log('validateを呼び、AtCoderの所属欄とAPI呼び出した結果が一致しているかを確認');
    const is_validated = await validationService.validate(username);

    return {
      success: is_validated,
      user: {
        username: username,
        atcoder_username: atcoder_username,
        atcoder_validationcode: atcoder_validationcode,
        message_type: 'green',
        message: 'Successfully validated.',
      },
    };
  },

  reset: async ({ request }) => {
    console.log('users->actions->edit');
    const formData = await request.formData();
    const username = formData.get('username')?.toString() as string;
    const atcoder_username = formData.get('atcoder_username')?.toString() as string;

    //console.log('AtCoderのユーザ名とValicationCodeをリセットする。');
    const validationCode = await validationService.reset(username);

    return {
      success: true,
      username: username,
      atcoder_username: atcoder_username,
      atcoder_validationcode: validationCode,
      message_type: 'green',
      message: 'Successfully reset.',
    };
  },

  delete: async ({ request, locals }) => {
    console.log('users->actions->delete');
    const formData = await request.formData();
    const username = formData.get('username')?.toString() as string;
    const atcoder_username = formData.get('atcoder_username')?.toString() as string;

    await userService.deleteUser(username);
    locals.auth.setSession(null); // remove cookie

    return {
      success: true,
      username: username,
      atcoder_username: atcoder_username,
      atcoder_validationcode: false,
      message_type: 'green',
      message: 'Successfully deleted.',
    };
  },

  fetch: async ({ request, locals }) => {
    console.log('users->actions->fetch');
    console.time();

    // FIXME: 他のActionsと重複したコードが多いので、汎用メソッドとして切り出す
    const session = await locals.auth.validate();
    const userId = session?.user.userId;

    const formData = await request.formData();
    const atcoder_username = formData.get('atcoder_username')?.toString() as string;

    // TODO: フォームからAtCoder ProblemsのSubmission APIで指定する日時データを取得
    // TODO: 日時が指定されていない場合にも対処できるようにする
    // 本アプリでユーザが未登録 / 未回答の問題を抽出
    const unansweredTasks: Map<string, Task> = await taskService.extractUnansweredTasks(userId);

    // 上記の問題のうち、AtCoder ProblemsのSubmission APIから取得できた回答(ACもしくはWA)を抽出
    // 2024年3月時点の仕様: 同じ問題で複数の提出がある場合は、最新の結果のみ取得
    const startTimeInUnixSecond = 1710000000;
    const fetchedTaskAnswers: Map<string, TaskAnswer> =
      await answerService.extractUnregisteredAnswersFromSubmissionsAPI(
        atcoder_username,
        startTimeInUnixSecond,
        unansweredTasks,
        userId,
      );

    console.log(`Fetched answers count: ${fetchedTaskAnswers.size}`);

    fetchedTaskAnswers.forEach(async (taskAnswer: TaskAnswer, taskId: string) => {
      const userId: string = taskAnswer.user_id;
      const answerStatusId: string = taskAnswer.status_id;
      const answer = await answerService.getAnswer(taskId, userId);

      if (!answer) {
        await answerService.createAnswer(taskId, userId, answerStatusId);
      }
    });

    console.timeEnd();

    return {
      success: true,
      atcoder_username: atcoder_username,
    };
  },
};

// TODO: インポートする問題をユーザが選択してから、回答状況を一括で処理できるようにする
