// See:
// https://lucia-auth.com/getting-started/sveltekit/
// https://github.com/joysofcode/sveltekit-deploy
// https://tech-blog.rakus.co.jp/entry/20230209/sveltekit
import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

import * as userService from '$lib/services/users';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = auth.handleRequest(event);
  const session = await event.locals.auth.validate();

  if (!session) {
    return await resolve(event);
  }

  const user = await userService.getUser(session?.user.username as string);

  if (user) {
    event.locals.user = {
      id: user.id,
      name: user.username,
      role: user.role,
      atcoder_name: user.atcoder_username,
      is_validated: user.atcoder_validation_status,
    };
  }

  return await resolve(event);
};
