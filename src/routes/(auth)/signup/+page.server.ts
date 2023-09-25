// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
// https://superforms.rocks/get-started
import { superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';

import { authSchema } from '$lib/zod/schema';
import { auth } from '$lib/server/auth';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();

  if (session) {
    throw redirect(302, '/');
  }

  const form = await superValidate(null, authSchema);

  return { form };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, authSchema);

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const user = await auth.createUser({
        key: {
          providerId: 'username', // auth method
          providerUserId: form.data.username.toLowerCase(), // unique id when using "username" auth method
          password: form.data.password, // hashed by Lucia
        },
        attributes: {
          username: form.data.username,
        },
      });

      const session = await auth.createSession({
        userId: user.userId,
        attributes: {},
      });

      locals.auth.setSession(session); // set session cookie
    } catch (e) {
      // this part depends on the database you're using
      // check for unique constraint error in user table

      // TODO: 例外処理の方法を調べて実装
      // 既に登録されている場合は、ユーザ名 or パスワードを変えるようにメッセージを出す
      // return fail(400, { form });
      // if (e instanceof SomeDatabaseError && e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR) {
      //   return fail(400, {
      //     message: 'Username already taken',
      //   });
      // }

      return fail(500, {
        message: 'サーバでエラーが発生しました',
        form: form,
      });
    }

    // redirect to
    // make sure you don't throw inside a try/catch block!
    throw redirect(302, '/');
  },
};
