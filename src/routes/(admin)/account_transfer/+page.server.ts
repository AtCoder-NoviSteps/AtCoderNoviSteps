import { redirect, type Actions } from '@sveltejs/kit';

import * as userService from '$lib/services/users';
import * as taskResultService from '$lib/services/task_results';

import type { FloatingMessage } from '$lib/types/floating_message';

//import { sha256 } from '$lib/utils/hash';

import { Roles } from '$lib/types/user';

let accountTransferMessages: FloatingMessage[] = [];

export async function load({ locals }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }

  const user = await userService.getUser(session?.user.username as string);
  if (user?.role !== Roles.ADMIN) {
    throw redirect(302, '/login');
  }
  // see https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/1371#discussion_r1798353593
  return {
    success: true,
    results: accountTransferMessages,
  };
}

export const actions: Actions = {
  default: async function POST({ request }: { request: Request }) {
    try {
      const formData = await request.formData();
      const source_username: string =
        formData.get('source_username')?.toString().toLocaleLowerCase() ?? '';
      const destination_username: string =
        formData.get('destination_username')?.toString().toLocaleLowerCase() ?? '';

      //POSTされてこなかった場合は抜ける
      if (source_username === '' || destination_username === '') {
        return {
          success: true,
          accountTransferMessages: [],
        };
      } else {
        accountTransferMessages = await taskResultService.copyTaskResults(
          source_username,
          destination_username,
        );

        const message = {
          success: true,
          results: accountTransferMessages,
        };

        return message;
      }
    } catch (e) {
      console.error(e);
      return {
        success: false,
      };
    }
  },
};
