import { error } from '@sveltejs/kit';

import { FORBIDDEN } from '$lib/constants/http-response-status-codes';

export async function load({ locals }) {
  const session = await locals.auth.validate();

  if (session) {
    error(
      FORBIDDEN,
      `ログイン中は、パスワードリセット / アカウント移行ページにアクセスできません。`,
    );
  }

  return {};
}
