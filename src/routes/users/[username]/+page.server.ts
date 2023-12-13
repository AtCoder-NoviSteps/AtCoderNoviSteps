//See https://tech-blog.rakus.co.jp/entry/20230209/sveltekit#%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E6%8A%95%E7%A8%BF%E7%94%BB%E9%9D%A2

import type { Roles } from '$lib/types/user';
import * as crud from '$lib/services/users';

import { redirect } from '@sveltejs/kit';

export async function load({ locals, params }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }

  const user = await crud.getUser(params.username as string);

  return {
    userId: user?.id as string,
    username: user?.username as string,
    role: user?.role as Roles,
    isLoggedIn: (session?.user.userId === user?.id) as boolean,
  };
}
