// See:
// https://lucia-auth.com/getting-started/sveltekit/
// https://github.com/joysofcode/sveltekit-deploy
import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = auth.handleRequest(event);
  return await resolve(event);
};
