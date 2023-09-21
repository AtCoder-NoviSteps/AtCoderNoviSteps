// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
import { auth } from '$lib/server/auth';
import { LuciaError } from 'lucia';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();

  if (session) {
    throw redirect(302, '/profile');
  }

  return {};
};

// TODO: FormとValidationライブラリを導入
export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    // 入力のチェック
    // TODO: 仕様を決めて、改めてチェック
    // TODO: エラーメッセージを日本語に
    if (typeof username !== 'string' || username.length < 4 || username.length > 31) {
      return fail(400, {
        message: 'Invalid username',
      });
    }

    if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
      return fail(400, {
        message: 'Invalid password',
      });
    }

    try {
      // find user by key
      // and validate password
      const key = await auth.useKey('username', username.toLowerCase(), password);
      const session = await auth.createSession({
        userId: key.userId,
        attributes: {},
      });

      locals.auth.setSession(session); // set session cookie
    } catch (e) {
      if (
        e instanceof LuciaError &&
        (e.message === 'AUTH_INVALID_KEY_ID' || e.message === 'AUTH_INVALID_PASSWORD')
      ) {
        // user does not exist or invalid password
        return fail(400, { message: 'Incorrect username or password' });
      }

      return fail(500, { message: 'An unknown error occurred' });
    }

    // redirect to
    // make sure you don't throw inside a try/catch block!
    throw redirect(302, '/profile');
  },
};
