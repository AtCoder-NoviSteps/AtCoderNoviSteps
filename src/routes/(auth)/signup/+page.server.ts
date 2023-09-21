// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
import { auth } from '$lib/server/auth';
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
      const user = await auth.createUser({
        key: {
          providerId: 'username', // auth method
          providerUserId: username.toLowerCase(), // unique id when using "username" auth method
          password, // hashed by Lucia
        },
        attributes: {
          username,
        },
      });
      console.log(user);

      const session = await auth.createSession({
        userId: user.userId,
        attributes: {},
      });

      locals.auth.setSession(session); // set session cookie
    } catch (e) {
      // this part depends on the database you're using
      // check for unique constraint error in user table

      // TODO: 例外処理の方法を調べて実装
      // if (e instanceof SomeDatabaseError && e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR) {
      //   return fail(400, {
      //     message: 'Username already taken',
      //   });
      // }
      console.log('called');

      return fail(500, {
        message: 'An unknown error occurred',
      });
    }

    // redirect to
    // make sure you don't throw inside a try/catch block!
    throw redirect(302, '/profile');
  },
};
