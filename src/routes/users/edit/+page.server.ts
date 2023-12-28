//See https://tech-blog.rakus.co.jp/entry/20230209/sveltekit#%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E6%8A%95%E7%A8%BF%E7%94%BB%E9%9D%A2

import type { Roles } from '$lib/types/user';
import * as crud from '$lib/services/users';

import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }

  try {
    const user = await crud.getUser(session?.user.username as string);

    return {
      userId: user?.id as string,
      username: user?.username as string,
      role: user?.role as Roles,
      isLoggedIn: (session?.user.userId === user?.id) as boolean,
      atcoder_username: user?.atcoder_username as string,
      atcoder_validationcode: user?.atcoder_validation_code as string,
      is_validated: user?.atcoder_validation_status as boolean,
    };
  } catch (e) {
    console.log("Can't find usrname:", session?.user.username);
    throw redirect(302, '/login');
  }
}
