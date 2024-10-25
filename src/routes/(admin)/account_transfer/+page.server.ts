// See:
// https://superforms.rocks/get-started
import { redirect, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

import * as userService from '$lib/services/users';
import * as taskResultService from '$lib/services/task_results';

import { accountTransferSchema } from '$lib/zod/schema';
import type { FloatingMessage } from '$lib/types/floating_message';

import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';
import { LOGIN_PAGE } from '$lib/constants/navbar-links';
import { Roles } from '$lib/types/user';

let accountTransferMessages: FloatingMessage[] = [];

export async function load({ locals }) {
  const session = await locals.auth.validate();

  if (!session) {
    throw redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }

  const user = await userService.getUser(session?.user.username as string);

  if (user && user.role !== Roles.ADMIN) {
    throw redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }

  const form = await superValidate(null, zod(accountTransferSchema));

  // HACK: accountTransferMessagesは、アカウント移行に関するメッセージを確実に表示するために必要。
  // 原因: form送信後にload関数が呼び出されているため。
  //
  // See:
  // https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/1371#discussion_r1798353593
  return {
    success: true,
    form: { ...form, message: '' },
    accountTransferMessages: accountTransferMessages,
  };
}

export const actions: Actions = {
  default: async ({ request }) => {
    try {
      const form = await superValidate(request, zod(accountTransferSchema));

      if (!form.valid) {
        return {
          success: false,
          form: {
            ...form,
            message: 'アカウントの移行に失敗しました。新旧アカウント名を再入力してください。',
          },
          accountTransferMessages: null,
        };
      }

      accountTransferMessages = await taskResultService.copyTaskResults(
        form.data.sourceUserName.toLowerCase(),
        form.data.destinationUserName.toLowerCase(),
      );

      return {
        success: true,
        form: { ...form, message: '' },
        accountTransferMessages: accountTransferMessages,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        form: null,
        accountTransferMessages: accountTransferMessages,
      };
    }
  },
};
