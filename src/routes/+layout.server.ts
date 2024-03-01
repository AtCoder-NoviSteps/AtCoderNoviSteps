// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
import { Roles } from '$lib/types/user';

export const load = async ({ locals }) => {
  const session = await locals.auth.validate();

  return {
    isAdmin: session?.user.role === Roles.ADMIN,
  };
};
