// This route uses centralized helpers with fallback validation strategies.
// See src/lib/utils/auth_forms.ts for the current form handling approach.
import { fail, redirect } from '@sveltejs/kit';

import { createSession } from '$features/auth/server/session';
import { registerUser } from '$features/auth/services/credentials';

import { initializeAuthForm, validateAuthFormWithFallback } from '$lib/utils/auth_forms';
import { isSameOriginRedirect } from '$lib/utils/url';

import {
  SEE_OTHER,
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
} from '$lib/constants/http-response-status-codes';
import { HOME_PAGE } from '$lib/constants/navbar-links';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  return initializeAuthForm(locals);
};

// FIXME: エラー処理に共通部分があるため、リファクタリングをしましょう。
export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const form = await validateAuthFormWithFallback(request);

    if (!form.valid) {
      return fail(BAD_REQUEST, {
        form: {
          ...form,
          message:
            'アカウントを作成できませんでした。指定された条件を満たすようにユーザ名 / パスワードを修正してください。',
        },
      });
    }

    try {
      const registered = await registerUser(form.data.username, form.data.password);

      // null means the username is already taken (duplicate user or key)
      if (!registered) {
        return fail(BAD_REQUEST, {
          form: {
            ...form,
            message:
              'アカウントを作成できませんでした。指定されたユーザ名はすでに使用されているため、修正・変更してください。',
          },
        });
      }

      const session = await createSession(registered.userId);
      locals.auth.setSession(session); // set session cookie
    } catch {
      // unexpected failure (e.g. DB error); registerUser already maps duplicates to null above
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
    return redirect(SEE_OTHER, destination);
  },
};
