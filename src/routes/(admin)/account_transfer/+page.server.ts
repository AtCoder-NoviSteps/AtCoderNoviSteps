import { redirect, type Actions } from '@sveltejs/kit';

import * as userService from '$lib/services/users';
import * as taskResultService from '$lib/services/task_results';

import type { Check } from '$lib/types/check';

//import { sha256 } from '$lib/utils/hash';

import { Roles } from '$lib/types/user';

let checkResults: Check[] = [];

export async function load({ locals }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }

  const user = await userService.getUser(session?.user.username as string);
  if (user?.role !== Roles.ADMIN) {
    throw redirect(302, '/login');
  }

  return {
    success: true,
    results: checkResults,
  };
}

export const actions: Actions = {
  default: async function POST({ request }: { request: Request }) {
    try {
      const formData = await request.formData();
      const source_username: string = formData.get('source_username')?.toString() ?? '';
      const destination_username: string = formData.get('destination_username')?.toString() ?? '';

      //POSTされてこなかった場合は抜ける
      if (source_username === '' || destination_username === '') {
        return {
          success: true,
          checkResults: [],
        };
      } else {
        checkResults = await taskResultService.copyTaskResults(
          source_username,
          destination_username,
        );

        const message = {
          success: true,
          results: checkResults,
        };

        return message;
      }
    } catch (e) {
      console.log(e);
      return {
        success: false,
      };
    }
  },
};
