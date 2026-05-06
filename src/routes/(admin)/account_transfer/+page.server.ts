// See:
// https://superforms.rocks/get-started
import { type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';

import * as taskResultService from '$lib/services/task_results';

import { accountTransferSchema } from '$lib/zod/schema';
import type { FloatingMessage } from '$lib/types/floating_message';

import { validateAdminAccess } from '$features/auth/services/admin_access';

let accountTransferMessages: FloatingMessage[] = [];

export async function load({ locals, url }) {
  await validateAdminAccess(locals, url);

  const form = await superValidate(null, zod4(accountTransferSchema));

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
  default: async ({ request, locals, url }) => {
    await validateAdminAccess(locals, url);

    try {
      const form = await superValidate(request, zod4(accountTransferSchema));

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
