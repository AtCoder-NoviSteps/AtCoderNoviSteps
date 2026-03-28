//See https://tech-blog.rakus.co.jp/entry/20230209/sveltekit#%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E6%8A%95%E7%A8%BF%E7%94%BB%E9%9D%A2

import type { Roles } from '$lib/types/user';
import * as userService from '$lib/services/users';
import * as verificationService from '$features/account/services/atcoder_verification';
import type { Actions } from './$types';

import { redirect, fail } from '@sveltejs/kit';
import { FORBIDDEN } from '$lib/constants/http-response-status-codes';

export async function load({ locals, url }) {
  const session = await locals.auth.validate();
  if (!session) {
    redirect(302, '/login');
  }

  try {
    const user = await userService.getUser(session?.user.username as string);

    return {
      userId: user?.id as string,
      username: user?.username as string,
      role: user?.role as Roles,
      isLoggedIn: (session?.user.userId === user?.id) as boolean,
      atcoder_username: user?.atCoderAccount?.handle ?? '',
      atcoder_validationcode: user?.atCoderAccount?.validationCode ?? '',
      is_validated: user?.atCoderAccount?.isValidated ?? false,
      message_type: '',
      message: '',
      openAtCoderTab: url.searchParams.get('tab') === 'atcoder',
    };
  } catch (error) {
    console.error('Not found username: ', session?.user.username, error);
    redirect(302, '/login');
  }
}

export const actions: Actions = {
  generate: async ({ request, locals }) => {
    const session = await locals.auth.validate();
    if (!session) {
      return fail(FORBIDDEN, { message: 'Not authenticated.' });
    }

    const formData = await request.formData();
    const username = formData.get('username')?.toString() as string;

    if (session.user.username !== username) {
      return fail(FORBIDDEN, { message: 'Not authorized.' });
    }

    const atcoder_username = formData.get('atcoder_username')?.toString() as string;

    const validationCode = await verificationService.generate(username, atcoder_username);

    return {
      success: true,
      username,
      atcoder_username,
      atcoder_validationcode: validationCode,
      is_tab_atcoder: true,
    };
  },

  validate: async ({ request, locals }) => {
    const session = await locals.auth.validate();
    if (!session) {
      return fail(FORBIDDEN, { message: 'Not authenticated.' });
    }

    const formData = await request.formData();
    const username = formData.get('username')?.toString() as string;

    if (session.user.username !== username) {
      return fail(FORBIDDEN, { message: 'Not authorized.' });
    }

    const is_validated = await verificationService.validate(username);

    return {
      success: is_validated,
      message_type: is_validated ? 'green' : 'red',
      message: is_validated
        ? 'Successfully validated.'
        : 'Validation failed. Please check your AtCoder affiliation.',
    };
  },

  reset: async ({ request, locals }) => {
    const session = await locals.auth.validate();
    if (!session) {
      return fail(FORBIDDEN, { message: 'Not authenticated.' });
    }

    const formData = await request.formData();
    const username = formData.get('username')?.toString() as string;

    if (session.user.username !== username) {
      return fail(FORBIDDEN, { message: 'Not authorized.' });
    }

    const atcoder_username = formData.get('atcoder_username')?.toString() as string;

    await verificationService.reset(username);

    return {
      success: true,
      username,
      atcoder_username,
      atcoder_validationcode: '',
      message_type: 'green',
      message: 'Successfully reset.',
    };
  },

  delete: async ({ request, locals }) => {
    const session = await locals.auth.validate();
    if (!session) {
      return fail(FORBIDDEN, { message: 'Not authenticated.' });
    }

    const formData = await request.formData();
    const username = formData.get('username')?.toString() as string;

    if (session.user.username !== username) {
      return fail(FORBIDDEN, { message: 'Not authorized.' });
    }

    await userService.deleteUser(username);
    locals.auth.setSession(null); // remove cookie

    return {
      success: true,
      username,
      atcoder_validationcode: '',
      message_type: 'green',
      message: 'Successfully deleted.',
    };
  },
};
