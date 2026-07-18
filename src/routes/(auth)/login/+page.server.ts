// This route uses centralized helpers with fallback validation strategies.
// See src/lib/utils/auth_forms.ts for the current form handling approach.
import { fail, redirect } from '@sveltejs/kit';

import { createSession } from '$features/auth/server/session';
import { authenticateUser } from '$features/auth/services/credentials';

import { initializeAuthForm, validateAuthFormWithFallback } from '$lib/utils/auth_forms';
import { isSameOriginRedirect } from '$lib/utils/url';

import {
  BAD_REQUEST,
  SEE_OTHER,
  INTERNAL_SERVER_ERROR,
} from '$lib/constants/http-response-status-codes';
import { HOME_PAGE } from '$lib/constants/navbar-links';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  return initializeAuthForm(locals);
};

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const form = await validateAuthFormWithFallback(request);

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
      // find the user by username and validate the password
      const authenticated = await authenticateUser(form.data.username, form.data.password);

      // null means the user does not exist or the password is wrong (indistinguishable by design)
      if (!authenticated) {
        return fail(BAD_REQUEST, {
          form: {
            ...form,
            message:
              'ログインできませんでした。登録したユーザ名 / パスワードとなるように修正してください。',
          },
        });
      }

      const session = await createSession(authenticated.userId);
      locals.auth.setSession(session); // set session cookie
    } catch {
      // unexpected failure (e.g. DB error); invalid credentials already map to null above
      return fail(INTERNAL_SERVER_ERROR, {
        form: {
          ...form,
          message: 'サーバでエラーが発生しました。本サービスの開発・運営チームに連絡してください。',
        },
      });
    }

    const redirectTo = url.searchParams.get('redirectTo');
    let destination = HOME_PAGE;

    if (redirectTo && isSameOriginRedirect(redirectTo, url.origin)) {
      destination = redirectTo;
    }

    // redirect to
    // make sure you don't throw inside a try/catch block!
    redirect(SEE_OTHER, destination);
  },
};
