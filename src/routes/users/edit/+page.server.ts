//See https://tech-blog.rakus.co.jp/entry/20230209/sveltekit#%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E6%8A%95%E7%A8%BF%E7%94%BB%E9%9D%A2
import { redirect, fail } from '@sveltejs/kit';

import type { Actions } from './$types';
import type { Roles } from '$lib/types/user';

import * as userService from '$lib/services/users';
import * as verificationService from '$features/account/services/atcoder_verification';

import {
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
} from '$lib/constants/http-response-status-codes';

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
      atCoderAccount: {
        handle: user?.atCoderAccount?.handle ?? '',
        validationCode: user?.atCoderAccount?.validationCode ?? '',
        isValidated: user?.atCoderAccount?.isValidated ?? false,
      },
      message_type: '',
      message: '',
      openAtCoderTab: url.searchParams.get('tab') === 'atcoder',
    };
  } catch (error) {
    console.error('User lookup failed during session validation', error);
    redirect(302, '/login');
  }
}

export const actions: Actions = {
  generate: async ({ request, locals }) => {
    const parsed = await parseUsernameAndAuthorize(request, locals);

    if (!parsed.ok) {
      return parsed.error;
    }

    const { formData, username } = parsed;
    const handle = formData.get('handle')?.toString();

    if (!handle) {
      return fail(BAD_REQUEST, { message: 'AtCoder username is required.' });
    }

    try {
      const validationCode = await verificationService.generate(username, handle);

      return {
        success: true,
        username,
        handle,
        validationCode,
        isTabAtcoder: true,
      };
    } catch (error) {
      console.error('Failed to generate validation code', error);
      return fail(INTERNAL_SERVER_ERROR, { message: 'Failed to generate validation code.' });
    }
  },

  validate: async ({ request, locals }) => {
    const parsed = await parseUsernameAndAuthorize(request, locals);

    if (!parsed.ok) {
      return parsed.error;
    }

    const { username } = parsed;

    try {
      const is_validated = await verificationService.validate(username);

      return {
        success: is_validated,
        message_type: is_validated ? 'green' : 'red',
        message: is_validated
          ? 'Successfully validated.'
          : 'Validation failed. Please check your AtCoder affiliation.',
      };
    } catch (error) {
      console.error('Failed to validate AtCoder account', error);
      return fail(INTERNAL_SERVER_ERROR, { message: 'Failed to validate AtCoder account.' });
    }
  },

  reset: async ({ request, locals }) => {
    const parsed = await parseUsernameAndAuthorize(request, locals);

    if (!parsed.ok) {
      return parsed.error;
    }

    const { username } = parsed;

    try {
      await verificationService.reset(username);

      return {
        success: true,
        username,
        message_type: 'green',
        message: 'Successfully reset.',
      };
    } catch (error) {
      console.error('Failed to reset AtCoder account', error);
      return fail(INTERNAL_SERVER_ERROR, { message: 'Failed to reset AtCoder account.' });
    }
  },

  delete: async ({ request, locals }) => {
    const parsed = await parseUsernameAndAuthorize(request, locals);

    if (!parsed.ok) {
      return parsed.error;
    }

    const { username } = parsed;

    try {
      await userService.deleteUser(username);
      locals.auth.setSession(null); // remove cookie

      return {
        success: true,
        username,
        message_type: 'green',
        message: 'Successfully deleted.',
      };
    } catch (error) {
      console.error('Failed to delete user account', error);
      return fail(INTERNAL_SERVER_ERROR, { message: 'Failed to delete account.' });
    }
  },
};

type ParseResult =
  | { ok: true; formData: FormData; username: string }
  | { ok: false; error: ReturnType<typeof fail> };

/** Reads username from formData and verifies the request is from the same user. */
async function parseUsernameAndAuthorize(
  request: Request,
  locals: App.Locals,
): Promise<ParseResult> {
  const formData = await request.formData();
  const username = formData.get('username')?.toString();

  if (!username) {
    return { ok: false, error: fail(BAD_REQUEST, { message: 'Username is required.' }) };
  }

  const authError = await requireSelf(locals, username);

  if (authError) {
    return { ok: false, error: authError };
  }

  return { ok: true, formData, username };
}

/** Validates the session and checks that the given username matches the logged-in user. */
async function requireSelf(
  locals: App.Locals,
  username: string,
): Promise<ReturnType<typeof fail> | null> {
  const session = await locals.auth.validate();

  if (!session) {
    return fail(UNAUTHORIZED, { message: 'Not authenticated.' });
  }
  if (session.user.username !== username) {
    return fail(FORBIDDEN, { message: 'Not authorized.' });
  }
  return null;
}
