// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
// https://superforms.rocks/get-started
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { LuciaError } from 'lucia';

import { authSchema } from '$lib/zod/schema';
import { auth } from '$lib/server/auth';

import {
  BAD_REQUEST,
  SEE_OTHER,
  INTERNAL_SERVER_ERROR,
} from '$lib/constants/http-response-status-codes';
import { HOME_PAGE } from '$lib/constants/navbar-links';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();

  if (session) {
    redirect(SEE_OTHER, HOME_PAGE);
  }

  const form = await superValidate(null, zod(authSchema));

  return { form: { ...form, message: '' } };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod(authSchema));

    if (!form.valid) {
      return fail(BAD_REQUEST, {
        form: {
          ...form,
          message:
            'ログインできませんでした。登録したユーザ名 / パスワードとなるように修正してください。',
        },
      });
    }

    try {
      // find user by key
      // and validate password
      const key = await auth.useKey(
        'username',
        form.data.username.toLowerCase(),
        form.data.password,
      );
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
        return fail(BAD_REQUEST, {
          form: {
            ...form,
            message:
              'ログインできませんでした。登録したユーザ名 / パスワードとなるように修正してください。',
          },
        });
      }

      return fail(INTERNAL_SERVER_ERROR, {
        form: {
          ...form,
          message: 'サーバでエラーが発生しました。本サービスの開発・運営チームに連絡してください。',
        },
      });
    }

    // redirect to
    // make sure you don't throw inside a try/catch block!
    redirect(SEE_OTHER, HOME_PAGE);
  },
};
